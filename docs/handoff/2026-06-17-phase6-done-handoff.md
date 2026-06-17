# Paymory — Handoff (2026-06-17, after Phase 6)

Continue building **Paymory**, a private recurring-expense tracker for a couple. This doc updates the prior handoffs after **Phase 6** (UX polish). It only covers what changed — read the prior handoffs and canonical docs first.

## Read these first (do not duplicate)
- `docs/handoff/2026-06-17-phase5-done-handoff.md` — **prior handoff**: Phase 5 (Expense Detail, Categories, Search/Filter), the API smoke-test pattern, and the Decimal-as-string reminder. Still holds *except* the "Phases done / Next" status (superseded here).
- `docs/handoff/2026-06-17-phase4-done-handoff.md` — Phase 4 (Dashboard + Monthly View) + the tsx/EADDRINUSE gotcha.
- `docs/handoff/2026-06-17-handoff.md` — **original**: Phases 0–3, **Windows/PostgreSQL env + gotchas**, **dev credentials**, key decisions, **how to work with this user**. All still holds.
- `CONTEXT.md`, `docs/BLUEPRINT.md`, `docs/adr/0001`, `docs/adr/0002`, `README.md` — canonical (unchanged).

## Current state: Phases 0–6 DONE ✅ — only deploy remains
- **Phases 0–5** — see prior handoffs.
- **Phase 6 — UX polish. DONE.** `npm run build -w client` passes (40 modules). Frontend-only — **no backend/schema/data change**. User reviewed in-browser and approved.

**Next: Phase 7 (final)** — Deploy to Hostinger VPS. See below + BLUEPRINT §1/§6.

## What Phase 6 added (key files — all `client/src/`)
Built in 3 chapters (responsive shell → attribution signature → unified states):
- `index.css` — the design system grew:
  - **person-attribution tokens**: `--mine`/`--mine-soft` (terracotta), `--partner`/`--partner-soft` (teal), `--shared`/`--shared-soft` (warm gold).
  - **global `font-variant-numeric: tabular-nums`** (ledger-like money alignment, zero per-page change).
  - **`:focus-visible`** rings + **`prefers-reduced-motion`** reset (quality floor).
  - **app-shell classes**: `.appbar` (sticky, translucent/blur), `.appbar-nav`, `.nav-link`, `.app-main`, and `.bottom-nav` — a **fixed bottom tab bar shown only at ≤600px**.
  - **skeleton**: `.skeleton` + `@keyframes pulse` (auto-disabled by the reduced-motion rule).
- `pages/AppShell.tsx` — rewritten: sticky top bar (desktop) + **mobile bottom tab bar** with inline line-icons. Active-tab now matches sub-pages (`/expenses/:id` keeps "รายการ" lit via `startsWith`).
- `attribution.tsx` **(new)** — the signature ("an expense belongs to two people"): `OwnerChip`, `PayerChip`, `Chip`, `SplitBadge` (compact two-tone bar + ratio for list rows), `SplitBar` (full-width with labels for the detail page). All viewer-relative (Mine/Partner/Shared by `userId` vs `myId`).
- `states.tsx` **(new)** — `Skeleton`, `LoadingCards`, `EmptyState` (icon + hint + action), `ErrorState` (with **ลองใหม่ retry**). Now used by every in-app page.
- Applied across `ExpensesPage`, `MonthlyPage`, `ExpenseDetailPage`, `HomePage`, `CategoriesPage`, `ExpenseFormPage` (chips + unified loading/empty/error).
- `helpers.ts` — `ownerLabel`/`payerLabel` are now **superseded by the chips** and unused by pages (left as exports; safe to delete later if desired).

