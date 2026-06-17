# Paymory

แอปติดตามค่าใช้จ่ายประจำสำหรับคู่รัก — React (Vite) + Express + PostgreSQL

## โครงสร้างโปรเจกต์
- `client/` — หน้าบ้าน (React + Vite + TypeScript)
- `server/` — หลังบ้าน (Express + Prisma) ต่อกับฐานข้อมูล
- `docs/` — พิมพ์เขียว (BLUEPRINT.md) + บันทึกการตัดสินใจ (adr/)
- `CONTEXT.md` — คำศัพท์ของโปรเจกต์

## สิ่งที่ต้องมี (เครื่องนี้มีครบแล้ว)
- Node.js (v24)
- PostgreSQL 18 — รันอัตโนมัติเป็น Windows service ไม่ต้องเปิดเอง

## ▶️ วิธีรัน
เปิด Terminal ในโฟลเดอร์นี้ แล้วพิมพ์:

```
npm run dev
```

รันทั้งหน้าบ้าน + หลังบ้านพร้อมกัน จากนั้นเปิดเบราว์เซอร์ไปที่:
- เว็บ: http://localhost:5173
- API health: http://localhost:4000/api/health

**ปิด:** กด `Ctrl + C` ใน Terminal

## คำสั่งที่ใช้บ่อย
| คำสั่ง | ทำอะไร |
|--------|--------|
| `npm run dev` | รันทั้งแอป (client + server) |
| `npm run prisma:studio -w server` | เปิดหน้าจัดการฐานข้อมูลแบบ GUI (http://localhost:5555) |
| `npm run db:seed -w server` | รีเซ็ต/ใส่ข้อมูลตัวอย่างใหม่ |

## หมายเหตุ
- ค่าตั้งค่า/รหัสผ่าน DB (เฉพาะ dev) อยู่ในไฟล์ `server/.env` (ไม่ถูก commit ขึ้น git)
- ข้อมูล login ตัวอย่าง: `me@paymory.local` / รหัสผ่าน `paymory` (ใช้ได้หลังทำ Phase 2 Auth)

## ความคืบหน้า
- [x] Phase 0 — โครงโปรเจกต์ + เชื่อม DB
- [x] Phase 1 — ตารางฐานข้อมูล + ข้อมูลตัวอย่าง
- [x] Phase 2 — ระบบ Auth (สมัคร/login)
- [x] Phase 3 — จัดการรายการค่าใช้จ่าย
- [x] Phase 4 — Dashboard + รายเดือน
- [x] Phase 5 — รายละเอียด + ค้นหา/กรอง
- [x] Phase 6 — ขัดเกลา UX
- [ ] Phase 7 — deploy ขึ้น VPS

## VPS URLs

Temporary no-domain layout:

- Launcher: `http://187.127.110.15/`
- Paymory: `http://187.127.110.15/paymory/`
- Paymory login: `http://187.127.110.15/paymory/login`
- Paymory API health: `http://187.127.110.15/paymory/api/health`

Local development still uses:

- Web: `http://localhost:5173`
- API: `http://localhost:4000/api/health`

Deploy the current frontend build and launcher to the VPS:

```powershell
npm run deploy:vps
```

This command uses the local SSH alias `paymory-vps`, builds the client, uploads `client/dist` and `deploy/launcher/index.html`, reloads nginx, and checks the public URLs.

Full step-by-step notes are in [`docs/VPS_DEPLOY_GUIDE.md`](docs/VPS_DEPLOY_GUIDE.md).
