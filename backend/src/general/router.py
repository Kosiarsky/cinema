from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from schemas import TicketPrice, Slide, Movie
from general.schemas import TicketPriceResponse, SlideResponse, AnnouncementResponse
from get_db import get_db
from datetime import date
router = APIRouter()

@router.get("/ticket-prices", response_model=list[TicketPriceResponse])
def get_ticket_prices(db: Session = Depends(get_db)):
    return db.query(TicketPrice).all()

@router.get('/slides', response_model=list[SlideResponse])
def get_slides(db: Session = Depends(get_db)):
    return db.query(Slide).order_by(Slide.sort_order.asc(), Slide.id.desc()).all()

@router.get('/public/slides', response_model=list[SlideResponse])
def get_public_slides(db: Session = Depends(get_db)):
    return db.query(Slide).filter(Slide.is_public == 1).order_by(Slide.sort_order.asc(), Slide.id.desc()).all()

# Announcements (upcoming movies)
@router.get('/public/announcements', response_model=list[AnnouncementResponse])
def get_public_announcements(limit: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Movie).filter(Movie.premiere_date != None)
    today = date.today()
    q = q.filter(Movie.premiere_date >= today)
    q = q.order_by(Movie.premiere_date.asc(), Movie.id.desc())
    if limit and limit > 0:
        q = q.limit(limit)
    return q.all()