# Paymory — Handoff (2026-06-17, after Phase 5)

Continue building **Paymory**, a private recurring-expense tracker for a couple. This doc updates the prior handoffs after **Phase 5**. It only covers what changed — read the prior handoffs and canonical docs first for everything else.

## Read these first (do not duplicate)
- `docs/handoff/2026-06-17-phase4-done-handoff.md` — **prior handoff**: Phase 4 (Dashboard + Monthly View), Phase 4 design decisions, the tsx/EADDRINUSE gotcha, and the Phase-4 test data note. Still holds *except* the "Phases done / Next" status (superseded here).
- `docs/handoff/2026-06-17-handoff.md` — **original handoff**: Phases 0–3 detail, **Windows/PostgreSQL env + gotchas**, **dev credentials**, key decisions, and **how to work with this user**. All still holds.
- `CONTEXT.md`, `docs/BLUEPRINT.md`, `docs/adr/0001`, `docs/adr/0002`, `README.md` — canonical sources (unchanged). **Read CONTEXT.md before touching domain code.**

## Current state: Phases 0–5 DONE ✅
- **Phases 0–4** — see prior handoffs.
- **Phase 5 — Expense Detail + Categories management + Search/Filter. DONE.** `npm run typecheck -w server` and `npm run build -w client` both pass; verified end-to-end by an API smoke test (below). User to confirm in-browser.

**Next: Phase 6** — UX polish (Mine/Partner/Shared, empty/loading/error states, responsive mobile, calm/modern design). See BLUEPRINT §6.

## What Phase 5 added (key files)
**Backend** (`server/src/`):
- `categories.ts` — was just `DEFAULT_CATEGORIES`; **added `categoriesRouter`**: `GET /api/categories` (list with `expenseCount` via Prisma `_count`), `POST` (create), `PATCH /:id` (rename), `DELETE /:id` (delete). All `requireAuth` + **workspace-scoped**. Create/rename pre-check the `@@unique([workspaceId, name])` → 409 "มีหมวดหมู่ชื่อนี้อยู่แล้ว". Delete is **guarded** → 409 if any expense still uses it. Names are `.trim()`-ed, 1–40 chars.
- `expenses.ts` — `GET /:id` now **includes `markedBy` (id, displayName)** on each payment, so the detail page can show who marked each month paid. *(Only data-shape change this phase. Monthly View's payment include was left as-is — it doesn't need it.)*
- `index.ts` — wired `app.use('/api/categories', categoriesRouter)`.

**Frontend** (`client/src/`):
- `pages/ExpenseDetailPage.tsx` **(new)** — route `/expenses/:id`. Header (name/status/amount/cycle) + actions (แก้ไข/พัก/ใช้ต่อ/เลิก/เปิดใหม่/ลบ — delete confirms then navigates to `/expenses`); a **"ประเมินต่อเดือน / ต่อปี"** card; full-detail rows (category, due day/ month, owner, payer, method, notes, link); and the **payment history** (period · จ่ายเมื่อ · โดย <member> · snapshot `amountPaid`). Loading / not-found / error states.
- `pages/CategoriesPage.tsx` **(new)** — route `/categories`. Add form, inline rename, delete. Each row shows usage count; the delete button is **disabled + dimmed when `expenseCount > 0`** (with a tooltip), matching the backend guard. Loading / empty / error states.
- `pages/ExpensesPage.tsx` — added **client-side search + filters** (text · status · cycle · owner · category) via `useMemo`; a "แสดง X จาก Y รายการ" count; a distinct "ไม่พบรายการที่ตรงกับตัวกรอง" state; and made the expense **name a `<Link>`** to the detail page (plus a "รายละเอียด" action).
- `types.ts` — `Payment.markedBy?: Member`; `ExpenseDetail = Expense & { payments: Payment[] }`; `CategoryWithCount`.
- `helpers.ts` — `formatThaiDateISO`, `annualized`, `perMonth`.
- `App.tsx` — routes `/expenses/:id` (detail) and `/categories`.
- `pages/AppShell.tsx` — nav link **"หมวดหมู่"** → `/categories` (nav is now 4 items + logout).

> **No DB migration** (as predicted) — `Category`/`Payment` tables already existed. No `prisma generate`/`migrate` ran, so the **DLL-lock + EADDRINUSE gotchas stayed entirely out of play**. Phase 6 is frontend-heavy → also unlikely to touch Prisma.

