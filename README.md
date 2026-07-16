# Pathology Manager — Web

Angular 21 (standalone components, signals, typed `HttpClient`) frontend for the Pathology Manager API.

## Features

- **Pathology list** (`/pathologies`) — calls `GET /api/pathologies`.
- **Pathology details** (`/pathologies/:id`) — `GET /api/pathologies/{id}`; shows a display-safe license summary (status, expiry, days left) with **no key**.
- **License view** — on demand, loads `GET /api/pathologies/{id}/license` (full record). The key is **masked by default** and only revealed on click.
- **Extend license** — form that POSTs to `/api/licenses/{id}/extend` (by months or to a date) and refreshes the view.
- Loading and error states on every request; one typed `ApiService` gateway.

## Structure

```
src/app/
  app.ts / app.config.ts / app.routes.ts   # standalone bootstrap + routing
  core/
    models/pathology.models.ts             # typed API contracts
    services/api.service.ts                # single typed HttpClient gateway
  features/
    pathologies/  pathology-list, pathology-details
    license/      license-view, extend-license
src/environments/
  environment.ts               # prod (same-origin API)
  environment.development.ts   # dev  → http://localhost:5080
```

The API base URL lives in the environment files. `ng serve` uses the `development` config (via `angular.json` fileReplacements), which points at `http://localhost:5080`.

## Environments

Four environments, each pointing at its matching API. `environment.ts` holds the **production** values; the others replace it per build configuration (`angular.json` → `fileReplacements`):

| Environment | File | `apiBaseUrl` (edit to your real host) | Serve | Build |
|---|---|---|---|---|
| Development | `environment.development.ts` | `http://localhost:5080` | `npm start` | `npm run build:dev` |
| QA | `environment.qa.ts` | `https://qa-api…` (placeholder) | `npm run start:qa` | `npm run build:qa` |
| UAT | `environment.uat.ts` | `https://uat-api…` (placeholder) | `npm run start:uat` | `npm run build:uat` |
| Production | `environment.ts` | `https://api…` (placeholder) | — | `npm run build:prod` |

Replace the placeholder hosts in `environment.qa.ts`, `environment.uat.ts`, and `environment.ts` with your real QA/UAT/Prod API URLs. Each UI environment's `apiBaseUrl` must match the corresponding API environment's host/port from the API README.

## Prerequisites

- **Node.js** (LTS) and the **Angular CLI 21**. Verify with:

  ```bash
  node --version
  ng version        # expect Angular CLI 21.x
  ```

  If you don't have the v21 CLI: `npm install -g @angular/cli@21`

> Note: this app was authored as source files; `npm install` / `ng` were **not** run during authoring. Run the steps below to install dependencies and start it. If dependency resolution ever conflicts, the quickest reset is to `ng new pathology-manager-web` in a temp folder and copy the `src/` folder plus `environment` files over — the code targets Angular 21 conventions.

## Run

```bash
npm install
npm start           # → http://localhost:4200
```

Make sure the API is running first (see the API README) so requests to `http://localhost:5080` succeed. The API already allows the `http://localhost:4200` origin via CORS.

## Build

```bash
npm run build       # production build → dist/
```

## Security note (localStorage / license key)

Consistent with the app's security model: the frontend only ever caches the **display-safe** license fields (number, expiry, status). The raw key is fetched on demand from a restricted endpoint and masked in the UI — it is never persisted client-side. Encrypting the key in localStorage would not help, because the browser would also hold the decryption key; the boundary is enforced server-side instead.
