from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SlideCreate(BaseModel):
    title: str
    description: Optional[str] = None
    image: str
    movie_id: Optional[int] = None
    sort_order: Optional[int] = None
    is_public: Optional[bool] = True

class SlideUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    movie_id: Optional[int] = None
    sort_order: Optional[int] = None
    is_public: Optional[bool] = None

class NewsCreate(BaseModel):
    title: str
    content: Optional[str] = None
    date: Optional[str] = None  
    image: Optional[str] = None
    movie_id: Optional[int] = None
    is_public: Optional[bool] = True

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    date: Optional[str] = None
    image: Optional[str] = None
    movie_id: Optional[int] = None
    is_public: Optional[bool] = None