## Phase 5 design decisions worth knowing
- **Filtering is client-side.** The whole expense list is small for a couple, so `ExpensesPage` filters the already-loaded array — no list query params were added to the backend. The category-filter options are derived from categories **present in the loaded list** (not a separate fetch).
- **Category delete guard is belt-and-suspenders.** The `RecurringExpense.categoryId` FK has no cascade, so a delete-in-use would fail at the DB anyway; the backend pre-checks `recurringExpense.count({categoryId})` to return a friendly Thai 409 instead, and the UI disables the button too.
- **Annualised cost helpers are intentionally duplicated** on the frontend (`annualized`/`perMonth` in `helpers.ts`) rather than imported from `server/src/compute.ts` (`yearlyNormalized`/`monthlyNormalized`) — same client/server boundary reason the label maps are duplicated. Keep the two in sync if the rule changes.
- **Detail page loads expenses of any status** (get-one has no status filter), so a now-paused/cancelled expense's **payment history surfaces here** — this is the page the Phase 4 handoff pointed to for that history.
- **Route ranking:** `/expenses/new` and `/expenses/:id/edit` still resolve to the form even with `/expenses/:id` added — React Router ranks static segments above dynamic ones, so `new` and `:id/edit` win over `:id`.
- Decimal quirk still applies: `amount`/`amountPaid` arrive as **strings** — `Number(...)` before math (the new helpers already do).

## Verified this session (API smoke test)
A standalone Node `fetch` script (cookie-jar login as `me@paymory.local` → exercise the new endpoints → self-clean) passed all of:
- categories list with correct per-category counts; create; **duplicate create → 409**; rename; delete-unused → ok; **delete-in-use ("Home Appliances", 1 expense) → 409** friendly message.
- expense detail: mark paid → `payments[]` returns the row with **`markedBy.displayName` = "Me"** and snapshot `amountPaid` = 8000 → un-mark cleanup.

The test category and test payment were removed at the end — **DB left unchanged**. (Reusable pattern: Node 22 has global `fetch`; a small cookie-jar script is a fast way to verify backend changes end-to-end without the browser.)

## Test data still in the dev DB (NOT in seed.ts)
- The **YEARLY "Car Insurance"** (8,000 THB, due March, category Insurance, Owner=Shared, Paid-by=Split) from the **Phase 4** session is **still there** (this is why category Insurance shows 1 in the smoke test). `npm run db:seed -w server` removes it. No stray Phase-5 data remains.

## Phase 6 — what to build next
Per BLUEPRINT §6 (UX polish — first design-led phase):
- **Mine / Partner / Shared** presentation — make attribution legible at a glance (currently plain text labels via `ownerLabel`/`payerLabel`).
- **Consistent empty / loading / error states** across all pages (most exist; audit for gaps and unify the look).
- **Responsive mobile** — the 760px `AppShell` nav now has 4 items + logout; needs a mobile treatment (hamburger or wrap). Cards/forms should reflow on small screens. This is the user's likely day-to-day device.
- **Calm / modern visual design** — the palette + `.card/.btn/.field` system in `index.css` is the base; this is where `frontend-design` / `ui-ux-pro-max` finally apply.
- Remember Phase 7 (deploy): set **`TZ=Asia/Bangkok`** on the VPS — "today" in Monthly/Dashboard comes from the server local clock.

## Suggested skills for next session
- **`frontend-design`** or **`ui-ux-pro-max`** — now the main event for Phase 6 UX/visual polish.
- **`verify`** / **`run`** — drive the running app in-browser. (You can't screenshot here — guide the user with a short Thai checklist and let him confirm; he values seeing it run.)
- **`code-review`** — before wrapping the phase.

## How to run / work with the user
- Run both: `npm run dev` → http://localhost:5173 (stop with `Ctrl+C`). A dev server was **running on :4000/:5173** at the end of this session; the next agent may want to kill ports and restart cleanly (see the prior handoffs for the PowerShell that takes the whole `concurrently` tree down). Full env + Postgres gotchas + **dev credentials** are in the prior handoffs (secrets live in `server/.env`, git-ignored).
- **This user:** non-expert solo builder, communicates in **Thai**, target deploy = Hostinger VPS (Phase 7). Lead with **one clear recommendation**, **one decision at a time**, plain Thai with concrete examples, build→test→**show the working result**, reassure on anxious moments, help him learn to run things himself. (Full notes in the original handoff.)
