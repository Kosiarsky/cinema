from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    password: str
    is_admin: int = 0

class UserResponse(UserBase):
    id: int
    is_admin: int  

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    email: Optional[str]
    phone: Optional[str]

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TicketBase(BaseModel):
    schedule_id: int
    seat: Optional[str] = None

class TicketCreate(TicketBase):
    pass

class TicketResponse(TicketBase):
    id: int
    purchase_date: date

    class Config:
        orm_mode = True