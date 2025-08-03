from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from get_db import get_db
from user import service
from user.schemas import UserCreate, UserResponse, UserLogin, UserUpdate, PasswordChange
from user.service import get_current_user, admin_required, update_user, change_password
from schemas import User 

router = APIRouter()

@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = service.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email został już zarejestrowany!"
        )
    created_user = service.create_user(db, user)
    access_token = service.create_access_token({"sub": created_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    authenticated_user = service.authenticate_user(db, user.email, user.password)
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy email lub hasło!",
        )
    access_token = service.create_access_token({
        "sub": authenticated_user.email,
        "is_admin": authenticated_user.is_admin
    })
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": authenticated_user.email,
            "first_name": authenticated_user.first_name,
            "last_name": authenticated_user.last_name,
            "phone": authenticated_user.phone
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user

@router.get("/admin-only")
def admin_endpoint(current_user = Depends(admin_required)):
    return {"msg": "Tylko dla admina!"}

@router.put("/update")
def update_me(user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_user(db, current_user, user_update.dict(exclude_unset=True))

@router.post("/change-password")
def update_password(passwords: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return change_password(db, current_user, passwords.old_password, passwords.new_password)