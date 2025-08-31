from sqlalchemy.orm import Session
from schemas import Movie, Schedule, Ticket, TicketSeat, Category
from movie.schemas import MovieCreate, MovieUpdate, ScheduleCreate, ScheduleUpdate
from datetime import datetime, timedelta, date
from typing import List, Tuple, Set

blocked_seats = {}

def get_categories(db: Session):
    return db.query(Category).order_by(Category.name.asc()).all()

def create_category(db: Session, name: str):
    name = (name or '').strip()
    if not name:
        return None
    existing = db.query(Category).filter(Category.name.ilike(name)).first()
    if existing:
        return existing
    cat = Category(name=name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

def get_movies(db: Session):
    return db.query(Movie).all()

def get_movie_by_id(db: Session, movie_id: int):
    return db.query(Movie).filter(Movie.id == movie_id).first()

def create_movie(db: Session, movie: MovieCreate):
    data = movie.dict(exclude={"category_ids", "categories"}, exclude_unset=True)
    db_movie = Movie(**data)
    db.add(db_movie)
    cat_ids = (movie.category_ids or [])[:3]
    if cat_ids:
        cats = db.query(Category).filter(Category.id.in_(cat_ids)).all()
        db_movie.categories = cats[:3]
    db.commit()
    db.refresh(db_movie)
    return db_movie

def update_movie(db: Session, db_movie: Movie, payload: MovieUpdate):
    data = payload.dict(exclude={"category_ids"}, exclude_unset=True)
    for k, v in data.items():
        setattr(db_movie, k, v)
    if payload.category_ids is not None:
        cat_ids = (payload.category_ids or [])[:3]
        if cat_ids:
            cats = db.query(Category).filter(Category.id.in_(cat_ids)).all()
            db_movie.categories = cats[:3]
        else:
            db_movie.categories = []
    db.add(db_movie)
    db.commit()
    db.refresh(db_movie)
    return db_movie

def get_schedules_for_movie(db: Session, movie_id: int):
    return db.query(Schedule).filter(Schedule.movie_id == movie_id).all()

def create_schedule(db: Session, schedule: ScheduleCreate):
    # Prevent creating schedules for movies with future premiere date
    mv = db.query(Movie).filter(Movie.id == schedule.movie_id).first()
    if mv and mv.premiere_date is not None and mv.premiere_date > date.today():
        raise ValueError("Nie można dodać seansu dla filmu, który ma przyszłą datę premiery")
    db_schedule = Schedule(**schedule.dict())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

def delete_schedule(db: Session, schedule_id: int) -> None:
    sched = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not sched:
        return
    db.delete(sched)
    db.commit()

def get_all_schedules(db: Session):
    return db.query(Schedule).all()

def get_schedule(db: Session, schedule_id: int):
    return db.query(Schedule).filter(Schedule.id == schedule_id).first()

_def_label_cache: dict[str, int] = {}

def _row_label_to_index(label: str) -> int | None:
    if not label:
        return None
    lbl = str(label).strip().upper()
    if lbl in _def_label_cache:
        return _def_label_cache[lbl]
    val = 0
    for ch in lbl:
        if not ('A' <= ch <= 'Z'):
            return None
        val = val * 26 + (ord(ch) - 64)
    idx = max(0, val - 1)
    _def_label_cache[lbl] = idx
    return idx


def _get_sold_seats_from_db(db: Session, schedule_id: int) -> Set[Tuple[int, int]]:
    sold: Set[Tuple[int, int]] = set()
    try:
        rows = (
            db.query(
                TicketSeat.row_index,
                TicketSeat.col_index,
                TicketSeat.row_label,
                TicketSeat.seat_number,
                TicketSeat.seat,
            )
            .join(Ticket, TicketSeat.ticket_id == Ticket.id)
            .filter(Ticket.schedule_id == schedule_id)
            .all()
        )
        for r_idx, c_idx, r_label, seat_num, seat_txt in rows:
            r = r_idx
            c = c_idx
            if r is None and r_label:
                r = _row_label_to_index(r_label)
            if c is None and seat_num is not None:
                try:
                    c = int(seat_num) - 1
                except Exception:
                    c = None
            if (r is None or c is None) and seat_txt:
                try:
                    parts = str(seat_txt).split('-')
                    if len(parts) >= 2:
                        r_guess = _row_label_to_index(parts[0])
                        c_guess = int(parts[1]) - 1
                        r = r if r is not None else r_guess
                        c = c if c is not None else c_guess
                except Exception:
                    pass
            if r is not None and c is not None:
                sold.add((int(r), int(c)))
    except Exception:
        return sold
    return sold


def update_schedule(db: Session, schedule: Schedule, payload: ScheduleUpdate):
    changed = False
    if payload.date is not None:
        schedule.date = payload.date
        changed = True
    if payload.time is not None:
        schedule.time = payload.time
        changed = True
    if payload.movie_type is not None:
        schedule.movie_type = payload.movie_type
        changed = True
    if payload.hall is not None:
        schedule.hall = payload.hall
        changed = True
    if changed:
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
    return schedule


def block_seat(db: Session, schedule_id: int, row: int, col: int):
    try:
        sold = _get_sold_seats_from_db(db, schedule_id)
        if (row, col) in sold:
            return False, 'sold'
    except Exception:
        pass

    now = datetime.utcnow()
    expiry = now + timedelta(minutes=2)
    if schedule_id not in blocked_seats:
        blocked_seats[schedule_id] = {}
    seat_block = blocked_seats[schedule_id].get((row, col))
    if seat_block and seat_block > now:
        return False, seat_block
    blocked_seats[schedule_id][(row, col)] = expiry
    return True, expiry


def get_blocked_seats(db: Session, schedule_id: int):
    now = datetime.utcnow()
    seats = blocked_seats.get(schedule_id, {})
    seats = {k: v for k, v in seats.items() if v > now}
    blocked_seats[schedule_id] = seats
    temp_blocked = set(seats.keys())

    sold = _get_sold_seats_from_db(db, schedule_id)
    merged = temp_blocked.union(sold)
    return list(merged)


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


def delete_movie(db: Session, movie_id: int) -> None:
    schedules = db.query(Schedule).filter(Schedule.movie_id == movie_id).all()
    for sched in schedules:
        tickets = db.query(Ticket).filter(Ticket.schedule_id == sched.id).all()
        for t in tickets:
            db.delete(t)  
        db.delete(sched)

    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if movie:
        db.delete(movie)

    db.commit()