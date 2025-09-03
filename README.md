# Cinema (Angular + FastAPI) — uruchomienie i konfiguracja na Windows
Aplikacja to system kina. Frontend - Angular 17, backend - FastAPI, baza danych - PostgreSQL. Całość korzysta z JWT do autoryzacji, Alembica do migracji oraz Stripe do płatności.

Najważniejsze elementy:
- Frontend: Angular, komunikacja z API, widoki: repertuar, szczegóły filmu, lista seansów, wybór miejsc, koszyk/checkout, panel konta, panel administratora; konfiguracja przez plik .env.
- Backend: FastAPI z root_path /api, moduły: uwierzytelnianie (JWT access/refresh), filmy, seanse, sale/miejsca, rezerwacje, płatności (Stripe), użytkownicy; walidacja Pydantic, SQLAlchemy (async), CORS; migracje przez Alembica; dokumentacja OpenAPI pod /api/docs.
- Baza: PostgreSQL; inicjalizacja przez snapshot lub migracje.
- Konfiguracja: backend/.env (DB URL, klucze JWT, Stripe, CORS), frontend/.env (adresy API/Frontend, port SSR) + certy w katalogu certs/ na poziomie repo.
- Przepływ użytkownika: przegląd repertuaru → wybór seansu i miejsc → rezerwacja → płatność Stripe → potwierdzenie; panel administracyjny umożliwia zarządzanie repertuarem.

Adresy domyślne (dev): API https://localhost:8000/api, frontend https://localhost:4000.

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
- certs/ — lokalne certyfikaty deweloperskie (nie dodawaj do repo)

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
- backend/.env

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
  - backend/.env → FRONTEND_BASE_URL (np. http://localhost:4000)
- Stripe :
  - backend/.env → STRIPE_SECRET_KEY

Uwaga: Aplikacja FastAPI działa z root_path='/api', więc API będzie pod https://127.0.0.1:8000/api.

### 2.2 Instalacja zależności (PowerShell)
- python -m venv venv
- .\venv\Scripts\Activate.ps1
- pip install -r requirements.txt

### 2.3 Migracje (Alembic)
- Nie musisz ręcznie edytować `alembic.ini`. `alembic/env.py` ładuje `backend/.env` i używa `SQLALCHEMY_DATABASE_URL`.
- Wykonaj migracje: alembic upgrade head

### 2.4 Start serwera API (dev)
- uvicorn main:app --host 127.0.0.1 --port 8000 --ssl-keyfile ..\..\certs\localhost.key --ssl-certfile ..\..\certs\localhost.crt
- API: https://127.0.0.1:8000/api

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
  - API_BASE_URL=https://localhost:8000
  - FRONTEND_BASE_URL=https://localhost:4000
  - PORT=4000 (port SSR)
  - FRONTEND_USE_HTTPS=true
  - FRONTEND_SSL_KEY_PATH=../certs/localhost.key (lub .pem w zależności co wygenerujesz)
  - FRONTEND_SSL_CERT_PATH=../certs/localhost.crt
- SSR ładuje .env automatycznie (import 'dotenv/config' w server.ts). Skrypt prebuild/prestart synchronizuje runtime-config dla CSR.

### 3.4 Certyfikaty
- OpenSSL:
  - Uruchom z poziomu katalogu repo:
    - openssl req -x509 -newkey rsa:2048 -nodes -keyout certs/localhost.key -out certs/localhost.crt -days 365 -subj "/CN=localhost"
  - Jeśli jesteś w katalogu certs/: pomiń prefiks certs/ w ścieżkach wyjściowych.

### 3.5 Start frontendu
- ng serve --ssl true --ssl-key ../certs/localhost.key --ssl-cert ../certs/localhost.crt --port 4000
- Aplikacja: https://localhost:4000/


## 4) Inicjalizacja bazy — snapshot vs. Alembic (na czysto)
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

## 7) Kolejność uruchomienia 
1. Baza: upewnij się, że PostgreSQL działa; utwórz bazę apollo.
2. Backend:
   - venv → pip install
   - ustaw backend/.env (SQLALCHEMY_DATABASE_URL, JWT_SECRET_KEY, FRONTEND_BASE_URL, CORS_ALLOW_ORIGINS)
   - alembic upgrade head (lub przywróć snapshot - opisane wcześniej)
   - w folderze src:
     uvicorn main:app --host 127.0.0.1 --port 8000 --ssl-keyfile ..\..\certs\localhost.key --ssl-certfile ..\..\certs\localhost.crt
3. Frontend:
   - npm install
   - ustaw frontend/.env (API_BASE_URL, FRONTEND_BASE_URL, PORT, FRONTEND_USE_HTTPS=true, ścieżki certów z certs/)
   - w folderze frontend:
     ng serve --ssl true --ssl-key ../certs/localhost.key --ssl-cert ../certs/localhost.crt --port 4000

Gotowe. Po wykonaniu powyższych kroków możesz korzystać z systemu kina pod HTTPS.

## Galeria zrzutów ekranu

### Strona główna
  <p align="center">
    <a href="img/stronaglowna1.png"><img src="img/stronaglowna1.png" alt="Strona główna 1" width="500"></a>
    <a href="img/stronaglowna2.png"><img src="img/stronaglowna2.png" alt="Strona główna 2" width="500"></a>
    <a href="img/stronaglowna3.png"><img src="img/stronaglowna3.png" alt="Strona główna 3" width="500"></a>
  </p>

### Repertuar, aktualności, polecane filmy
  <p align="center">
    <a href="img/repertuar.png"><img src="img/repertuar.png" alt="Repertuar" width="500"></a>
    <a href="img/aktualnosci.png"><img src="img/aktualnosci.png" alt="Aktualności" width="500"></a>
    <a href="img/polecane.png"><img src="img/polecane.png" alt="Polecane" width="500"></a>
  </p>

### Szczegóły filmu
  <p align="center">
    <a href="img/film1.png"><img src="img/film1.png" alt="Szczegóły filmu 1" width="500"></a>
    <a href="img/film2.png"><img src="img/film2.png" alt="Szczegóły filmu 2" width="500"></a>
    <a href="img/film3.png"><img src="img/film3.png" alt="Szczegóły filmu 3" width="500"></a>
  </p>

### Zakup Biletu
  <p align="center">
    <a href="img/wybormiejsc.png"><img src="img/wybormiejsc.png" alt="Wybór miejsc" width="500"></a>
    <a href="img/wyborbiletow.png"><img src="img/wyborbiletow.png" alt="Wybór biletów" width="500"></a>
    <a href="img/zakupionybilet.png"><img src="img/zakupionybilet.png" alt="Zakupiony bilet" width="500"></a>
  </p>

### Profil klienta, cennik kina
  <p align="center">
    <a href="img/profilklienta.png"><img src="img/profilklienta.png" alt="Profil klienta" width="500"></a>
    <a href="img/cennik.png"><img src="img/cennik.png" alt="Cennik (panel admina)" width="500"></a>
  </p>

### Panel administratora
  <p align="center">
    <a href="img/admin1.png"><img src="img/admin1.png" alt="Panel admina 1" width="500"></a>
    <a href="img/admin2.png"><img src="img/admin2.png" alt="Panel admina 2" width="500"></a>
    <a href="img/admin3.png"><img src="img/admin3.png" alt="Panel admina 3" width="500"></a>
    <a href="img/admin4.png"><img src="img/admin4.png" alt="Panel admina 4" width="500"></a>
    <a href="img/admin5.png"><img src="img/admin5.png" alt="Panel admina 5" width="500"></a>
  </p>