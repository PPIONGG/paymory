# Use a React SPA + Express API instead of Next.js

Paymory is a Vite + React SPA (`client/`) talking over HTTP to a separate Express + Prisma API (`server/`), backed by PostgreSQL — deliberately *not* Next.js, the usual default for a React full-stack app.

Why: (1) the whole app sits behind authentication, so there is no SEO/SSR benefit to gain from Next.js; (2) from prior hands-on experience, Next.js grows heavy and slow as features accumulate (RSC / hydration / build complexity), while a Vite SPA stays light and a small Express API is easy to reason about and to run on a single VPS — Nginx serves the static client, PM2 runs the API process.

Note for a future reader tempted to "modernize" onto Next.js: re-check reason (1) first. With no SEO requirement, the migration buys little and reintroduces the weight we chose to avoid.
