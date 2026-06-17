# VPS Path Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Paymory from the VPS root to `/paymory` and use the root IP page as a simple launcher for projects.

**Architecture:** Keep local development rooted at `/`, but build production with a `/paymory/` base path. Nginx serves a static launcher at `/`, serves the Paymory build under `/paymory/`, and proxies `/paymory/api/*` to the existing Express `/api/*` routes.

**Tech Stack:** React, Vite, React Router, Express, nginx, PM2, PostgreSQL.

---

## File Structure

- Modify `client/vite.config.ts`: read `VITE_BASE_PATH` and set Vite `base`.
- Modify `client/src/main.tsx`: set React Router basename from `VITE_BASE_PATH`.
- Modify `client/src/api.ts`: read `VITE_API_BASE` instead of hardcoding `/api`.
- Create `client/.env.development`: local base path and API path.
- Create `client/.env.production`: production base path and API path.
- Create `deploy/launcher/index.html`: static root launcher page for nginx.
- Do not change Express route definitions in `server/src/index.ts`.
- Update VPS nginx config after the local build is verified.

## Task 1: Add Vite Environment Defaults

**Files:**
- Create: `client/.env.development`
- Create: `client/.env.production`

- [ ] **Step 1: Create development env**

Create `client/.env.development`:

```text
VITE_BASE_PATH=/
VITE_API_BASE=/api
```

- [ ] **Step 2: Create production env**

Create `client/.env.production`:

```text
VITE_BASE_PATH=/paymory/
VITE_API_BASE=/paymory/api
```

- [ ] **Step 3: Verify files are picked up by Vite**

Run:

```bash
npm.cmd run build
```

Expected before code changes: build may still emit root-based assets because `vite.config.ts` has not been updated yet.

## Task 2: Make Vite Build Assets Under `/paymory/`

**Files:**
- Modify: `client/vite.config.ts`

- [ ] **Step 1: Update Vite base config**

Change `client/vite.config.ts` to:

```ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
    server: {
      proxy: {
        '/api': 'http://localhost:4000',
      },
    },
  }
})
```

- [ ] **Step 2: Build and inspect asset paths**

Run:

```bash
npm.cmd run build
```

Expected:

```text
client/dist/index.html
```

contains asset URLs starting with:

```text
/paymory/assets/
```

## Task 3: Make React Router Aware of the Production Base Path

**Files:**
- Modify: `client/src/main.tsx`

- [ ] **Step 1: Inspect current router**

Open `client/src/main.tsx` and find the top-level `BrowserRouter`.

- [ ] **Step 2: Add basename helper**

Use this helper near the top of `client/src/main.tsx`:

```ts
const basePath = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/$/, '')
```

- [ ] **Step 3: Pass basename into the router**

If the app uses `BrowserRouter`, use:

```tsx
<BrowserRouter basename={basePath}>
  {/* existing routes */}
</BrowserRouter>
```

For local development, `VITE_BASE_PATH=/`, so `basePath` becomes an empty string and URLs stay like:

```text
http://localhost:5173/login
```

For production, `VITE_BASE_PATH=/paymory/`, so the app accepts:

```text
http://187.127.110.15/paymory/login
```

- [ ] **Step 4: Run local dev smoke check**

Run:

```bash
npm.cmd run dev
```

Open:

```text
http://localhost:5173/login
```

Expected: login page still renders locally.

## Task 4: Make API Base Configurable

**Files:**
- Modify: `client/src/api.ts`

- [ ] **Step 1: Replace hardcoded API base**

Change:

```ts
const BASE = '/api'
```

to:

```ts
const BASE = import.meta.env.VITE_API_BASE || '/api'
```

- [ ] **Step 2: Verify local API path remains unchanged**

Run local dev and trigger a login/me request.

Expected request path in development:

```text
/api/...
```

- [ ] **Step 3: Verify production API path in build**

Run:

```bash
npm.cmd run build
```

Expected bundled client uses:

```text
/paymory/api
```

## Task 5: Add Static Launcher

**Files:**
- Create: `deploy/launcher/index.html`

- [ ] **Step 1: Create launcher HTML**

Create `deploy/launcher/index.html`:

