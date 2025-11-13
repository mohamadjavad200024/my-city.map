# 🚀 راه‌اندازی استقرار خودکار

## وضعیت فعلی

✅ پروژه روی GitHub است: `mohamadjavad200024/my-city.map`
✅ GitHub Actions workflow ایجاد شد
⚠️ نیاز به تنظیم Railway Token

---

## روش 1: استقرار خودکار با GitHub Actions (پیشنهادی)

### مرحله 1: دریافت Railway Token

1. به [railway.app](https://railway.app) بروید و login کنید
2. به **Account Settings** > **Tokens** بروید
3. روی **"New Token"** کلیک کنید
4. نام: `github-actions`
5. Token را کپی کنید

### مرحله 2: اضافه کردن Token به GitHub

1. به repository در GitHub بروید: `mohamadjavad200024/my-city.map`
2. به **Settings** > **Secrets and variables** > **Actions** بروید
3. روی **"New repository secret"** کلیک کنید
4. Name: `RAILWAY_TOKEN`
5. Value: Token که کپی کردید
6. **"Add secret"** را بزنید

### مرحله 3: ایجاد پروژه در Railway

1. در Railway، **"New Project"** > **"Deploy from GitHub repo"**
2. Repository `my-city.map` را انتخاب کنید
3. Service ID را از URL کپی کنید (بعد از `/service/`)

### مرحله 4: اضافه کردن Service ID

1. در GitHub، دوباره **"New repository secret"** بزنید
2. Name: `RAILWAY_SERVICE_ID`
3. Value: Service ID که کپی کردید
4. **"Add secret"** را بزنید

### نتیجه

حالا هر بار که به `main` branch push کنید، به صورت خودکار deploy می‌شود! 🎉

---

## روش 2: استقرار دستی از وبسایت (ساده‌تر - بدون تنظیمات)

اگر نمی‌خواهید GitHub Actions را تنظیم کنید:

1. به [railway.app](https://railway.app) بروید
2. **"New Project"** > **"Deploy from GitHub repo"**
3. Repository `my-city.map` را انتخاب کنید
4. Railway خودکار deploy می‌کند!

**مزیت**: بعد از اولین deploy، هر push جدید به صورت خودکار deploy می‌شود (بدون نیاز به GitHub Actions)

---

## روش 3: استفاده از Render (جایگزین)

اگر Railway مشکل داشت:

1. به [render.com](https://render.com) بروید
2. **"New Web Service"**
3. Repository را connect کنید
4. تنظیمات:
   - Build: `npm install && npm run build`
   - Start: `npm start`
5. Deploy کنید!

---

## ✨ پیشنهاد

**روش 2 (استقرار دستی از وبسایت Railway)** را پیشنهاد می‌کنم چون:
- ✅ ساده‌تر است
- ✅ نیاز به تنظیمات پیچیده ندارد
- ✅ خودکار deploy می‌کند بعد از اولین setup
- ✅ رابط کاربری ساده دارد

---

**موفق باشید!** 🚀

