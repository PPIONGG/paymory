# Paymory

Paymory is a private recurring-expense tracker for a couple — one shared place for two people to remember, track, and divide the subscriptions, bills, and recurring payments they have each month.

## Language

### Workspace & people

**User**:
A single login account: one person, one email and password.
_Avoid_: account (ambiguous — see Workspace), member (that's the role inside a Workspace)

**Workspace**:
The shared container that owns all of a couple's expense data. Has 1–2 Members; both Members see the same expense list. A User belongs to exactly one Workspace (MVP).
_Avoid_: account, group, team

**Member**:
A User's participation in a Workspace. A Workspace has at most two Members — the couple. The labels "Mine", "Partner", and "Shared" are read relative to whichever Member is currently looking.
_Avoid_: user (that's the global login), owner (that's a field on an Expense)

> Naming note: the user-facing label for **Workspace** may become "Household" for warmth — to be decided during UI design. The code/domain term stays **Workspace**.

### Expense attribution

Every Expense carries two independent "who" dimensions — **Owner** (whose it is) and **Paid by** (who pays). They move independently: a Member can pay for the other's Expense. Both are attribution only — every Expense is visible to both Members; nothing in a Workspace is private.

**Owner**:
Who an Expense belongs to / is responsible for it — one of **Mine**, **Partner**, or **Shared**. Says nothing about who actually pays.
_Avoid_: holder, billed-to

**Paid by**:
Who actually puts up the money for an Expense — one of **Mine**, **Partner**, or **Split**. Independent of Owner.
_Avoid_: payer, charged-to

**Mine / Partner**:
Viewer-relative labels for one specific Member. The same stored Member reads as "Mine" to themselves and "Partner" to the other Member.
_Avoid_: me/you, person A/B

**Shared**:
An **Owner** value — the Expense belongs to both Members together (e.g. rent). About ownership, not payment. Contrast **Split**.
_Avoid_: joint, common

**Split**:
A **Paid by** value — both Members contribute to the cost, divided by an adjustable share that defaults to 50/50 (e.g. 70/30 when incomes differ). About payment, not ownership. Contrast **Shared**.
_Avoid_: shared (that's ownership)

### Recurring tracking

The app works at two levels: the standing **Recurring Expense** (set up once) and a per-period **Payment** (one each time a month is settled).

**Recurring Expense** (a.k.a. **Expense**):
The standing definition of something paid on a repeating cycle (e.g. YouTube Premium, rent) — set up once, carrying its name, amount, cycle, due day, Owner, Paid by, and Category. It is not itself a payment; each month's payment is a separate **Payment**.
_Avoid_: subscription (that's one flavour/Category, not the general term), transaction, bill

**Payment**:
A record that a Recurring Expense was settled for one specific period (e.g. YouTube for June 2026). Created when a Member marks that month paid; it records the amount actually paid at that time (not a live link to the Expense's current amount), the date, and which Member paid — so past months stay correct even after the Expense's amount changes.
_Avoid_: transaction, charge, bill

**Billing cycle**:
How often a Recurring Expense recurs. MVP supports **Monthly** and **Yearly**; weekly and custom (every N months) are deferred. Drives which month(s) an Expense is due and how its cost is annualised.
_Avoid_: frequency, period (a "period" is the specific month a Payment settles)

### Views, money & timing

**Due**:
A Recurring Expense is "due" in a given month when its billing cycle lands in that month — every month for Monthly, only the due month for Yearly. Only due Expenses appear in that month's view.
_Avoid_: scheduled, pending

**Paid / Upcoming / Overdue**:
The state of a due Expense within its month. **Paid** = it has a Payment for that period. **Upcoming** = not yet paid, due date still ahead. **Overdue** = not yet paid, due date already passed.

**Monthly average**:
The normalised per-month cost of all active Recurring Expenses: monthly amounts plus each yearly amount ÷ 12. A stable "typical month" figure shown on the Dashboard.
_Avoid_: monthly total (ambiguous — see Month total)

**Month total**:
The actual amount due in one specific selected month (the Monthly View header): the monthly items plus any yearly item whose due month is that month. Swings month to month.
_Avoid_: monthly total

**Yearly estimate**:
The annualised cost of all active Recurring Expenses: monthly × 12 + yearly × 1.

### Status & lifecycle

**Status**:
Where a Recurring Expense is in its life — one of **Active**, **Paused**, or **Cancelled**. (A separate "archived" flag was considered and deliberately folded into Cancelled for MVP simplicity.)

**Active**:
In use — appears in the current lists and counts toward all totals.

**Paused**:
Temporarily stopped (e.g. a subscription on hold). Still visible, labelled "paused", but excluded from totals while paused. Can return to Active.
_Avoid_: snoozed, on-hold

**Cancelled**:
Ended for good. Drops out of the active list into a "cancelled" view but keeps its history (past Payments remain); can be reactivated. This also fills the "archive" role — there is no separate archived flag in MVP.
_Avoid_: archived, deleted, removed

**Delete**:
Permanent removal of a Recurring Expense and its history — a guarded, rarely-used action (behind a confirm) for genuine mistakes only. The everyday "get it out of my list" is **Cancel**, not Delete.
_Avoid_: archive, cancel

### Access

**Invite code**:
A per-Workspace code the creating Member shares so a partner's new account joins the same Workspace instead of a fresh empty one. This is what keeps a couple's data private — without it you cannot reach a Workspace's expenses.
_Avoid_: join code (fine as a UI label), password

**Sign-up code**:
A single shared secret required on the registration page so only the couple can create accounts at all — it keeps strangers off the deployment. Distinct from the **Invite code**: the sign-up code lets you register; the invite code lets you join a specific Workspace.
_Avoid_: invite code (that's for joining a Workspace)

## Example dialogue

> **Dev:** If I add an expense, does my partner see it?
> **Expert:** Yes — expenses belong to the **Workspace**, not to a **User**. Both **Members** see the same list.
> **Dev:** What if I start using it before my partner joins?
> **Expert:** Then the Workspace has just one Member until they join with the invite code. It still works solo.
> **Dev:** Our rent is "ours" but we each pay half — how do I tag that?
> **Expert:** **Owner = Shared** (it's both of yours) and **Paid by = Split** (you each put up part of the money). Those are two different fields.
> **Dev:** If YouTube's price goes up, do my old months change?
> **Expert:** No — each month you marked paid is a **Payment** that kept the amount you actually paid. Only the **Recurring Expense** going forward uses the new price.
> **Dev:** Where does the yearly car insurance show up?
> **Expert:** Only in its due month's view — it's **Due** that month. On the Dashboard it's spread into the **Monthly average** (÷12) and counted whole in the **Yearly estimate**.
> **Dev:** I stopped Netflix — cancel or delete?
> **Expert:** **Cancel** — it leaves the active list but keeps the months you already paid. **Delete** is only for an expense you created by mistake.

_(This dialogue will grow as more terms are resolved.)_
