from sqlalchemy.orm import Session
from passlib.context import CryptContext
from schemas import User, Ticket, TicketSeat, Schedule, Review
from user.schemas import UserCreate, UserUpdate
from datetime import datetime, timedelta, date
from jose import JWTError, jwt
from fastapi import HTTPException, status
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_MINUTES
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from get_db import get_db
from jose.exceptions import ExpiredSignatureError
from sqlalchemy import and_, or_
import secrets
from sqlalchemy import func
from schemas import Movie, Category, movie_categories
from collections import deque
import pyotp
import base64
import io
try:
    import pyqrcode
except Exception:
    pyqrcode = None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/user/login", auto_error=False)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

LOGIN_WINDOW_SECONDS = 15 * 60  
LOGIN_MAX_ATTEMPTS = 5 
_failed_attempts: dict[str, deque[datetime]] = {}

def _key_email(email: str | None) -> str | None:
    return f"email:{email.lower()}" if email else None

def _key_ip(ip: str | None) -> str | None:
    return f"ip:{ip}" if ip else None

def _get_bucket(key: str) -> deque[datetime]:
    d = _failed_attempts.get(key)
    if d is None:
        d = deque()
        _failed_attempts[key] = d
    return d

def _prune(bucket: deque[datetime], now: datetime):
    cutoff = timedelta(seconds=LOGIN_WINDOW_SECONDS)
    while bucket and (now - bucket[0]) > cutoff:
        bucket.popleft()

def _is_limited(key: str | None, now: datetime) -> bool:
    if not key:
        return False
    bucket = _get_bucket(key)
    _prune(bucket, now)
    return len(bucket) >= LOGIN_MAX_ATTEMPTS

def check_bruteforce(email: str | None, ip: str | None):
    now = datetime.utcnow()
    if _is_limited(_key_ip(ip), now) or _is_limited(_key_email(email), now):
        raise HTTPException(status_code=429, detail="Zbyt wiele prób logowania. Spróbuj ponownie później.")

def record_login_failure(email: str | None, ip: str | None):
    now = datetime.utcnow()
    for key in (_key_ip(ip), _key_email(email)):
        if not key:
            continue
        bucket = _get_bucket(key)
        _prune(bucket, now)
        bucket.append(now)

def record_login_success(email: str | None, ip: str | None):
    key = _key_email(email)
    if key and key in _failed_attempts:
        _failed_attempts[key].clear()


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).get(user_id)

def list_users(db: Session):
    return db.query(User).order_by(User.id.asc()).all()

def create_user(db: Session, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        password=hashed_password,
        is_admin=user.is_admin 
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not pwd_context.verify(password, user.password):
        return None
    return user


def generate_2fa_secret() -> str:
    return pyotp.random_base32()

def build_otpauth_url(email: str, secret: str, issuer: str = "Apollo Cinema") -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer)

def build_qr_data_url(otpauth_url: str) -> str:
    if pyqrcode is None:
        return ""
    qr = pyqrcode.create(otpauth_url)
    buf = io.BytesIO()
    qr.png(buf, scale=4)
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('ascii')}"

def verify_totp_code(secret: str, code: str) -> bool:
    try:
        totp = pyotp.TOTP(secret)
        return bool(totp.verify(code, valid_window=1))
    except Exception:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        return email
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def refresh_access_token(refresh_token: str):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        from get_db import get_db as _get_db  
        access_token = create_access_token({"sub": email})
        return {"access_token": access_token}
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        user = get_user_by_email(db, email)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        return user
    except ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user_optional(token: str | None = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)) -> User | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            return None
        user = get_user_by_email(db, email)
        return user
    except Exception:
        return None

