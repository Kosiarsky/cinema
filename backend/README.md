# Backend configuration

Centralized configuration for URLs is handled in `src/config.py` and the `.env` file.

- FRONTEND_BASE_URL: Base URL of the Angular app used for building success/cancel URLs (Stripe) and default CORS origin.
- CORS_ALLOW_ORIGINS: Comma-separated list of allowed origins for CORS. Defaults to `FRONTEND_BASE_URL` if not set.

Usage:

1. Copy `.env.example` to `.env` and edit values as needed.
2. Ensure environment variables are available when starting the server.

PowerShell example:

$env:FRONTEND_BASE_URL = "http://localhost:4200"
$env:CORS_ALLOW_ORIGINS = "http://localhost:4200,http://localhost:3000"

