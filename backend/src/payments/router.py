from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from get_db import get_db
from payments import service
from user.service import get_current_user, create_ticket as create_ticket_fn

router = APIRouter()

@router.post('/create-checkout-session')
def create_checkout_session(payload: dict = Body(...), db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return service.create_checkout_session(current_user.id, current_user.email, payload)

@router.post('/confirm')
def confirm_payment(payload: dict = Body(...), db: Session = Depends(get_db)):
    session_id = payload.get('session_id')
    if not session_id:
        raise HTTPException(status_code=400, detail='Brak session_id')
    ticket = service.confirm_and_create_ticket(db, session_id, create_ticket_fn)
    return ticket
