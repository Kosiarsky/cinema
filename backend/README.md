# Backend configuration

Centralized configuration for URLs is handled in `src/config.py` and the `.env` file.

- FRONTEND_BASE_URL: Base URL of the Angular app used for building success/cancel URLs (Stripe) and default CORS origin.
- CORS_ALLOW_ORIGINS: Comma-separated list of allowed origins for CORS. Defaults to `FRONTEND_BASE_URL` if not set.
- SQLALCHEMY_DATABASE_URL: Connection string for Postgres (used by app and Alembic).
- JWT_SECRET_KEY: Secret used to sign JWT access/refresh tokens.

Usage:

1. Copy `.env.example` to `.env` and edit values as needed.
2. Ensure environment variables are available when starting the server.

Alembic:
- `alembic.ini` still contains a default `sqlalchemy.url`, but `alembic/env.py` now loads `backend/.env` and overrides the URL with `SQLALCHEMY_DATABASE_URL` if set.
- This lets you switch DBs per environment without editing `alembic.ini`.

PowerShell example:

$env:FRONTEND_BASE_URL = "http://localhost:4200"
$env:CORS_ALLOW_ORIGINS = "http://localhost:4200,http://localhost:3000"
$env:SQLALCHEMY_DATABASE_URL = "postgresql://postgres:admin@localhost/apollo"

