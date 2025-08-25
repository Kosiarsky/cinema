from sqlalchemy.orm import Session
from passlib.context import CryptContext
from schemas import User, Ticket, TicketSeat
from user.schemas import UserCreate, UserUpdate
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, status
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_MINUTES
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from get_db import get_db
from jose.exceptions import ExpiredSignatureError
from sqlalchemy import and_, or_
import secrets

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/login")


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

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
        is_admin: int = payload.get("is_admin", 0)
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
        user.is_admin = is_admin  
        return user
    except ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

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
        # Use only the unique ticket code in the QR payload
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