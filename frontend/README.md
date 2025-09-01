# Frontend

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Configuration

URLs are centralized and provided via Angular DI tokens, with runtime overrides:

- Tokens:
  - `API_BASE_URL_TOKEN` and `FRONTEND_BASE_URL_TOKEN` are defined in `src/app/shared/tokens.ts` and provided in `src/app/app.config.ts`.
  - They read values from `window.__API_BASE_URL__` / `window.__FRONTEND_BASE_URL__` (browser) or `process.env.API_BASE_URL` / `process.env.FRONTEND_BASE_URL` (SSR), with localhost fallbacks.
- Runtime overrides (no rebuild):
  - Edit or replace `src/assets/runtime-config.js` to set:
    - `window.__API_BASE_URL__ = 'https://api.example.com'`
    - `window.__FRONTEND_BASE_URL__ = 'https://app.example.com'`
  - This script is loaded by `src/index.html` and can be swapped during deployment.
- Server-side rendering (Node) env vars:
  - Create `frontend/.env` (copy from `.env.example`). These variables are loaded by SSR automatically:
    - `API_BASE_URL`, `FRONTEND_BASE_URL`, `PORT`
  - Or set them before starting the SSR server:
    - PowerShell example:
      - `$env:API_BASE_URL = "https://api.example.com"`
      - `$env:FRONTEND_BASE_URL = "https://app.example.com"`

Usage in code:
- Inject the tokens where you need the URLs, e.g. in services/components:
  - `constructor(@Inject(API_BASE_URL_TOKEN) apiBase: string) { ... }`
  - `constructor(@Inject(FRONTEND_BASE_URL_TOKEN) appBase: string) { ... }`
- Image URLs: use helper `toAbs` from `src/app/shared/env.ts` (it resolves API base internally).

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
