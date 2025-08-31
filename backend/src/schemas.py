from typing import List, Optional
from datetime import date
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Table
from sqlalchemy.orm import relationship, Mapped

try:
    from database import Base
except ModuleNotFoundError:
    from .database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone: str = Column(String, nullable=True)
    password = Column(String, nullable=False)
    is_admin = Column(Integer, default=0)  

movie_categories = Table(
    'movie_categories',
    Base.metadata,
    Column('movie_id', Integer, ForeignKey('movies.id'), primary_key=True),
    Column('category_id', Integer, ForeignKey('categories.id'), primary_key=True),
)

class Movie(Base):
    __tablename__ = 'movies'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    genre = Column(String, nullable=False)
    duration = Column(String, nullable=False)
    rating = Column(Float, nullable=True)
    description = Column(String, nullable=True)
    image = Column(String, nullable=True)
    big_image = Column(String, nullable=True)
    trailer = Column(String, nullable=True)
    cast = Column(String, nullable=True)
    premiere_date = Column(Date, nullable=True)  # New: optional premiere date to mark upcoming/announcements

    schedules = relationship("Schedule", back_populates="movie")
    categories = relationship(
        "Category",
        secondary=movie_categories,
        back_populates="movies",
        lazy='joined'
    )

class Category(Base):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)

    movies = relationship(
        "Movie",
        secondary=movie_categories,
        back_populates="categories"
    )

class Schedule(Base):
    __tablename__ = 'schedules'

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    time = Column(String, nullable=False)
    movie_type = Column(String, nullable=True) 
    movie_id = Column(Integer, ForeignKey('movies.id'))
    hall = Column(Integer, nullable=True)
    seats: List[List[bool]] = []

    movie = relationship("Movie", back_populates="schedules")

class TicketPrice(Base):
    __tablename__ = 'ticket_prices'

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    cheap_thursday = Column(String, nullable=False)
    three_days_before = Column(String, nullable=False)
    two_days_before = Column(String, nullable=False)
    one_day_before = Column(String, nullable=False)
    same_day = Column(String, nullable=False)

class TicketSeat(Base):
    __tablename__ = 'ticket_seats'

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey('tickets.id'), nullable=False)
    seat = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    type = Column(String, nullable=False)
    row_index = Column(Integer, nullable=True)
    col_index = Column(Integer, nullable=True)
    row_label = Column(String, nullable=True)
    seat_number = Column(Integer, nullable=True)

    ticket = relationship("Ticket", back_populates="seats")

class Ticket(Base):
    __tablename__ = 'tickets'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    schedule_id = Column(Integer, ForeignKey('schedules.id'), nullable=False)
    hall = Column(Integer, nullable=True)
    purchase_date = Column(Date, default=date.today)
    total_price = Column(Float, nullable=False, default=0.0)
    stripe_session_id = Column(String, unique=True, nullable=True)
    ticket_code = Column(String, unique=True, nullable=True)

    user = relationship("User")
    schedule = relationship("Schedule")
    seats = relationship("TicketSeat", back_populates="ticket", cascade="all, delete-orphan")

class Slide(Base):
    __tablename__ = 'slides'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    image = Column(String, nullable=False)
    movie_id = Column(Integer, ForeignKey('movies.id'), nullable=True)
    # New fields
    sort_order = Column(Integer, nullable=False, default=0)
    is_public = Column(Integer, nullable=False, default=1)

    # Optional relationship to Movie for future joins
    movie = relationship("Movie", lazy='joined')