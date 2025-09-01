import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

SQLALCHEMY_DATABASE_URL = os.getenv("SQLALCHEMY_DATABASE_URL", "")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10
REFRESH_TOKEN_EXPIRE_MINUTES = 10080
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "")

_cors_from_env = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
if _cors_from_env:
    CORS_ALLOW_ORIGINS = [o.strip() for o in _cors_from_env.split(",") if o.strip()]
else:
    CORS_ALLOW_ORIGINS = [FRONTEND_BASE_URL]