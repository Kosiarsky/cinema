from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from schemas import TicketPrice, Slide
from general.schemas import TicketPriceResponse, SlideResponse
from get_db import get_db
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