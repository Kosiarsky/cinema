from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from datetime import date

class TicketPriceResponse(BaseModel):
    id: int
    type: str
    cheap_thursday: str
    three_days_before: str
    two_days_before: str
    one_day_before: str
    same_day: str

    class Config:
        orm_mode = True