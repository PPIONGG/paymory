# VPS Deploy Guide

คู่มือนี้คือสรุปสิ่งที่ต้องทำเวลาจะแก้ Paymory แล้วส่งขึ้น VPS โดยไม่ต้องจำจากแชต

## ภาพรวม

ตอนนี้มี 2 ที่ที่ต้องแยกให้ออก:

```text
Local = เครื่องของเรา
VPS   = เครื่อง server ที่ Hostinger
```

เวลาพัฒนา ให้ทำบน local ก่อน:

```text
http://localhost:5173/login
```

เวลาคนใช้งานจริง ให้เข้าเว็บบน VPS:

```text
http://187.127.110.15/paymory/login
```

หน้า root ของ VPS เป็นหน้า launcher:

```text
http://187.127.110.15/
```

## SSH คืออะไร

SSH คือทางเข้า VPS แบบ command line

เดิมต้องเข้าแบบนี้:

```powershell
ssh root@187.127.110.15
```

ตอนนี้ตั้ง alias ไว้แล้ว ใช้แบบสั้นได้:

```powershell
ssh paymory-vps
```

คำสั่ง deploy ใช้ SSH ข้างในเอง ดังนั้นปกติไม่ต้อง SSH เข้า VPS เอง

## แก้ frontend เช่น ธีม สี layout หน้าเว็บ

ใช้ flow นี้:

```powershell
cd C:\Users\tamma\Desktop\Paymory
npm run dev
```

เปิดดู local:

```text
http://localhost:5173/login
```

แก้ไฟล์ใน local เช่น:

```text
client/src/index.css
client/src/App.css
client/src/pages/LoginPage.tsx
client/src/pages/AppShell.tsx
client/src/pages/*.tsx
```

เมื่อพอใจแล้ว หยุด dev server ด้วย `Ctrl + C`

ทดสอบ build:

```powershell
npm run build
```

เก็บงานเข้า Git:

```powershell
git add -A
git commit -m "Update Paymory theme"
git push
```

ส่งขึ้น VPS:

```powershell
npm run deploy:vps
```

เปิดเว็บจริง:

```text
http://187.127.110.15/paymory/login
```

## npm run deploy:vps ทำอะไร

คำสั่งนี้รันจาก local ไม่ใช่รันใน VPS

มันทำให้เอง:

```text
1. build frontend production
2. ตรวจว่า asset ใช้ path /paymory/assets
3. ลบ build เก่าบน VPS
4. copy client/dist ไป VPS
5. copy deploy/launcher/index.html ไป VPS
6. reload nginx
7. เช็ก URL จริง
```

ถ้าสำเร็จ จะเห็นประมาณนี้:

```text
launcher 200 text/html
paymory-login 200 text/html
{"status":"ok","db":"connected", ...}
Deploy complete.
```

## แก้ backend หรือ database

ถ้าแก้เฉพาะ frontend ใช้ `npm run deploy:vps` ได้เลย

แต่ถ้าแก้ไฟล์พวกนี้:

```text
server/src/*.ts
server/prisma/schema.prisma
server/package.json
```

แปลว่าเป็น backend/database change ต้องระวังกว่าเดิม เพราะอาจต้อง:

```text
npm install
npx prisma generate
npx prisma migrate deploy
pm2 restart paymory
```

ตอนนี้ deploy script ยังเน้น frontend/launcher เป็นหลัก ถ้าจะ deploy backend ให้ตรวจแผนก่อนหรือให้ Codex ช่วยจัดการ

## URL ที่ควรจำ

```text
Launcher:
http://187.127.110.15/

Paymory:
http://187.127.110.15/paymory/login

API health:
http://187.127.110.15/paymory/api/health

Local dev:
http://localhost:5173/login
```

## ถ้า deploy แล้วเว็บไม่เปลี่ยน

ลองตามลำดับนี้:

1. ดูว่า `npm run deploy:vps` จบด้วย `Deploy complete.`
2. กด hard refresh ใน browser
3. เปิด URL จริงที่ `/paymory/login`
4. เช็กว่า build ผ่าน:

```powershell
npm run build
```

ถ้ายังไม่เปลี่ยน ให้ดู output ของ:

```powershell
npm run deploy:vps
```

แล้วค่อยไล่จาก error ตรงนั้น

## สิ่งที่ยังไม่ได้ทำ

ยังไม่ได้ปิด password login ของ root และยังไม่ได้เปลี่ยน root password ให้อัตโนมัติ เพราะถ้าทำพลาดอาจล็อกเราออกจาก VPS

ตอนนี้ SSH key พร้อมแล้ว ขั้นถัดไปด้านความปลอดภัยคือ:

```text
1. เปลี่ยน root password
2. ทดสอบ ssh paymory-vps ยังเข้าได้
3. ค่อยพิจารณาปิด password login
```
