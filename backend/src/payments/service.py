import json
import stripe
from typing import Any, Dict, List, Tuple
from fastapi import HTTPException, status
from config import SECRET_KEY, STRIPE_SECRET_KEY, FRONTEND_BASE_URL
from sqlalchemy.orm import Session


def _ensure_stripe_key():
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Stripe key not configured")
    stripe.api_key = STRIPE_SECRET_KEY


def _type_to_code(t: str) -> str:
    t = (t or '').lower()
    if 'ulg' in t:
        return 'U'
    if 'senior' in t:
        return 'S'
    if 'stud' in t:
        return 'T'
    return 'N'


def _code_to_type(c: str) -> str:
    c = (c or 'N').upper()
    return {
        'U': 'Bilet ulgowy',
        'S': 'Bilet seniora',
        'T': 'Bilet studencki',
        'N': 'Bilet normalny',
    }.get(c, 'Bilet normalny')


def _row_label(index: int) -> str:
    if index is None or index < 0:
        return ''
    label = ''
    n = int(index) + 1
    while n > 0:
        rem = (n - 1) % 26
        label = chr(65 + rem) + label
        n = (n - 1) // 26
    return label


def _encode_seats(seats: List[Dict[str, Any]]) -> str:
    parts: List[str] = []
    for s in seats:
        r = s.get('row_index')
        c = s.get('col_index')
        if r is None and s.get('row_label'):
            lbl = str(s.get('row_label'))
            val = 0
            for ch in lbl:
                val = val * 26 + (ord(ch.upper()) - 64)
            r = max(0, val - 1)
        if c is None and s.get('seat_number') is not None:
            c = int(s.get('seat_number')) - 1
        price_cents = int(round(float(s.get('price', 0)) * 100))
        code = _type_to_code(s.get('type') or '')
        if r is None or c is None:
            continue
        parts.append(f"{int(r)},{int(c)},{code},{price_cents}")
    return ';'.join(parts)


def _decode_seats(seat_str: str) -> List[Dict[str, Any]]:
    seats: List[Dict[str, Any]] = []
    if not seat_str:
        return seats
    for token in seat_str.split(';'):
        token = token.strip()
        if not token:
            continue
        try:
            r_str, c_str, code, price_cents_str = token.split(',')
            r = int(r_str)
            c = int(c_str)
            price = int(price_cents_str) / 100.0
            row_label = _row_label(r)
            seat_number = c + 1
            seat_txt = f"{row_label}-{seat_number}"
            seats.append({
                'row_index': r,
                'col_index': c,
                'row_label': row_label,
                'seat_number': seat_number,
                'seat': seat_txt,
                'price': price,
                'type': _code_to_type(code),
            })
        except Exception:
            continue
    return seats


def _attach_qr_code(ticket):
    try:
        import pyqrcode
        import base64
        import io
        code = getattr(ticket, 'ticket_code', None)
        data_str = str(code) if code is not None else ''
        qr = pyqrcode.create(data_str, error='M')
        buf = io.BytesIO()
        qr.png(buf, scale=4)
        b64 = base64.b64encode(buf.getvalue()).decode('ascii')
        setattr(ticket, 'qr_code_data_url', f"data:image/png;base64,{b64}")
    except Exception:
        setattr(ticket, 'qr_code_data_url', None)


def _normalize_hall_value(h: Any) -> int | None:
    if h is None:
        return None
    try:
        s = str(h).strip()
    except Exception:
        return None
    if not s:
        return None
    ls = s.lower()
    if ls.startswith('sala'):
        # remove possible prefix like 'Sala ' or 'sala-'
        s = s.split(None, 1)[1] if ' ' in s else s[4:]
        s = s.strip().lstrip('-').strip()
    try:
        return int(s)
    except Exception:
        return None


def create_checkout_session(user_id: int, user_email: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    _ensure_stripe_key()

    seats = payload.get('seats') or []
    schedule_id = payload.get('schedule_id')
    hall_raw = payload.get('hall')
    hall_num = _normalize_hall_value(hall_raw)

    line_items = []
    for s in seats:
        price = int(round(float(s.get('price', 0)) * 100))
        row_label = s.get('row_label') or ''
        seat_number = s.get('seat_number') or ''
        name = f"Bilet {row_label}-{seat_number}"
        line_items.append({
            'price_data': {
                'currency': 'pln',
                'product_data': { 'name': name },
                'unit_amount': price
            },
            'quantity': 1
        })

    seats_compact = _encode_seats(seats)

    success_url = payload.get('success_url') or f"{FRONTEND_BASE_URL}/user-profile?paid=1&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = payload.get('cancel_url') or f"{FRONTEND_BASE_URL}/repertoire?canceled=1"

    metadata: Dict[str, str] = {
        'sid': str(schedule_id),
        'h': (str(hall_num) if hall_num is not None else ''),
        'user_id': str(user_id)
    }
    if len(seats_compact) <= 450:
        metadata['s'] = seats_compact
    else:
        chunks = [seats_compact[i:i+400] for i in range(0, len(seats_compact), 400)]
        for idx, ch in enumerate(chunks, start=1):
            metadata[f'sx{idx}'] = ch

    session = stripe.checkout.Session.create(
        mode='payment',
        line_items=line_items,
        customer_email=user_email,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    return { 'id': session.id, 'url': session.url }


def confirm_and_create_ticket(db, session_id: str, create_ticket_fn):
    _ensure_stripe_key()
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Nieprawidłowe session_id: {e}")

    if session.payment_status != 'paid':
        raise HTTPException(status_code=400, detail='Płatność nie została zakończona')

    try:
        from schemas import Ticket
        existing = db.query(Ticket).filter(Ticket.stripe_session_id == session.id).first()
        if existing:
            _attach_qr_code(existing)
            return existing
    except Exception:
        pass

    meta = getattr(session, 'metadata', None) or {}
    user_id = meta.get('user_id')
    if not user_id:
        raise HTTPException(status_code=400, detail='Brak danych użytkownika w płatności')

    schedule_id = meta.get('sid')
    hall_raw = meta.get('h')
    hall_num = _normalize_hall_value(hall_raw)
    seats_str = meta.get('s')
    if not seats_str:
        pieces: List[Tuple[int, str]] = []
        for k, v in meta.items():
            if k.startswith('sx'):
                try:
                    idx = int(k[2:])
                except Exception:
                    idx = 0
                pieces.append((idx, v))
        if pieces:
            seats_str = ''.join(x for _, x in sorted(pieces, key=lambda p: p[0]))
        else:
            seats_str = ''

    seats = _decode_seats(seats_str)
    if not seats:
        raise HTTPException(status_code=400, detail='Brak danych miejsc w płatności')

    payload = {
        'schedule_id': int(schedule_id) if schedule_id is not None else None,
        'hall': hall_num,
        'seats': seats,
    }

    ticket = create_ticket_fn(db, int(user_id), payload)

    try:
        from schemas import Ticket
        db_ticket = db.query(Ticket).filter(Ticket.id == ticket.id).first()
        if db_ticket:
            db_ticket.stripe_session_id = session.id
            db.commit()
            db.refresh(db_ticket)
            try:
                from movie.service import release_seats
                pairs = [(s.get('row_index'), s.get('col_index')) for s in seats if s.get('row_index') is not None and s.get('col_index') is not None]
                if pairs:
                    release_seats(db_ticket.schedule_id, pairs)
            except Exception:
                pass

            _attach_qr_code(db_ticket)
            return db_ticket
    except Exception:
        pass

    return ticket
