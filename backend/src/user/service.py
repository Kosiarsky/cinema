from sqlalchemy.orm import Session
from passlib.context import CryptContext
from schemas import User
from user.schemas import UserCreate, UserUpdate
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, status
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from get_db import get_db

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

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
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

def admin_required(current_user = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Brak uprawnień administratora")
    return current_user

def update_user(db: Session, user: User, user_update: dict):
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

def change_password(db: Session, user: User, old_password: str, new_password: str):
    if not pwd_context.verify(old_password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stare hasło jest nieprawidłowe!"
        )
    user.password = pwd_context.hash(new_password)
    db.commit()
    db.refresh(user)
    return {"msg": "Hasło zostało zaktualizowane pomyślnie!"}