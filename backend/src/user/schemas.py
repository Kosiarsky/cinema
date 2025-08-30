from pydantic import BaseModel, EmailStr
from typing import Optional, List
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

class AdminUserResponse(UserResponse):
    phone: Optional[str] = None

class AdminUserUpdate(UserUpdate):
    is_admin: Optional[int] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class MovieResponse(BaseModel):
    id: int
    title: str
    genre: str
    duration: str
    rating: Optional[float] = None
    description: Optional[str] = None
    image: Optional[str] = None
    big_image: Optional[str] = None
    trailer: Optional[str] = None
    cast: Optional[str] = None

    class Config:
        orm_mode = True

class ScheduleResponse(BaseModel):
    id: int
    date: date
    time: str
    movie: MovieResponse 

    class Config:
        orm_mode = True

class TicketBase(BaseModel):
    schedule_id: int
    seat: Optional[str] = None
    purchase_date: date
    price: float
    hall: Optional[int] = None

class TicketSeatBase(BaseModel):
    seat: str
    price: float
    type: str
    row_index: Optional[int] = None
    col_index: Optional[int] = None
    row_label: Optional[str] = None
    seat_number: Optional[int] = None

class TicketSeatCreate(TicketSeatBase):
    pass

class TicketSeatResponse(TicketSeatBase):
    id: int
    class Config:
        orm_mode = True

class TicketCreate(BaseModel):
    schedule_id: int
    hall: Optional[int]
    seats: List[TicketSeatCreate]

class TicketResponse(BaseModel):
    id: int
    schedule_id: int
    hall: Optional[int]
    purchase_date: date
    total_price: float
    seats: List[TicketSeatResponse]
    schedule: ScheduleResponse
    qr_code_data_url: Optional[str] = None
    ticket_code: Optional[str] = None
    class Config:
        orm_mode = True