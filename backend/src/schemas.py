from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class ActorBase(BaseModel):
    name: str

class ActorCreate(ActorBase):
    pass

class Actor(ActorBase):
    id: int

    class Config:
        orm_mode = True


class ScheduleBase(BaseModel):
    date: date
    time: str

class ScheduleCreate(ScheduleBase):
    movie_id: int

class Schedule(ScheduleBase):
    id: int
    movie: Optional["Movie"]

    class Config:
        orm_mode = True


class MovieBase(BaseModel):
    title: str
    genre: str
    duration: str
    rating: Optional[float]
    description: Optional[str]
    image: Optional[str]
    big_image: Optional[str]
    trailer: Optional[str]

class MovieCreate(MovieBase):
    pass

class Movie(MovieBase):
    id: int
    schedules: List[Schedule] = []
    cast: List[Actor] = []

    class Config:
        orm_mode = True