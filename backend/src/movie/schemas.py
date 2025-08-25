from pydantic import BaseModel
from typing import List, Optional
from datetime import date as DateType




class ScheduleBase(BaseModel):
    date: DateType
    time: str
    movie_type: Optional[str]
    hall: Optional[str] = None

class ScheduleCreate(ScheduleBase):
    movie_id: int

class ScheduleUpdate(BaseModel):
    date: Optional[DateType] = None
    time: Optional[str] = None
    movie_type: Optional[str] = None
    hall: Optional[str] = None


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

class Schedule(ScheduleBase):
    id: int
    movie: Optional[MovieBase] = None 

    class Config:
        orm_mode = True


class MovieCreate(MovieBase):
    pass


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
    schedules: List[Schedule] = []

    class Config:
        orm_mode = True


class BlockSeatRequest(BaseModel):
    row: int
    col: int

class BlockSeatResponse(BaseModel):
    status: str
    expires: str