```html
<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Tamma VPS Projects</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: #f6f7f9;
        color: #171717;
      }
      main {
        max-width: 880px;
        margin: 0 auto;
        padding: 48px 20px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 32px;
      }
      p {
        color: #555;
        line-height: 1.6;
      }
      .project {
        display: block;
        margin-top: 24px;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: white;
        text-decoration: none;
        color: inherit;
      }
      .project strong {
        display: block;
        margin-bottom: 6px;
        font-size: 20px;
      }
      .project span {
        color: #666;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Tamma VPS Projects</h1>
      <p>รวมโปรเจกต์ที่รันอยู่บน VPS เครื่องนี้</p>

      <a class="project" href="/paymory/login">
        <strong>Paymory</strong>
        <span>แอปติดตามค่าใช้จ่ายสำหรับคู่รัก</span>
      </a>
    </main>
  </body>
</html>
```

- [ ] **Step 2: Open launcher locally as a static file**

Open `deploy/launcher/index.html` in a browser.

Expected: a simple project launcher appears and the Paymory link points to `/paymory/login`.

## Task 6: Build and Upload to VPS

**Files:**
- Use build output from `client/dist`
- Use launcher output from `deploy/launcher`

- [ ] **Step 1: Build production client**

Run:

```bash
npm.cmd run build
```

Expected: build exits with code 0.

- [ ] **Step 2: Copy Paymory build to VPS**

Copy local `client/dist` to:

```text
/var/www/paymory/client/dist
```

- [ ] **Step 3: Copy launcher to VPS**

Copy local `deploy/launcher/index.html` to:

```text
/var/www/launcher/index.html
```

## Task 7: Update Nginx Routing

**Files:**
- Modify on VPS: `/etc/nginx/sites-available/paymory`

- [ ] **Step 1: Replace nginx site config**

Use this server block:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/launcher;
    index index.html;

    location = / {
        try_files /index.html =404;
    }

    location /paymory/api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /paymory/ {
        alias /var/www/paymory/client/dist/;
        try_files $uri $uri/ /paymory/index.html;
    }
}
```

- [ ] **Step 2: Test nginx config**

Run on VPS:

```bash
nginx -t
```

Expected:

```text
syntax is ok
test is successful
```

- [ ] **Step 3: Reload nginx**

Run on VPS:

```bash
systemctl reload nginx
```

Expected: command exits with code 0.

## Task 8: Verify Public URLs

**Files:**
- No file changes.

- [ ] **Step 1: Verify launcher**

Run:

```bash
curl.exe -sS -o NUL -w "launcher %{http_code} %{content_type}\n" --max-time 15 http://187.127.110.15/
```

Expected:

```text
launcher 200 text/html
```

- [ ] **Step 2: Verify Paymory route**

Run:

```bash
curl.exe -sS -o NUL -w "paymory-login %{http_code} %{content_type}\n" --max-time 15 http://187.127.110.15/paymory/login
```

Expected:

```text
paymory-login 200 text/html
```

- [ ] **Step 3: Verify Paymory API**

Run:

```bash
curl.exe -sS --max-time 15 http://187.127.110.15/paymory/api/health
```

Expected JSON includes:

```json
{"status":"ok","db":"connected"}
```

- [ ] **Step 4: Verify old root app path no longer serves Paymory**

Run:

```bash
curl.exe -sS -o NUL -w "old-login %{http_code} %{content_type}\n" --max-time 15 http://187.127.110.15/login
```

Expected: either launcher fallback behavior is intentionally absent, or nginx returns a non-Paymory response. The canonical Paymory URL is `/paymory/login`.

## Task 9: Document New Deployment Pattern

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add VPS URL section**

Add a short section:

```markdown
## VPS URLs

Temporary no-domain layout:

- Launcher: `http://187.127.110.15/`
- Paymory: `http://187.127.110.15/paymory/`
- Paymory login: `http://187.127.110.15/paymory/login`
- Paymory API health: `http://187.127.110.15/paymory/api/health`

Local development still uses:

- Web: `http://localhost:5173`
- API: `http://localhost:4000/api/health`
```

- [ ] **Step 2: Commit changes**

Run:

```bash
git add client deploy docs README.md
git commit -m "Plan VPS path launcher deployment"
```

Expected: commit succeeds after implementation and verification.

## Self-Review

- Spec coverage: plan covers local base paths, production path prefix, launcher, nginx routing, public verification, and documentation.
- Placeholder scan: no task contains TBD/TODO placeholders.
- Scope check: the plan handles only Paymory plus a root launcher. Future projects should each get their own follow-up plan.
