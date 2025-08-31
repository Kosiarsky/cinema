from pydantic import BaseModel
from typing import List, Optional
from datetime import date as DateType




class ScheduleBase(BaseModel):
    date: DateType
    time: str
    movie_type: Optional[str]
    hall: Optional[int] = None

class ScheduleCreate(ScheduleBase):
    movie_id: int

class ScheduleUpdate(BaseModel):
    date: Optional[DateType] = None
    time: Optional[str] = None
    movie_type: Optional[str] = None
    hall: Optional[int] = None


class CategoryBase(BaseModel):
    id: Optional[int] = None
    name: str

    class Config:
        orm_mode = True

class MovieBase(BaseModel):
    id: Optional[int] = None
    title: str
    genre: str
    duration: str
    rating: Optional[float]
    description: Optional[str]
    image: Optional[str]
    big_image: Optional[str]
    trailer: Optional[str]
    cast: Optional[str]
    categories: List[CategoryBase] = []
    premiere_date: Optional[DateType] = None

class Schedule(ScheduleBase):
    id: int
    movie: Optional[MovieBase] = None 

    class Config:
        orm_mode = True


class MovieCreate(MovieBase):
    category_ids: Optional[List[int]] = None

class MovieUpdate(BaseModel):
    title: Optional[str] = None
    genre: Optional[str] = None
    duration: Optional[str] = None
    rating: Optional[float] = None
    description: Optional[str] = None
    image: Optional[str] = None
    big_image: Optional[str] = None
    trailer: Optional[str] = None
    cast: Optional[str] = None
    category_ids: Optional[List[int]] = None
    premiere_date: Optional[DateType] = None


class Movie(BaseModel):
    id: int
    title: str
    genre: str
    duration: str
    rating: Optional[float]
    description: Optional[str]
    image: Optional[str]
    big_image: Optional[str]
    trailer: Optional[str]
    cast: Optional[str]
    categories: List[CategoryBase] = []
    schedules: List[Schedule] = []
    premiere_date: Optional[DateType] = None

    class Config:
        orm_mode = True


class BlockSeatRequest(BaseModel):
    row: int
    col: int

class BlockSeatResponse(BaseModel):
    status: str
    expires: str