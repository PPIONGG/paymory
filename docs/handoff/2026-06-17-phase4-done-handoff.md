# Paymory — Handoff (2026-06-17, after Phase 4)

Continue building **Paymory**, a private recurring-expense tracker for a couple. This doc updates the prior handoff after **Phase 4**. It only covers what changed — read the prior handoff and canonical docs first for everything else.

## Read these first (do not duplicate)
- `docs/handoff/2026-06-17-handoff.md` — **prior handoff**: Phases 0–3 detail, Windows/PostgreSQL env + gotchas, dev credentials, key decisions, and **how to work with this user**. Everything there still holds *except* the "Phases done / Next" status (now superseded by this doc).
- `CONTEXT.md`, `docs/BLUEPRINT.md`, `docs/adr/0001`, `docs/adr/0002`, `README.md` — canonical sources (unchanged). **Read CONTEXT.md before touching domain code.**

## Current state: Phases 0–4 DONE ✅
- **Phases 0–3** — see prior handoff.
- **Phase 4 — Dashboard + Monthly View. DONE, verified in-browser by the user.** `npm run typecheck -w server` and `npm run build -w client` both pass.

**Next: Phase 5** — Expense Detail (payment history) + Categories management + Search/Filter. See BLUEPRINT §5–6.

## What Phase 4 added (key files)
**Backend** (`server/src/`):
- `compute.ts` **(new)** — pure, Prisma-free due/money helpers: `effectiveDueDay` (clamps e.g. 31→30/28), `isDueInMonth`, `dueState` (PAID/OVERDUE/UPCOMING vs today), `monthlyNormalized`/`yearlyNormalized`, `nextDueDate`, `splitFractions`. "Today" = server local clock → **set `TZ=Asia/Bangkok` on the VPS** (Phase 7).
- `summary.ts` **(new)** — `monthlyRouter` (`GET /api/monthly?year=&month=`) and `dashboardRouter` (`GET /api/dashboard`). Both compute live over **ACTIVE** expenses only; nothing materialised (ADR 0002).
- `expenses.ts` — added **Payment** endpoints: `POST /api/expenses/:id/payments/:year/:month` (mark paid — snapshots current `amount`, idempotent via the `@@unique([expenseId,periodYear,periodMonth])`) and `DELETE` same path (un-mark). Both workspace-scoped.
- `index.ts` — wired the two new routers.

**Frontend** (`client/src/`):
- `pages/MonthlyPage.tsx` **(new)** — month switcher (Thai months), due list with date chips, Paid/Overdue/Upcoming badges, **จ่ายแล้ว / ยกเลิกจ่าย** buttons, month total + paid count. Route `/monthly`.
- `pages/HomePage.tsx` — placeholder replaced with the real **Dashboard** (stat cards, this-month overdue/upcoming, who-pays, shared vs personal, next due); kept the invite-code card.
- `types.ts` — `Payment`, `DueState`, `MonthlyItem`, `MonthlyView`, `DueLite`, `Dashboard`.
- `helpers.ts` — `THAI_MONTHS`, `formatThaiDate`, `DUE_STATE_LABELS`.
- `App.tsx` (route), `AppShell.tsx` (nav link "รายเดือน").

> **No DB migration was needed** — the `Payment` table already existed from the Phase 1 migration. This kept the Prisma DLL-lock gotcha out of play entirely. Phase 5 also needs no schema change.

## Phase 4 design decisions worth knowing
- **Month total** = actual cost that month: snapshot `amountPaid` for paid items, current `amount` otherwise.
- **Who-pays (perMember)** = each member's normalised monthly share. SPLIT uses `splitPercent` on **members ordered by `createdAt`** — index 0 = "first member" the percent refers to.
- **Monthly View is ACTIVE-only** — a paid record for a now-paused/cancelled expense won't surface there (its history still lives on the Expense Detail page in Phase 5).
- Mark-paid is **idempotent** (re-mark keeps the original snapshot, no error).

## Gotcha confirmed this session (Windows + tsx)
- **`tsx watch` EADDRINUSE race:** two quick saves to a *server* file restart tsx so fast the old process hasn't freed port 4000 → `EADDRINUSE`, the server child dies (watcher stays alive, so it looks half-up). Reinforces the prior handoff's DLL/port warnings.
- **Fix:** kill the whole `concurrently` process **tree**, not just the port-4000 PID, then verify ports free, then restart. PowerShell that worked:
  ```powershell
  # kill the concurrently tree (takes vite + tsx + server with it)
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -like '*concurrently*' } |
    ForEach-Object { taskkill /F /T /PID $_.ProcessId }
  # backstop: anything still on 4000/5173
  Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 4000,5173 } |
    ForEach-Object { taskkill /F /T /PID $_.OwningProcess }
  ```
- Avoid editing the same server file twice in quick succession; let each restart settle.

## Test data added (NOT in seed.ts)
- One **YEARLY** expense **"Car Insurance"** (8,000 THB, due March, Owner=Shared, Paid-by=Split) was added via the API to the seed workspace ("บ้านเรา") to prove the yearly-due-month logic. **It persists in the dev DB; `npm run db:seed -w server` removes it.** No stray Payments remain (the mark/un-mark test cleaned up after itself).

## Phase 5 — what to build next
Per BLUEPRINT §5–6:
- **Expense Detail page** — full fields + **payment history** (the `GET /api/expenses/:id` already returns `payments` ordered desc) + that item's annualised cost.
- **Categories** — view/add/manage. `DEFAULT_CATEGORIES` seeded per workspace; `Category` has `@@unique([workspaceId, name])`.
- **Search / Filter** on the All-Expenses list (category / owner / status / cycle + text search).
- Invariants to keep: every query **scoped to `req.user.workspaceId`**; Decimal `amount` arrives as a **string** — `Number(...)` before math.

## Suggested skills for next session
- **`feature-dev`** — guided, codebase-aware Phase 5 build.
- **`verify`** / **`run`** — drive the running app in-browser. (You can't screenshot here — guide the user with a short Thai checklist and let him confirm; he values seeing it run.)
- **`code-review`** — before wrapping the phase.
- **`frontend-design`** or **`ui-ux-pro-max`** — Phase 6 (UX polish), not yet.

## How to run / work with the user
- Run both: `npm run dev` → http://localhost:5173 (stop with `Ctrl+C`). Full env + Postgres gotchas + **dev credentials** are in the prior handoff (secrets live in `server/.env`, git-ignored — not repeated here).
- **This user:** non-expert solo builder, communicates in **Thai**, target deploy = Hostinger VPS (Phase 7). Lead with **one clear recommendation**, **one decision at a time**, plain Thai with concrete examples, build→test→**show the working result**, reassure on anxious moments, help him learn to run things himself. (Full notes in the prior handoff.)
