from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from get_db import get_db
from user import service
from user.schemas import UserCreate, UserResponse, UserLogin
from user.service import admin_required
from sqlalchemy import func
from schemas import Ticket, TicketSeat, Schedule, Movie, Slide, News
from datetime import date, timedelta, datetime
from typing import Optional
from admin.schemas import SlideCreate, SlideUpdate, NewsCreate, NewsUpdate

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


@router.get('/slides')
def admin_list_slides(db: Session = Depends(get_db), current_user = Depends(admin_required)):
    return db.query(Slide).order_by(Slide.sort_order.asc(), Slide.id.desc()).all()

@router.post('/slides')
def admin_create_slide(payload: SlideCreate, db: Session = Depends(get_db), current_user = Depends(admin_required)):
    slide = Slide(
        title=payload.title,
        description=payload.description,
        image=payload.image,
        movie_id=payload.movie_id,
        sort_order=payload.sort_order if payload.sort_order is not None else 0,
        is_public=1 if (payload.is_public is None or payload.is_public) else 0,
    )
    db.add(slide)
    db.commit()
    db.refresh(slide)
    return slide

@router.patch('/slides/{slide_id}')
def admin_update_slide(slide_id: int, payload: SlideUpdate, db: Session = Depends(get_db), current_user = Depends(admin_required)):
    slide = db.query(Slide).filter(Slide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=404, detail='Slide not found')
    if payload.title is not None:
        slide.title = payload.title
    if payload.description is not None:
        slide.description = payload.description
    if payload.image is not None:
        slide.image = payload.image
    if payload.movie_id is not None:
        slide.movie_id = payload.movie_id
    if payload.sort_order is not None:
        slide.sort_order = payload.sort_order
    if payload.is_public is not None:
        slide.is_public = 1 if payload.is_public else 0
    db.commit()
    db.refresh(slide)
    return slide

@router.delete('/slides/{slide_id}')
def admin_delete_slide(slide_id: int, db: Session = Depends(get_db), current_user = Depends(admin_required)):
    slide = db.query(Slide).filter(Slide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=404, detail='Slide not found')
    db.delete(slide)
    db.commit()
    return { 'status': 'ok' }

@router.get('/news')
def admin_list_news(db: Session = Depends(get_db), current_user = Depends(admin_required)):
    return db.query(News).order_by(News.date.desc(), News.id.desc()).all()

@router.post('/news')
def admin_create_news(payload: NewsCreate, db: Session = Depends(get_db), current_user = Depends(admin_required)):
    n = News(
        title=payload.title,
        content=payload.content,
        date=datetime.fromisoformat(payload.date).date() if payload.date else date.today(),
        image=payload.image,
        movie_id=payload.movie_id,
        is_public=1 if (payload.is_public is None or payload.is_public) else 0,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n

@router.patch('/news/{news_id}')
def admin_update_news(news_id: int, payload: NewsUpdate, db: Session = Depends(get_db), current_user = Depends(admin_required)):
    n = db.query(News).filter(News.id == news_id).first()
    if not n:
        raise HTTPException(status_code=404, detail='News not found')
    if payload.title is not None:
        n.title = payload.title
    if payload.content is not None:
        n.content = payload.content
    if payload.date is not None:
        try:
            n.date = datetime.fromisoformat(payload.date).date()
        except Exception:
            raise HTTPException(status_code=400, detail='Invalid date format, expected ISO date')
    if payload.image is not None:
        n.image = payload.image
    if payload.movie_id is not None:
        n.movie_id = payload.movie_id
    if payload.is_public is not None:
        n.is_public = 1 if payload.is_public else 0
    db.commit()
    db.refresh(n)
    return n

@router.delete('/news/{news_id}')
def admin_delete_news(news_id: int, db: Session = Depends(get_db), current_user = Depends(admin_required)):
    n = db.query(News).filter(News.id == news_id).first()
    if not n:
        raise HTTPException(status_code=404, detail='News not found')
    db.delete(n)
    db.commit()
    return { 'status': 'ok' }