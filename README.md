# City Map - نقشه شهر

یک سیستم نقشه‌برداری شهر با قابلیت نمایش فروشگاه‌ها و آگهی‌ها

## ویژگی‌ها

- نمایش نقشه تعاملی با Leaflet
- مدیریت فروشگاه‌ها و آگهی‌ها
- سیستم پیام‌رسانی
- پروفایل کاربری
- سیستم امتیازدهی و لیدربورد

## استقرار آنلاین

### روش 1: استقرار روی Vercel (پیشنهادی)

1. **نصب Vercel CLI** (اگر نصب نیست):
```bash
npm i -g vercel
```

2. **ورود به Vercel**:
```bash
vercel login
```

3. **استقرار پروژه**:
```bash
vercel
```

4. **استقرار production**:
```bash
vercel --prod
```

### روش 2: استقرار از طریق GitHub

1. پروژه را روی GitHub push کنید
2. به [vercel.com](https://vercel.com) بروید
3. روی "New Project" کلیک کنید
4. repository خود را انتخاب کنید
5. تنظیمات را تایید کنید و Deploy کنید

### نکات مهم برای استقرار

#### ✅ استفاده از SQLite در Production

SQLite یک دیتابیس عالی است و می‌توانید از آن در production استفاده کنید! فقط باید از پلتفرم‌های مناسب استفاده کنید.

**پلتفرم‌های مناسب برای SQLite:**
- ✅ **Railway** (پیشنهادی) - ساده‌ترین و بهترین گزینه
- ✅ **Render** - رایگان و مناسب
- ✅ **DigitalOcean App Platform** - برای production

**پلتفرم‌های نامناسب:**
- ❌ **Vercel** - فایل سیستم موقت دارد (SQLite کار نمی‌کند)

برای راهنمای کامل استقرار با SQLite، فایل `SQLITE_DEPLOYMENT.md` را ببینید.

#### راه‌حل‌های پیشنهادی (اگر می‌خواهید از Vercel استفاده کنید):

**گزینه 1: استفاده از Vercel KV یا Upstash Redis**
- برای داده‌های ساده و سریع

**گزینه 2: استفاده از PostgreSQL (Supabase یا Neon)**
- برای داده‌های پیچیده‌تر
- رایگان برای شروع

**گزینه 3: استفاده از Vercel Blob Storage**
- برای فایل‌های آپلود شده

### تنظیمات محیطی

برای production، متغیرهای محیطی زیر را در Vercel تنظیم کنید:

```
NODE_ENV=production
```

### اجرای محلی

```bash
# نصب dependencies
npm install

# اجرای development server
npm run dev

# ساخت production build
npm run build

# اجرای production server
npm start
```

پروژه روی `http://localhost:3006` اجرا می‌شود.

## ساختار پروژه

```
city-map/
├── app/              # Next.js App Router
│   ├── api/         # API Routes
│   └── page.tsx     # صفحه اصلی
├── components/      # کامپوننت‌های React
├── lib/            # توابع کمکی
│   └── database.ts # مدیریت دیتابیس
├── database/       # فایل‌های SQLite
└── public/         # فایل‌های استاتیک
```

## تکنولوژی‌ها

- **Next.js 14** - Framework React
- **TypeScript** - Type safety
- **SQLite** - دیتابیس (برای production باید تغییر کند)
- **Leaflet** - نقشه‌های تعاملی
- **React Leaflet** - React wrapper برای Leaflet

## مجوز

این پروژه خصوصی است.

