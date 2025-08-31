from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from datetime import date

class TicketPriceResponse(BaseModel):
    id: int
    type: str
    cheap_thursday: str
    three_days_before: str
    two_days_before: str
    one_day_before: str
    same_day: str

    class Config:
        orm_mode = True

class SlideResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    image: str
    movie_id: int | None = None
    sort_order: int
    is_public: bool

    class Config:
        orm_mode = True

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    image: str | None = None
    description: str | None = None
    cast: str | None = None
    duration: str | None = None
    premiere_date: date | None = None

    class Config:
        orm_mode = True

class NewsResponse(BaseModel):
    id: int
    title: str
    content: str | None = None
    date: date
    image: str | None = None
    movie_id: int | None = None

    class Config:
        orm_mode = True