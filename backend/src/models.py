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
    password = Column(String, nullable=False)
    is_admin = Column(Integer, default=0)  

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

    # Relacja z repertuarem
    schedules = relationship("Schedule", back_populates="movie")

class Schedule(Base):
    __tablename__ = 'schedules'

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    time = Column(String, nullable=False)
    movie_id = Column(Integer, ForeignKey('movies.id'))

    # Relacja z filmem
    movie = relationship("Movie", back_populates="schedules")