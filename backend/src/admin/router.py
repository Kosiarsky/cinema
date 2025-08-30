from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from get_db import get_db
from user import service
from user.schemas import UserCreate, UserResponse, UserLogin
from user.service import admin_required
from sqlalchemy import func
from schemas import Ticket, TicketSeat, Schedule, Movie
from datetime import date, timedelta
from typing import Optional

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = service.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return service.create_user(db, user)

@router.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    authenticated_user = service.authenticate_user(db, user.email, user.password)
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    return {"message": "Login successful", "user": authenticated_user.email}

@router.get('/users')
def admin_list_users(db: Session = Depends(get_db), current_user = Depends(admin_required)):
    users = service.list_users(db)
    return [
        {
            'id': u.id,
            'email': u.email,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'phone': getattr(u, 'phone', None),
            'is_admin': u.is_admin
        } for u in users
    ]

@router.patch('/users/{user_id}')
def admin_update_user(user_id: int, payload: dict, db: Session = Depends(get_db), current_user = Depends(admin_required)):
    updated = service.admin_update_user(db, user_id, payload)
    return {
        'id': updated.id,
        'email': updated.email,
        'first_name': updated.first_name,
        'last_name': updated.last_name,
        'phone': getattr(updated, 'phone', None),
        'is_admin': updated.is_admin
    }

@router.post('/users/{user_id}/promote')
def admin_promote_user(user_id: int, db: Session = Depends(get_db), current_user = Depends(admin_required)):
    updated = service.admin_update_user(db, user_id, { 'is_admin': 1 })
    return { 'status': 'ok', 'user_id': updated.id, 'is_admin': updated.is_admin }

@router.post('/users/{user_id}/demote')
def admin_demote_user(user_id: int, db: Session = Depends(get_db), current_user = Depends(admin_required)):
    updated = service.admin_update_user(db, user_id, { 'is_admin': 0 })
    return { 'status': 'ok', 'user_id': updated.id, 'is_admin': updated.is_admin }

@router.delete('/users/{user_id}')
def admin_delete_user(user_id: int, db: Session = Depends(get_db), current_user = Depends(admin_required)):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail='Nie można usunąć własnego konta')
    result = service.delete_user(db, user_id)
    return result

# --- Admin stats ---
@router.get("/stats/overview")
def stats_overview(days: int = 30, from_date: Optional[date] = None, to_date: Optional[date] = None, db: Session = Depends(get_db), current_user = Depends(admin_required)):
    try:
        if from_date and to_date:
            since = from_date
            until = to_date
        else:
            since = date.today() - timedelta(days=days)
            until = date.today()

        total_revenue_q = db.query(func.coalesce(func.sum(Ticket.total_price), 0.0))
        total_orders_q = db.query(func.count(Ticket.id))
        total_tickets_q = db.query(func.count(TicketSeat.id)).join(Ticket, TicketSeat.ticket_id == Ticket.id)

        if from_date and to_date:
            total_revenue_q = total_revenue_q.filter(Ticket.purchase_date.between(since, until))
            total_orders_q = total_orders_q.filter(Ticket.purchase_date.between(since, until))
            total_tickets_q = total_tickets_q.filter(Ticket.purchase_date.between(since, until))

        total_revenue = total_revenue_q.scalar() or 0.0
        total_orders = total_orders_q.scalar() or 0
        total_tickets = total_tickets_q.scalar() or 0

        daily_rows = (
            db.query(
                Ticket.purchase_date.label('d'),
                func.coalesce(func.sum(Ticket.total_price), 0.0).label('revenue'),
                func.count(Ticket.id).label('orders')
            )
            .filter(Ticket.purchase_date.between(since, until))
            .group_by(Ticket.purchase_date)
            .order_by(Ticket.purchase_date)
            .all()
        )
        seats_daily_rows = (
            db.query(
                Ticket.purchase_date.label('d'),
                func.count(TicketSeat.id).label('tickets')
            )
            .join(TicketSeat, TicketSeat.ticket_id == Ticket.id)
            .filter(Ticket.purchase_date.between(since, until))
            .group_by(Ticket.purchase_date)
            .all()
        )
        seats_map = {r.d: r.tickets for r in seats_daily_rows}
        last_days = []
        cur = since
        while cur <= until:
            row = next((x for x in daily_rows if x.d == cur), None)
            last_days.append({
                'date': cur.isoformat(),
                'revenue': float(row.revenue) if row else 0.0,
                'orders': int(row.orders) if row else 0,
                'tickets': int(seats_map.get(cur, 0)),
            })
            cur += timedelta(days=1)

        return {
            'total_revenue': float(total_revenue),
            'total_orders': int(total_orders),
            'total_tickets': int(total_tickets),
            'last_days': last_days,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/stats/top-movies")
def stats_top_movies(days: int = 30, limit: int = 5, from_date: Optional[date] = None, to_date: Optional[date] = None, db: Session = Depends(get_db), current_user = Depends(admin_required)):
    try:
        if from_date and to_date:
            since = from_date
            until = to_date
        else:
            since = date.today() - timedelta(days=days)
            until = date.today()

        q = (
            db.query(
                Movie.id.label('movie_id'),
                Movie.title.label('title'),
                func.count(TicketSeat.id).label('tickets_sold'),
                func.coalesce(func.sum(Ticket.total_price), 0.0).label('revenue')
            )
            .join(Schedule, Schedule.movie_id == Movie.id)
            .join(Ticket, Ticket.schedule_id == Schedule.id)
            .join(TicketSeat, TicketSeat.ticket_id == Ticket.id)
            .filter(Ticket.purchase_date.between(since, until))
            .group_by(Movie.id, Movie.title)
            .order_by(func.count(TicketSeat.id).desc())
            .limit(limit)
        )
        rows = q.all()
        return [
            {
                'movie_id': r.movie_id,
                'title': r.title,
                'tickets_sold': int(r.tickets_sold),
                'revenue': float(r.revenue),
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/stats/top-sessions")
def stats_top_sessions(days: int = 30, limit: int = 5, from_date: Optional[date] = None, to_date: Optional[date] = None, db: Session = Depends(get_db), current_user = Depends(admin_required)):
    try:
        if from_date and to_date:
            since = from_date
            until = to_date
        else:
            since = date.today() - timedelta(days=days)
            until = date.today()

        rows = (
            db.query(
                Schedule.id.label('schedule_id'),
                Schedule.date.label('date'),
                Schedule.time.label('time'),
                Schedule.hall.label('hall'),
                Movie.title.label('movie_title'),
                func.count(TicketSeat.id).label('tickets_sold'),
                func.coalesce(func.sum(TicketSeat.price), 0.0).label('revenue')
            )
            .join(Movie, Movie.id == Schedule.movie_id)
            .join(Ticket, Ticket.schedule_id == Schedule.id)
            .join(TicketSeat, TicketSeat.ticket_id == Ticket.id)
            .filter(Ticket.purchase_date.between(since, until))
            .group_by(Schedule.id, Schedule.date, Schedule.time, Schedule.hall, Movie.title)
            .order_by(func.count(TicketSeat.id).desc())
            .limit(limit)
            .all()
        )
        return [
            {
                'schedule_id': r.schedule_id,
                'movie_title': r.movie_title,
                'date': r.date.isoformat(),
                'time': r.time,
                'hall': r.hall,
                'tickets_sold': int(r.tickets_sold),
                'revenue': float(r.revenue),
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))