## Phase 6 design decisions worth knowing
- **The warm/calm palette was kept on purpose.** It happens to match an AI-default look, but BLUEPRINT's "calm/modern" is a *locked* decision (5 phases of an existing app), not a free axis. Per the design brief, boldness was spent in **one** place: the two-person attribution (colour + split bar). Everything else stays quiet.
- **Retune colours in one spot:** change `--partner` (or `--mine`/`--shared`) in `index.css` and the whole app follows.
- **⚠️ Split-orientation caveat (pre-existing, not introduced here).** `SplitBar`/`SplitBadge` render left = "ฉัน" = `splitPercent`, right = "แฟน", matching the **form slider's** mental model. But the backend (`compute.splitFractions` + `summary.ts`) treats `splitPercent` as **member[0]'s share (ordered by `createdAt`)**, while `ExpenseFormPage` stores it as the *current user's* share. For the common case (creator = me = member[0]) they coincide; if **member[1] (the partner who joined) creates a SPLIT expense**, the viewer-relative "ฉัน/แฟน" reads backwards. A future fix should normalize split to member ordering (or snapshot the payer's share). Phase 6 only made the existing value *visible*.
- **Mobile breakpoint = 600px.** Below it: top nav hides, bottom tab bar shows, `.app-main` gets bottom padding. Tabs use `currentColor` SVGs so icon + label colour together; `env(safe-area-inset-bottom)` respected.
- **Empty-after-filter** on `ExpensesPage` keeps its own inline "ไม่พบรายการที่ตรงกับตัวกรอง" (distinct from the no-data `EmptyState`).
- No screenshot capability in this environment — visual correctness was confirmed by the user in-browser. The next design tweak should likewise lean on the user's eyes.

## Test data (unchanged)
- The **YEARLY "Car Insurance"** (Owner=Shared, Paid-by=Split) from Phase 4 is **still in the dev DB** — now also the easiest way to see the **SplitBar** on the detail page. `npm run db:seed -w server` removes it. No Phase 6 data changes.

## Phase 7 — Deploy to Hostinger VPS (final phase)
Per BLUEPRINT §1/§6. Deliverable = a **copy-paste, step-by-step guide** (user is non-expert, will run it on the VPS himself — suggest the `! <command>` pattern so output lands in chat).
- **Stack on VPS:** Nginx (serve the built `client/dist`) + PM2 (run `server`) + PostgreSQL + SSL (Let's Encrypt / certbot).
- **Build/run:** `npm run build -w client` → Nginx serves `client/dist`. Server is **ESM (`type: module`)**; a `start` script exists (`tsx src/index.ts`) — PM2 can run that, or compile to JS first (decide during the phase).
- **DB:** `prisma generate` + `prisma migrate deploy` on the VPS (prod migration, not `migrate dev`). `npm run db:seed` is **optional** — better to register the couple's real accounts via the sign-up page + `SIGNUP_CODE` rather than seed sample data.
- **`TZ=Asia/Bangkok` on the VPS** — Monthly/Dashboard/`compute.ts` use the server's local clock for "today".
- **Rotate every secret** in a fresh prod `server/.env`: new `DATABASE_URL`, `SESSION_SECRET`, `SIGNUP_CODE`. The dev values in the original handoff are DEV ONLY.
- **Cookies behind Nginx:** verify `session.ts` cookie settings for prod — `secure: true` + `SameSite` over HTTPS, and `app.set('trust proxy', 1)` so secure cookies work behind the proxy.
- Revisit the npm **"2 critical vulnerabilities"** note (flagged since Phase 0) during deploy.
- Nginx: SPA fallback (`try_files ... /index.html`) for client routes, and reverse-proxy `/api` → `localhost:4000`.

## Suggested skills for next session
- Phase 7 is ops/deploy — no feature-build skill needed. Guide the user through VPS commands step by step (he learns by running things himself).
- **`code-review`** — a final correctness pass before going live is worthwhile (e.g. the split-orientation caveat above, the cookie/proxy config).

## How to run / work with the user
- Local: `npm run dev` → http://localhost:5173 (`Ctrl+C` to stop). A dev server was running on :4000/:5173 at end of session. Full env + Postgres gotchas + **dev credentials** are in the prior handoffs (secrets in `server/.env`, git-ignored).
- **This user:** non-expert solo builder, communicates in **Thai**, deploy target = Hostinger VPS. Lead with **one clear recommendation**, **one decision at a time**, plain Thai with concrete examples, build→test→**show the working result**, reassure on anxious moments, help him learn to run things himself. For Phase 7 especially: small steps, verify each on the VPS before moving on. (Full notes in the original handoff.)
