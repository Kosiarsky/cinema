from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from get_db import get_db
from user import service
from user.schemas import UserCreate, UserResponse, UserLogin, UserUpdate, PasswordChange, RefreshTokenRequest, TicketCreate, TicketResponse, ReviewCreate, ReviewResponse
from user.service import get_current_user, admin_required, update_user, change_password
from schemas import User 
from user.schemas import TwoFactorSetupResponse, TwoFactorCode, TwoFactorStatus

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
def login_user(user: UserLogin, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request and request.client else None
    service.check_bruteforce(user.email, client_ip)

    authenticated_user = service.authenticate_user(db, user.email, user.password)
    if not authenticated_user:
        service.record_login_failure(user.email, client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy email lub hasło!",
        )
    
    if getattr(authenticated_user, 'two_factor_enabled', 0):
        if not user.otp_code:
            raise HTTPException(status_code=206, detail="Wymagany kod 2FA", headers={"X-2FA-Required": "1"})
        if not service.verify_totp_code(authenticated_user.two_factor_secret or "", user.otp_code):
            service.record_login_failure(user.email, client_ip)
            raise HTTPException(status_code=401, detail="Nieprawidłowy kod 2FA")

    service.record_login_success(user.email, client_ip)

    access_token = service.create_access_token({
        "sub": authenticated_user.email,
        "is_admin": authenticated_user.is_admin
    })
    refresh_token = service.create_refresh_token({
        "sub": authenticated_user.email
    })
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "email": authenticated_user.email,
            "first_name": authenticated_user.first_name,
            "last_name": authenticated_user.last_name,
            "phone": authenticated_user.phone
        }
    }

@router.post("/refresh-token")
def refresh_token(request: RefreshTokenRequest):
    return service.refresh_access_token(request.refresh_token)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user

@router.get("/is-logged-in")
def is_logged_in(current_user: UserResponse = Depends(get_current_user)):
    return {"is_logged_in": current_user is not None}

@router.get("/admin-only")
def admin_endpoint(current_user = Depends(admin_required)):
    return {"msg": "Tylko dla admina!"}

@router.put("/update")
def update_me(user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_user(db, current_user, user_update.dict(exclude_unset=True))

@router.post("/change-password")
def update_password(passwords: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return change_password(db, current_user, passwords.old_password, passwords.new_password)

@router.post("/tickets", response_model=TicketResponse)
def buy_ticket(ticket: TicketCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.create_ticket(db, current_user.id, ticket.dict())

@router.get("/tickets", response_model=list[TicketResponse])
def get_my_tickets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.get_user_tickets(db, current_user.id)

@router.post("/reviews", response_model=ReviewResponse)
def create_review(payload: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rev = service.create_review(db, current_user.id, payload.movie_id, payload.rating, payload.comment, bool(payload.is_anonymous))
    return rev

@router.get("/reviews", response_model=list[ReviewResponse])
def my_reviews(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.list_my_reviews(db, current_user.id)

@router.get('/recommendations')
def recommended_movies(limit: int = 10, db: Session = Depends(get_db), current_user: User | None = Depends(service.get_current_user_optional)):
    user_id = current_user.id if current_user else None
    result = service.recommend_movies(db, user_id, limit)

    def _get(obj, name, default=None):
        try:
            return obj.get(name, default)  
        except Exception:
            return getattr(obj, name, default)  

    try:
        def _key(o):
            rating = _get(o, 'rating', None)
            has_rating = 1 if rating is not None else 0
            try:
                rating_val = float(rating) if rating is not None else 0.0
            except Exception:
                rating_val = 0.0
            title = _get(o, 'title', '') or ''
            return (-has_rating, -rating_val, title)
        result = sorted(list(result), key=_key)
    except Exception:
        pass

    return result

@router.post('/2fa/setup', response_model=TwoFactorSetupResponse)
def twofa_setup(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.setup_two_factor(db, current_user)

@router.post('/2fa/enable')
def twofa_enable(payload: TwoFactorCode, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.enable_two_factor(db, current_user, payload.code)

@router.post('/2fa/disable')
def twofa_disable(payload: TwoFactorCode | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    code = payload.code if payload else None
    return service.disable_two_factor(db, current_user, code)

@router.get('/2fa/status', response_model=TwoFactorStatus)
def twofa_status(current_user: User = Depends(get_current_user)):
    return service.two_factor_status(current_user)