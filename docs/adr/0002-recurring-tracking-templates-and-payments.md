# Recurring tracking: templates + per-period payments, computed not materialized

Recurring tracking is modeled at two levels: a standing **Recurring Expense** (the template — name, amount, billing cycle, due day, Owner, Paid by, Category) and a **Payment** record per settled period (e.g. YouTube for June 2026).

Two deliberate choices a future reader might otherwise try to "fix":

1. **Monthly occurrences are not materialized.** We do not pre-generate a row per Expense per month, and there is no cron. Each month's list is computed on read from the currently active Recurring Expenses; a Payment row is written only when a Member marks that month paid.

2. **A Payment snapshots the amount actually paid** — it does not reference the Expense's current amount. When an Expense's price later changes, past Payments keep their historical amounts, so payment history stays accurate. Do not "normalize" this away by replacing the stored amount with a live join to the Expense.
