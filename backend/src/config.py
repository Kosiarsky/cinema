import os
from pathlib import Path
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:admin@localhost/apollo"
SECRET_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcxNzY3NzQwNSwiaWF0IjoxNzE3Njc3NDA1fQ.dBxxeommI9S-xpLj9gw3kDZwl0dnwD_dDB8lJSeRkhc" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10
REFRESH_TOKEN_EXPIRE_MINUTES = 10080

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")