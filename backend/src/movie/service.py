from sqlalchemy.orm import Session
from schemas import Movie, Schedule
from movie.schemas import MovieCreate, ScheduleCreate
from datetime import datetime, timedelta
from typing import List, Tuple

blocked_seats = {}

def get_movies(db: Session):
    return db.query(Movie).all()

def get_movie_by_id(db: Session, movie_id: int):
    return db.query(Movie).filter(Movie.id == movie_id).first()

def create_movie(db: Session, movie: MovieCreate):
    db_movie = Movie(**movie.dict())
    db.add(db_movie)
    db.commit()
    db.refresh(db_movie)
    return db_movie

def get_schedules_for_movie(db: Session, movie_id: int):
    return db.query(Schedule).filter(Schedule.movie_id == movie_id).all()

def create_schedule(db: Session, schedule: ScheduleCreate):
    db_schedule = Schedule(**schedule.dict())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

def get_all_schedules(db: Session):
    return db.query(Schedule).all()

def get_schedule(db: Session, schedule_id: int):
    return db.query(Schedule).filter(Schedule.id == schedule_id).first()


def block_seat(db, schedule_id: int, row: int, col: int):
    now = datetime.utcnow()
    expiry = now + timedelta(minutes=2)
    if schedule_id not in blocked_seats:
        blocked_seats[schedule_id] = {}
    seat_block = blocked_seats[schedule_id].get((row, col))
    if seat_block and seat_block > now:
        return False, seat_block
    blocked_seats[schedule_id][(row, col)] = expiry
    return True, expiry

def get_blocked_seats(schedule_id: int):
    now = datetime.utcnow()
    seats = blocked_seats.get(schedule_id, {})
    seats = {k: v for k, v in seats.items() if v > now}
    blocked_seats[schedule_id] = seats
    return list(seats.keys())

def release_seat(schedule_id: int, row: int, col: int):
    try:
        schedule_map = blocked_seats.get(schedule_id)
        if not schedule_map:
            return False
        if (row, col) in schedule_map:
            del schedule_map[(row, col)]
            return True
        return False
    except Exception:
        return False

def release_seats(schedule_id: int, seats: List[Tuple[int, int]]):
    schedule_map = blocked_seats.get(schedule_id)
    if not schedule_map:
        return 0
    count = 0
    for row, col in seats:
        if (row, col) in schedule_map:
            del schedule_map[(row, col)]
            count += 1
    return count