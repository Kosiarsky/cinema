from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from get_db import get_db
from movie import service
from schemas import Schedule
from movie.schemas import MovieCreate, Movie, ScheduleCreate
from movie.schemas import Schedule as ScheduleSchema
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
    return db.query(Schedule).all()