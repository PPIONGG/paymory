# VPS Path Launcher Design

## Goal

Host multiple personal projects on the same VPS public IP without buying a domain yet, while keeping URLs reasonably clean and leaving room to move to domains later.

## Current State

Paymory currently serves from the VPS root:

```text
http://187.127.110.15/
http://187.127.110.15/login
http://187.127.110.15/api/health
```

The VPS uses nginx on port 80 to serve `client/dist` and proxy `/api/*` to the Express server on `127.0.0.1:4000`.

## Target URL Layout

Use the VPS root as a lightweight project launcher:

```text
http://187.127.110.15/
```

Move Paymory under its own path:

```text
http://187.127.110.15/paymory/
http://187.127.110.15/paymory/login
http://187.127.110.15/paymory/api/health
```

Future projects can follow the same pattern:

```text
http://187.127.110.15/project-name/
http://187.127.110.15/project-name/api/health
```

## Launcher Design

The root page should be a quiet utility page, not a marketing landing page. It should show:

- VPS/project title.
- A card or row for Paymory.
- Open app link to `/paymory/login`.
- Health link or small status line for `/paymory/api/health`.
- Placeholder rows for future projects only if useful.

This can be a static HTML page served directly by nginx from a small launcher directory on the VPS.

## Local Development Contract

Local development should remain simple:

```text
http://localhost:5173/login
http://localhost:4000/api/health
```

Production should use the path prefix:

```text
/paymory/
/paymory/api
```

The client should read base settings from Vite environment variables:

```text
VITE_BASE_PATH=/
VITE_API_BASE=/api
```

for development, and:

```text
VITE_BASE_PATH=/paymory/
VITE_API_BASE=/paymory/api
```

for production.

## Nginx Contract

Nginx should route:

```text
/                         -> static launcher
/paymory/                 -> Paymory React build
/paymory/api/*            -> http://127.0.0.1:4000/api/*
```

The Express server can keep using `/api/*` internally. Nginx should strip `/paymory` before proxying API requests.

## Migration Notes

The first migration should avoid changing the database, auth model, or backend route definitions. The only required behavior changes are:

- React assets load from `/paymory/assets/...` in production.
- React Router treats `/paymory` as the app basename in production.
- API fetches use `/paymory/api` in production.
- Nginx serves a new launcher at `/`.

## Success Criteria

These URLs must work after migration:

```text
http://187.127.110.15/
http://187.127.110.15/paymory/
http://187.127.110.15/paymory/login
http://187.127.110.15/paymory/api/health
```

Local development must still work:

```text
http://localhost:5173/login
```
