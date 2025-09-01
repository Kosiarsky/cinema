# Cinema (Angular + FastAPI) — uruchomienie i konfiguracja na Windows (PowerShell)
Aplikacja to system kina. Frontend - Angular 17, backend - FastAPI, baza danych - PostgreSQL. Całość korzysta z JWT do autoryzacji, Alembica do migracji oraz Stripe do płatności.

Najważniejsze elementy:
- Frontend: Angular, komunikacja z API, widoki: repertuar, szczegóły filmu, lista seansów, wybór miejsc, koszyk/checkout, panel konta, panel administratora; konfiguracja przez plik .env.
- Backend: FastAPI z root_path /api, moduły: uwierzytelnianie (JWT access/refresh), filmy, seanse, sale/miejsca, rezerwacje, płatności (Stripe), użytkownicy; walidacja Pydantic, SQLAlchemy (async), CORS; migracje przez Alembica; dokumentacja OpenAPI pod /api/docs.
- Baza: PostgreSQL; inicjalizacja przez snapshot lub migracje.
- Konfiguracja: backend/.env (DB URL, klucze JWT, Stripe, CORS), frontend/.env (adresy API/Frontend, port SSR).
- Przepływ użytkownika: przegląd repertuaru → wybór seansu i miejsc → rezerwacja → płatność Stripe → potwierdzenie; panel administracyjny umożliwia zarządzanie repertuarem.

Adresy domyślne (dev): API http://localhost:8000/api, frontend http://localhost:4200.

Poniżej zwięzły przewodnik. Zawiera instrukcje konfiguracji, snapshotu bazy i startu "na czysto" z Alembica.

## Wymagania wstępne
- Node.js 18+ (zalecane LTS) i npm
- Python 3.11+
- pip i wirtualne środowisko (venv)
- PostgreSQL 14+ oraz pgAdmin 4
- Visual C++ Redistributable (często wymagane przez niektóre paczki Python)

## Struktura repo (skrócona)
- backend/ — FastAPI, Alembic, zależności Pythona
- frontend/ — Angular 17 

## 1) Baza danych (PostgreSQL + pgAdmin)
1. Zainstaluj PostgreSQL i pgAdmin.
2. Utwórz bazę o nazwie apollo (lub inną — patrz konfiguracja poniżej).
3. Upewnij się, że dane logowania pokrywają się z konfiguracją:
   - domyślnie użytkownik: postgres, hasło: admin, host: localhost

Skonfiguruj `backend/.env` (szczegóły niżej). Alembic automatycznie pobierze URL bazy z `.env` i nadpisze `sqlalchemy.url` z `alembic.ini`.

## 2) Backend (FastAPI)
Katalog: backend/

### 2.1 Konfiguracja
Pliki konfiguracyjne:
- backend/src/config.py
- backend/.env =

Co uzupełnić/zmienić:
- Łącze do bazy:
  - backend/.env → SQLALCHEMY_DATABASE_URL, np.:
    - postgresql://postgres:admin@localhost/apollo
  - Alembic nadpisze `sqlalchemy.url` wartością z `.env` (patrz `alembic/env.py`).
- Klucze bezpieczeństwa i czasy tokenów:
  - backend/.env → JWT_SECRET_KEY (klucz do podpisywania tokenów JWT — ustaw silny, losowy)
    - przykład generowania: python -c "import secrets; print(secrets.token_urlsafe(64))"
  - ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_MINUTES — opcjonalnie (w src/config.py)
- CORS/URL frontendu:
  - backend/.env → FRONTEND_BASE_URL (np. http://localhost:4200)
- Stripe :
  - backend/.env → STRIPE_SECRET_KEY

Uwaga: Aplikacja FastAPI działa z root_path='/api', więc API będzie pod http://localhost:8000/api.

### 2.2 Instalacja zależności (PowerShell)
- python -m venv venv
- .\venv\Scripts\Activate.ps1
- pip install -r requirements.txt

### 2.3 Migracje (Alembic)
- Nie musisz ręcznie edytować `alembic.ini`. `alembic/env.py` ładuje `backend/.env` i używa `SQLALCHEMY_DATABASE_URL`.
- Wykonaj migracje: alembic upgrade head

### 2.4 Start serwera API (dev)
- fastapi dev ./main.py
- API: http://localhost:8000/api

## 3) Frontend (Angular)
Katalog: frontend/

### 3.1 Instalacja zależności
- npm install

### 3.2 Konfiguracja URL-i (CSR i SSR)
- Domyślne źródła:
  - frontend/.env → API_BASE_URL
  - frontend/.env → FRONTEND_BASE_URL
  - frontend/.env → PORT (domyślnie 4000)

### 3.3 Plik .env w frontendzie
- Skopiuj frontend/.env.example do frontend/.env i ustaw:
  - API_BASE_URL=http://localhost:8000
  - FRONTEND_BASE_URL=http://localhost:4200
  - PORT=4000 (port SSR)
- SSR ładuje .env automatycznie (import 'dotenv/config' w server.ts).

### 3.4 Start frontendu (dev, CSR)
- npm start
- Aplikacja: http://localhost:4200/

## 4) Ustawienia/sekcje do edycji (szybkie podsumowanie)
- backend/.env
  - SQLALCHEMY_DATABASE_URL — łącze do bazy (używane przez aplikację i Alembic)
  - JWT_SECRET_KEY — koniecznie ustaw
  - FRONTEND_BASE_URL — adres frontendu
  - STRIPE_SECRET_KEY 
- backend/alembic.ini
  - może pozostać domyślny; URL i tak nadpisuje .env (przez `alembic/env.py`)
- frontend/.env
  - API_BASE_URL, FRONTEND_BASE_URL, PORT — używane przez SSR i synchronizowane do CSR

## 5) Inicjalizacja bazy — snapshot vs. Alembic (na czysto)
Masz dwie drogi:

### A) Przywrócenie snapshotu (szybkie odwzorowanie aktualnych danych — domyślna ścieżka)
- Domyślny snapshot: `backend/db/snapshot-test.sql`.
- Przywrócenie (PowerShell):
  - $env:PGPASSWORD = 'admin'   # jeśli masz hasło postgres=admin
  - psql -U postgres -h localhost -d apollo -f backend/db/snapshot-test.sql

### B) Czysta baza z migracjami Alembic
- Stwórz pustą bazę apollo (w pgAdmin lub poleceniami createdb)
- Upewnij się, że `backend/.env` zawiera poprawny `SQLALCHEMY_DATABASE_URL`
- Uruchom migracje: alembic upgrade head

## 7) Kolejność uruchomienia (dev)
1. Baza: upewnij się, że PostgreSQL działa; utwórz bazę apollo.
2. Backend:
   - venv → pip install
   - ustaw backend/.env (SQLALCHEMY_DATABASE_URL, JWT_SECRET_KEY, FRONTEND_BASE_URL, CORS_ALLOW_ORIGINS)
   - alembic upgrade head (lub przywróć snapshot)
   - fastapi dev ./main.py
3. Frontend:
   - npm install
   - ustaw frontend/.env (API_BASE_URL, FRONTEND_BASE_URL, PORT)
   - npm start

Gotowe. Po wykonaniu powyższych kroków można już korzystać z systemu kina!
