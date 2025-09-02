# Frontend

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Configuration

URLs are centralized and provided via Angular DI tokens, with runtime overrides:

- Tokens:
  - `API_BASE_URL_TOKEN` and `FRONTEND_BASE_URL_TOKEN` are defined in `src/app/shared/tokens.ts` and provided in `src/app/app.config.ts`.
  - They read values from `window.__API_BASE_URL__` / `window.__FRONTEND_BASE_URL__` (browser) or `process.env.API_BASE_URL` / `process.env.FRONTEND_BASE_URL` (SSR), with localhost fallbacks.
- Preferred in CSR: runtime-config.js (no rebuild):
  - Copy `src/assets/runtime-config.example.js` to `src/assets/runtime-config.js` and set URLs:
    - `window.__API_BASE_URL__ = 'https://api.example.com'`
    - `window.__FRONTEND_BASE_URL__ = 'https://app.example.com'`
  - This file is gitignored; safe to customize per environment.
- Server-side rendering (Node) env vars (optional):
  - Create `frontend/.env` (copy from `.env.example`) OR set env vars before starting SSR.
  - SSR loads `.env` automatically via `dotenv`.

Usage in code:
- Inject the tokens where you need the URLs, e.g. in services/components:
  - `constructor(@Inject(API_BASE_URL_TOKEN) apiBase: string) { ... }`
  - `constructor(@Inject(FRONTEND_BASE_URL_TOKEN) appBase: string) { ... }`
- Image URLs: use helper `toAbs` from `src/app/shared/env.ts`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
