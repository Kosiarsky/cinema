import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:admin@localhost/apollo"
SECRET_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTcxNzY3NzQwNSwiaWF0IjoxNzE3Njc3NDA1fQ.dBxxeommI9S-xpLj9gw3kDZwl0dnwD_dDB8lJSeRkhc" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10
REFRESH_TOKEN_EXPIRE_MINUTES = 10080

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:4200")

_cors_from_env = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
if _cors_from_env:
    CORS_ALLOW_ORIGINS = [o.strip() for o in _cors_from_env.split(",") if o.strip()]
else:
    CORS_ALLOW_ORIGINS = [FRONTEND_BASE_URL]