from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import Body
from sqlalchemy.orm import Session
from get_db import get_db
from movie import service
from schemas import Schedule
from movie.schemas import MovieCreate, Movie, ScheduleCreate
from movie.schemas import Schedule as ScheduleSchema
from movie.schemas import ScheduleUpdate
from typing import List

router = APIRouter()

@router.get("/movies", response_model=list[Movie])
def get_movies(db: Session = Depends(get_db)):
    return service.get_movies(db)

@router.get("/movies/{movie_id}", response_model=Movie)
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = service.get_movie_by_id(db, movie_id)
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    return movie

@router.post("/movies", response_model=Movie)
def create_movie(movie: MovieCreate, db: Session = Depends(get_db)):
    return service.create_movie(db, movie)

@router.get("/movies/{movie_id}/schedules", response_model=list[ScheduleSchema])
def get_schedules_for_movie(movie_id: int, db: Session = Depends(get_db)):
    return service.get_schedules_for_movie(db, movie_id)

@router.post("/schedules", response_model=ScheduleSchema)
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db)):
    return service.create_schedule(db, schedule)


@router.delete("/movies/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = service.get_movie_by_id(db, movie_id)
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    service.delete_movie(db, movie_id)

@router.get("/get-schedules", response_model=list[ScheduleSchema])
def get_all_schedules(db: Session = Depends(get_db)):
    return service.get_all_schedules(db)

@router.get("/schedules/{schedule_id}", response_model=ScheduleSchema)
def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = service.get_schedule(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule

@router.patch("/schedules/{schedule_id}", response_model=ScheduleSchema)
def update_schedule(schedule_id: int, payload: ScheduleUpdate, db: Session = Depends(get_db)):
    schedule = service.get_schedule(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    try:
        updated = service.update_schedule(db, schedule, payload)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/schedules/{schedule_id}/block-seat")
def block_seat(schedule_id: int, row: int = Body(...), col: int = Body(...), db: Session = Depends(get_db)):
    success, info = service.block_seat(db, schedule_id, row, col)
    if not success:
        if info == 'sold':
            raise HTTPException(status_code=409, detail="Seat already sold")
        raise HTTPException(status_code=409, detail=f"Seat already blocked until {info}")
    return {"status": "blocked", "expires": info}

@router.post("/schedules/{schedule_id}/release-seat")
def release_seat(schedule_id: int, row: int = Body(...), col: int = Body(...)):
    ok = service.release_seat(schedule_id, row, col)
    if not ok:
        raise HTTPException(status_code=404, detail="Seat not found or not blocked")
    return {"status": "released"}

@router.post("/schedules/{schedule_id}/release-seats")
def release_seats(schedule_id: int, seats: List[tuple[int,int]] = Body(...)):
    try:
        released = service.release_seats(schedule_id, seats)
        return {"released": released}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")

@router.get("/schedules/{schedule_id}/blocked-seats")
def get_blocked_seats(schedule_id: int, db: Session = Depends(get_db)):
    return {"blocked_seats": service.get_blocked_seats(db, schedule_id)}