def admin_required(current_user = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Brak uprawnień administratora")
    return current_user

def update_user(db: Session, user: User, user_update: dict):
    try:
        if 'first_name' in user_update:
            user.first_name = user_update['first_name']
        if 'last_name' in user_update:
            user.last_name = user_update['last_name']
        if 'email' in user_update:
            user.email = user_update['email']
        if 'phone' in user_update:
            user.phone = user_update['phone']
        db.commit()
        db.refresh(user)
        return user
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def admin_update_user(db: Session, user_id: int, updates: dict):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")
    if 'first_name' in updates:
        user.first_name = updates['first_name']
    if 'last_name' in updates:
        user.last_name = updates['last_name']
    if 'email' in updates:
        user.email = updates['email']
    if 'phone' in updates:
        user.phone = updates['phone']
    if 'is_admin' in updates and updates['is_admin'] is not None:
        user.is_admin = int(updates['is_admin'])
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")
    tickets = db.query(Ticket).filter(Ticket.user_id == user_id).all()
    for t in tickets:
        db.query(TicketSeat).filter(TicketSeat.ticket_id == t.id).delete()
        db.delete(t)
    db.delete(user)
    db.commit()
    return {"status": "deleted"}

def change_password(db: Session, user: User, old_password: str, new_password: str):
    try:
        if not pwd_context.verify(old_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stare hasło jest nieprawidłowe!"
            )
        user.password = pwd_context.hash(new_password)
        db.commit()
        db.refresh(user)
        return {"msg": "Hasło zostało zaktualizowane pomyślnie!"}
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def _attach_qr_code(ticket: Ticket):
    try:
        import pyqrcode
        import base64
        import io
        code = getattr(ticket, 'ticket_code', None)
        data_str = str(code) if code is not None else ''
        qr = pyqrcode.create(data_str, error='M')
        buf = io.BytesIO()
        qr.png(buf, scale=4)
        png_b64 = base64.b64encode(buf.getvalue()).decode('ascii')
        setattr(ticket, 'qr_code_data_url', f"data:image/png;base64,{png_b64}")
    except Exception:
        setattr(ticket, 'qr_code_data_url', None)

def create_ticket(db: Session, user_id: int, ticket_data: dict):
    seats_data = ticket_data.get('seats', []) or []

    schedule_id = ticket_data.get('schedule_id')
    if not schedule_id:
        raise HTTPException(status_code=400, detail="Brak schedule_id")

    for s in seats_data:
        r = s.get('row_index')
        c = s.get('col_index')
        r_label = s.get('row_label')
        seat_num = s.get('seat_number')
        seat_txt = s.get('seat')
        conflict = db.query(TicketSeat) \
            .join(Ticket, TicketSeat.ticket_id == Ticket.id) \
            .filter(Ticket.schedule_id == schedule_id) \
            .filter(
                or_(
                    and_(TicketSeat.row_index == r, TicketSeat.col_index == c),
                    and_(TicketSeat.row_label == r_label, TicketSeat.seat_number == seat_num),
                    TicketSeat.seat == seat_txt
                )
            ) \
            .first()
        if conflict:
            raise HTTPException(status_code=409, detail=f"Seat already sold: {seat_txt or (r_label and seat_num and f'{r_label}-{seat_num}') or 'unknown'}")

    code = None
    for _ in range(5):
        candidate = secrets.token_urlsafe(10)
        if not db.query(Ticket).filter(Ticket.ticket_code == candidate).first():
            code = candidate
            break
    if code is None:
        raise HTTPException(status_code=500, detail="Nie udało się wygenerować kodu biletu")

    ticket = Ticket(
        user_id=user_id,
        schedule_id=schedule_id,
        hall=ticket_data.get('hall'),
        ticket_code=code,
    )
    db.add(ticket)
    db.flush()

    total = 0.0
    for s in seats_data:
        seat_price = float(s.get('price') or 0.0)
        ts = TicketSeat(
            ticket_id=ticket.id,
            seat=s.get('seat'),
            price=seat_price,
            type=s.get('type'),
            row_index=s.get('row_index'),
            col_index=s.get('col_index'),
            row_label=s.get('row_label'),
            seat_number=s.get('seat_number'),
        )
        db.add(ts)
        total += seat_price

    ticket.total_price = total
    db.commit()
    db.refresh(ticket)

    _attach_qr_code(ticket)

    return ticket

def get_user_tickets(db: Session, user_id: int):
    tickets = db.query(Ticket).filter(Ticket.user_id == user_id).all()
    for t in tickets:
        _attach_qr_code(t)
    return tickets

def _user_attended_movie(db: Session, user_id: int, movie_id: int) -> bool:
    now_date = date.today()
    q = (
        db.query(Ticket)
        .join(Schedule, Ticket.schedule_id == Schedule.id)
        .filter(Ticket.user_id == user_id)
        .filter(Schedule.movie_id == movie_id)
        .filter(Schedule.date <= now_date)
    )
    return db.query(q.exists()).scalar()


def create_review(db: Session, user_id: int, movie_id: int, rating: int, comment: str | None, is_anonymous: bool) -> 'Review':
    if rating is None or rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Ocena musi być w zakresie 1-5")
    if not _user_attended_movie(db, user_id, movie_id):
        raise HTTPException(status_code=403, detail="Możesz ocenić film tylko po udziale w seansie")
    existing = db.query(Review).filter(Review.user_id == user_id, Review.movie_id == movie_id).first()
    if existing:
        existing.rating = rating
        existing.comment = comment
        existing.is_anonymous = 1 if is_anonymous else 0
        existing.updated_at = datetime.utcnow()
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    rev = Review(
        user_id=user_id,
        movie_id=movie_id,
        rating=rating,
        comment=comment,
        is_anonymous=1 if is_anonymous else 0,
    )
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return rev


def list_my_reviews(db: Session, user_id: int):
    return db.query(Review).filter(Review.user_id == user_id).order_by(Review.created_at.desc()).all()


def list_movie_reviews(db: Session, movie_id: int):
    rows = (
        db.query(Review)
        .filter(Review.movie_id == movie_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    enriched = []
    for r in rows:
        try:
            first_name = r.user.first_name if (not bool(r.is_anonymous)) and getattr(r, 'user', None) else None
        except Exception:
            first_name = None
        enriched.append({
            'id': r.id,
            'movie_id': r.movie_id,
            'user_id': r.user_id,
            'rating': r.rating,
            'comment': r.comment,
            'is_anonymous': bool(r.is_anonymous),
            'created_at': r.created_at,
            'updated_at': r.updated_at,
            'reviewer_first_name': first_name,
        })
    return enriched



def recommend_movies(db: Session, user_id: int | None, limit: int = 10, _fallback: bool = False):
    if user_id is not None:
        watched_movie_ids = set(
            mid for (mid,) in (
                db.query(Schedule.movie_id)
                .join(Ticket, Ticket.schedule_id == Schedule.id)
                .filter(Ticket.user_id == user_id)
                .all()
            )
        )
    else:
        watched_movie_ids = set()

    if user_id is not None:
        cat_freq_rows = (
            db.query(Category.id, func.count().label('cnt'))
            .join(movie_categories, Category.id == movie_categories.c.category_id)
            .join(Movie, Movie.id == movie_categories.c.movie_id)
            .join(Schedule, Schedule.movie_id == Movie.id)
            .join(Ticket, Ticket.schedule_id == Schedule.id)
            .filter(Ticket.user_id == user_id)
            .group_by(Category.id)
            .all()
        )
        cat_scores = {cid: int(cnt) for cid, cnt in cat_freq_rows}
    else:
        cat_scores = {}

    released_filter = or_(Movie.premiere_date == None, Movie.premiere_date <= date.today())
    if cat_scores:
        candidate_q = (
            db.query(Movie)
            .join(movie_categories, Movie.id == movie_categories.c.movie_id)
            .filter(movie_categories.c.category_id.in_(list(cat_scores.keys())))
            .filter(released_filter)
        )
    else:
        candidate_q = db.query(Movie).filter(released_filter)

    candidates = {m.id: m for m in candidate_q.all()}

    available_candidate_ids = set(candidates.keys()) - watched_movie_ids
    if not candidates or not available_candidate_ids:
        candidates = {m.id: m for m in db.query(Movie).filter(released_filter).all()}

    avg_rows = db.query(Review.movie_id, func.avg(Review.rating)).group_by(Review.movie_id).all()
    avg_map = {mid: (float(avg) if avg is not None else None) for mid, avg in avg_rows}

    pop_rows = (
        db.query(Schedule.movie_id, func.count(Ticket.id))
        .join(Ticket, Ticket.schedule_id == Schedule.id)
        .group_by(Schedule.movie_id)
        .all()
    )
    pop_map = {mid: int(cnt) for mid, cnt in pop_rows}

    cat_score_per_movie: dict[int, int] = {}
    max_cat_score = 0
    if cat_scores:
        for m in candidates.values():
            score = 0
            try:
                for c in getattr(m, 'categories', []) or []:
                    if c and c.id in cat_scores:
                        score += cat_scores.get(c.id, 0)
            except Exception:
                score = 0
            cat_score_per_movie[m.id] = score
            if score > max_cat_score:
                max_cat_score = score

    max_pop = max(pop_map.values()) if pop_map else 0

    scored = []
    for mid, m in candidates.items():
        if mid in watched_movie_ids:
            continue
        avg = avg_map.get(mid) or 0.0
        pop = pop_map.get(mid, 0)
        if max_cat_score > 0:
            norm_cat = (cat_score_per_movie.get(mid, 0) / max_cat_score)
        else:
            norm_cat = 0.0
        norm_rating = (avg / 5.0) if avg else 0.0
        norm_pop = (pop / max_pop) if max_pop > 0 else 0.0
        score = 0.6 * norm_cat + 0.3 * norm_rating + 0.1 * norm_pop
        scored.append((score, m))

    if not scored:
        all_released = {m.id: m for m in db.query(Movie).filter(released_filter).all()}
        top_by_rating = sorted(
            [(avg or 0.0, mid) for mid, avg in avg_map.items() if mid in all_released], reverse=True
        )
        picked_ids: list[int] = []
        for _, mid in top_by_rating:
            if mid not in watched_movie_ids and mid in all_released:
                picked_ids.append(mid)
            if len(picked_ids) >= limit:
                break
        if len(picked_ids) < limit:
            for _cnt, mid in sorted([(cnt, mid) for mid, cnt in pop_map.items() if mid in all_released], reverse=True):
                if mid not in watched_movie_ids and mid in all_released and mid not in picked_ids:
                    picked_ids.append(mid)
                if len(picked_ids) >= limit:
                    break
        movies = [all_released[mid] for mid in picked_ids]
    else:
        movies = [m for _, m in sorted(scored, key=lambda x: x[0], reverse=True)[:limit]]

    if user_id is not None and not movies and not _fallback:
        return recommend_movies(db, None, limit, _fallback=True)

    out = []
    for m in movies:
        avg = avg_map.get(m.id)
        img = m.image
        
        try:
            cat_names = [c.name for c in (getattr(m, 'categories', []) or []) if getattr(c, 'name', None)]
        except Exception:
            cat_names = []
        out.append({
            'id': m.id,
            'title': m.title,
            'image': img,
            'rating': round(float(avg), 1) if avg is not None else None,
            'time': m.duration,
            'cast': m.cast,
            'content': m.description,
            'categories': cat_names,
        })
    return out

def setup_two_factor(db: Session, user: User):
    secret = generate_2fa_secret()
    user.two_factor_secret = secret
    db.commit()
    db.refresh(user)
    otpauth = build_otpauth_url(user.email, secret)
    qr_data_url = build_qr_data_url(otpauth)
    return { 'secret': secret, 'otpauth_url': otpauth, 'qr_data_url': qr_data_url }


def enable_two_factor(db: Session, user: User, code: str):
    if not user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA not initialized")
    if not verify_totp_code(user.two_factor_secret, code):
        raise HTTPException(status_code=400, detail="Nieprawidłowy kod 2FA")
    user.two_factor_enabled = 1
    db.commit()
    db.refresh(user)
    return { 'enabled': True }


def disable_two_factor(db: Session, user: User, code: str | None = None):
    if user.two_factor_enabled and user.two_factor_secret:
        if code and not verify_totp_code(user.two_factor_secret, code):
            raise HTTPException(status_code=400, detail="Nieprawidłowy kod 2FA")
    user.two_factor_enabled = 0
    user.two_factor_secret = None
    db.commit()
    db.refresh(user)
    return { 'enabled': False }


def two_factor_status(user: User):
    return { 'enabled': bool(getattr(user, 'two_factor_enabled', 0)) }