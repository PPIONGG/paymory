# Paymory — พิมพ์เขียว (MVP Blueprint)

สรุปจากการ grill ทั้งหมด ใช้เป็นแผนอ้างอิงตอนสร้างจริง
คำศัพท์โดเมน → [../CONTEXT.md](../CONTEXT.md) · เหตุผลเชิงสถาปัตยกรรม → [./adr/](./adr/)

---

## 1. Stack

| ส่วน | เครื่องมือ |
|------|-----------|
| Frontend | React + Vite + TypeScript (SPA) |
| Backend | Express + TypeScript + Prisma |
| Database | PostgreSQL |
| โครงสร้าง | monorepo — `client/` + `server/` |
| Auth | อีเมล + รหัสผ่าน (session cookie) + sign-up code |
| Deploy | Hostinger VPS: Nginx (เสิร์ฟ client) + PM2 (รัน server) + PostgreSQL + SSL (Let's Encrypt) |

> ทำไมไม่ใช้ Next.js → [ADR 0001](./adr/0001-react-spa-express-not-nextjs.md)
> ทำไมแยก template/payment → [ADR 0002](./adr/0002-recurring-tracking-templates-and-payments.md)

```
paymory/
├── client/          # React + Vite + TS
├── server/          # Express + TS + Prisma
├── CONTEXT.md       # glossary
└── docs/
    ├── BLUEPRINT.md # ไฟล์นี้
    └── adr/
```

---

## 2. โครงข้อมูล (Data Model)

```
Workspace 1───2 User            (1 User = 1 Workspace; Workspace มีได้ 1–2 คน)
    │
    1───* RecurringExpense ───1 Category
              │
              1───* Payment      (1 ก้อนต่อ 1 เดือนที่จ่าย)
```

### User — บัญชี login
`id` · `email` · `passwordHash` · `displayName` · `workspaceId` (null จนกว่าจะสร้าง/join) · `createdAt`

### Workspace — พื้นที่ร่วมของคู่
`id` · `name` · `inviteCode` · `createdAt`
*(แต่ละ User คือ "Member" ของ Workspace; ใช้กฎ 1:1 จึงเก็บ `workspaceId` ไว้ที่ User ตรง ๆ · ทั้งคู่เท่ากัน ไม่มี role)*

### RecurringExpense — ตัวตั้งต้น (template)
| field | หมายเหตุ |
|-------|---------|
| `id`, `workspaceId` | |
| `name` | เช่น YouTube Premium |
| `amount` | ราคาปัจจุบัน |
| `currency` | คงที่ `THB` ใน MVP |
| `categoryId` | 1 ใน 10 หมวดตั้งต้น |
| `billingCycle` | `MONTHLY` \| `YEARLY` |
| `dueDay` | วันในเดือน (1–31) |
| `dueMonth` | 1–12 — ใช้เฉพาะ `YEARLY` |
| `ownerType` | `PERSONAL` \| `SHARED` |
| `ownerUserId` | ตั้งเมื่อ `PERSONAL` (→ แสดง Mine/Partner ตามผู้ดู) |
| `payerType` | `PERSONAL` \| `SPLIT` |
| `payerUserId` | ตั้งเมื่อ `PERSONAL` |
| `splitPercent` | เมื่อ `SPLIT` — สัดส่วนของแต่ละ Member (default 50/50) |
| `paymentMethod` | `CREDIT_CARD` \| `BANK_TRANSFER` \| `CASH` \| `AUTO_DEBIT` \| `OTHER` |
| `status` | `ACTIVE` \| `PAUSED` \| `CANCELLED` (ไม่มี archived แยก) |
| `notes` | optional |
| `link` | optional URL |
| `createdAt`, `updatedAt` | |

### Payment — การจ่ายของเดือนนั้น (occurrence)
| field | หมายเหตุ |
|-------|---------|
| `id`, `expenseId`, `workspaceId` | |
| `periodYear`, `periodMonth` | เดือนที่จ่าย (เช่น 2026-06) |
| `amountPaid` | **snapshot** ยอด ณ ตอนจ่าย (ไม่ผูกราคาปัจจุบัน) |
| `paidAt` | วันที่จ่ายจริง |
| `markedByUserId` | ใครกดจ่าย |

> **ไม่ materialize ล่วงหน้า:** รายการของแต่ละเดือนคำนวณสดจาก RecurringExpense ที่ active; เขียน Payment เฉพาะตอนกด "จ่ายแล้ว" (ดู ADR 0002)
> *(การ snapshot สัดส่วน split ตอนจ่าย = refinement ไว้ทีหลัง; MVP คิดจาก `splitPercent` ปัจจุบัน)*

### Category — หมวดหมู่ (seed 10 ตัว)
Streaming · Subscription · Housing · Vehicle · Utilities · Internet & Phone · Home Appliances · Insurance · Debt / Installment · Other
*(เก็บเป็นตารางเพื่อเพิ่มหมวดเองทีหลังได้)*

---

## 3. กฎสำคัญ (สรุปการตัดสินใจจากการ grill)

1. **1 User = 1 Workspace** · Workspace มีได้สูงสุด 2 คน · ใช้คนเดียวก่อนได้แล้วชวนคู่ผ่าน **invite code**
2. **Owner กับ Paid by แยกอิสระ 2 ฟิลด์** — จ่ายแทนกันได้ (เช่นของแฟน แต่เราจ่าย)
3. **Mine/Partner เป็นมุมมองสัมพัทธ์** — เก็บเป็น userId จริง แสดงสลับตามผู้ login
4. **Split** หารตามสัดส่วน default 50/50 ปรับได้ (เก็บเป็น %)
5. **2 ชั้น: RecurringExpense (template) + Payment (รายเดือน)** — คำนวณสด + snapshot ยอด
6. **Billing cycle:** MVP เอา **Monthly + Yearly** (weekly/custom เลื่อนไว้)
7. **หน้ารายเดือน** = บิลที่ถึงรอบเดือนนั้นจริง (yearly เด้งเฉพาะเดือนของมัน) · **Dashboard** = "เฉลี่ยต่อเดือน" (yearly ÷12) คู่ "ประเมินทั้งปี"
8. **Status:** Active / Paused / Cancelled + ปุ่ม Delete ถาวร (archived ยุบรวมใน Cancelled)
9. **ทุกรายการใน Workspace เห็นทั้งคู่** — Owner เป็นแค่ป้าย ไม่ใช่ความลับ
10. **สกุลเงิน THB อย่างเดียว** (ไม่แปลงค่าเงินใน MVP)
11. **สมัครเอง (อีเมล+รหัสผ่าน) + sign-up code กันคนนอก** · ความเป็นส่วนตัวของข้อมูลมาจาก invite code · ทั้งคู่เท่ากัน ไม่มี role/admin

---

## 4. ระบบ Auth (รายละเอียด)

**แนวทาง:** สมัครเอง (อีเมล+รหัสผ่าน) · ทั้งคู่เท่ากัน ไม่มี role/admin · ความปลอดภัยมาตรฐานครบ

**ของที่ใช้:** `express-session` + `connect-pg-simple` (session เก็บใน PostgreSQL) + `bcrypt` + `express-rate-limit` + `zod`

**Flow:**
```
สมัคร  → อีเมล + รหัสผ่าน + sign-up code
         → ตรวจ sign-up code · เช็คอีเมลซ้ำ · hash รหัส (bcrypt) → สร้าง User
         → สร้าง Workspace (ได้ invite code)  หรือ  join ด้วย invite code
login  → ตรวจรหัส → ออก session cookie (httpOnly, Secure, SameSite)
ทุก request → middleware เช็ค session → scope ทุก query ด้วย workspaceId
```

**ความปลอดภัยที่ทำให้ครบ (เฟส 2):**
- ✅ bcrypt hash รหัสผ่าน (ไม่เก็บตัวจริง)
- ✅ httpOnly + Secure + SameSite cookie session (เก็บใน Postgres)
- ✅ HTTPS (จากเฟส deploy)
- ✅ rate limit endpoint login/สมัคร (กัน brute-force)
- ✅ validate input ทุก endpoint (zod)
- ✅ workspace scoping ทุก query (คู่อื่นเห็นข้อมูลข้ามกันไม่ได้)
- ✅ secret ทั้งหมด (session secret, sign-up code, DB url) อยู่ใน `.env`

**ขอบเขต MVP:**
| ฟีเจอร์ | สถานะ |
|--------|------|
| สมัคร / login / logout | ✅ MVP |
| เปลี่ยนรหัสผ่าน (ตอน login อยู่) | ✅ MVP |
| ลืมรหัสผ่าน | 🔧 รีเซ็ตด้วยสคริปต์บน VPS (manual) — email reset เลื่อนไว้ |
| ยืนยันอีเมล (verify) | ⬜ เลื่อน |
| 2FA / Google login / role-admin | ⬜ เลื่อน |

**env ที่ต้องตั้ง:** `DATABASE_URL` · `SESSION_SECRET` · `SIGNUP_CODE`

---

## 5. หน้าจอ (Pages)

- **Login / Sign up** (มีช่อง sign-up code)
- **Dashboard** — เฉลี่ยต่อเดือน · ประเมินทั้งปี · จำนวนรายการ active · ครบกำหนดถัดไป · ใครจ่ายเท่าไหร่ · shared vs personal · upcoming
- **Monthly Expenses** — รายการที่ถึงรอบเดือนที่เลือก · จัดกลุ่มตามวันครบกำหนด · ไฮไลต์ upcoming/overdue · กด "จ่ายแล้ว" · สลับเดือน · ยอดรวมเดือนนั้น
- **All Recurring Expenses** — รายการทั้งหมด + filter (category/owner/status/cycle) + search
- **Add / Edit Expense** — ฟอร์มครบทุก field
- **Expense Detail** — ข้อมูลเต็ม · ประวัติการจ่าย · ประเมินรายปีของรายการนั้น
- **Categories** — ดู/จัดการหมวด
- **Settings / Workspace** — โปรไฟล์ · เปลี่ยนรหัสผ่าน · invite code · จัดการคู่

ทุกหน้ามี **empty / loading / error states**

---

## 6. ลำดับการสร้าง (Build Phases)

| เฟส | งาน | ทดสอบที่ |
|----|-----|---------|
| **0** | ตั้งโครง monorepo (client Vite+React+TS, server Express+TS+Prisma, เชื่อม PostgreSQL) | localhost |
| **1** | Prisma schema + migrate + seed (10 หมวด + 5 รายการตัวอย่าง + 2 member) | localhost |
| **2** | Auth: สมัคร (+sign-up code) / login / logout / session + เปลี่ยนรหัสผ่าน + Workspace สร้าง/join (invite code) + สคริปต์รีเซ็ตรหัส | localhost |
| **3** | RecurringExpense CRUD ครบทุก field + status (active/paused/cancelled) + delete | localhost |
| **4** | Monthly View (คำนวณ due, กดจ่าย→Payment, สลับเดือน) + Dashboard (เฉลี่ย/ทั้งปี/upcoming/overdue/ใครจ่าย) | localhost |
| **5** | Expense Detail (ประวัติจ่าย) + Categories + Search/Filter | localhost |
| **6** | ขัดเกลา UX: Mine/Partner/Shared, empty/loading/error, responsive มือถือ, ดีไซน์ calm/modern | localhost |
| **7** | Deploy ขึ้น Hostinger VPS (Nginx + PM2 + PostgreSQL + SSL) — คู่มือ copy-paste | VPS |

---

## 7. Seed Data (ให้แอปใช้งานได้ทันที)

Workspace ตัวอย่าง + 2 Member (เช่น "Me" / "Partner") + รายการ:

| รายการ | ยอด/เดือน | Cycle | Category | Owner |
|--------|----------|-------|----------|-------|
| YouTube Premium | 239 | Monthly | Streaming | Shared |
| Hostinger | 299 | Monthly | Subscription | Mine |
| Condo Rent | 12,000 | Monthly | Housing | Shared |
| Motorcycle Payment | 3,500 | Monthly | Vehicle | Mine |
| Coway Water Filter | 750 | Monthly | Home Appliances | Shared |
