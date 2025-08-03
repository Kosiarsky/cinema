from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from schemas import TicketPrice
from general.schemas import TicketPriceResponse
from get_db import get_db
router = APIRouter()

@router.get("/ticket-prices", response_model=list[TicketPriceResponse])
def get_ticket_prices(db: Session = Depends(get_db)):
    return db.query(TicketPrice).all()