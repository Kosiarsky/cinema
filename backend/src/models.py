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

# Tabela pośrednia dla relacji wiele-do-wielu (aktorzy w filmach)
movie_cast = Table(
    'movie_cast',
    Base.metadata,
    Column('movie_id', Integer, ForeignKey('movies.id'), primary_key=True),
    Column('actor_id', Integer, ForeignKey('actors.id'), primary_key=True)
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

    # Relacja z repertuarem
    schedules = relationship("Schedule", back_populates="movie")

    # Relacja z aktorami
    cast = relationship("Actor", secondary=movie_cast, back_populates="movies")


class Actor(Base):
    __tablename__ = 'actors'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    # Relacja z filmami
    movies = relationship("Movie", secondary=movie_cast, back_populates="cast")


class Schedule(Base):
    __tablename__ = 'schedules'

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    time = Column(String, nullable=False)
    movie_id = Column(Integer, ForeignKey('movies.id'))

    # Relacja z filmem
    movie = relationship("Movie", back_populates="schedules")