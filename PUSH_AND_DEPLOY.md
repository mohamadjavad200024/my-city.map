# راهنمای کامل: Push به GitHub و Deploy روی Railway

## 🚀 مرحله 1: Push به GitHub

برای push کردن به repository جدید `my-city.map`، یکی از این روش‌ها را انتخاب کنید:

### روش 1: استفاده از Personal Access Token (پیشنهادی)

1. **ایجاد Token در GitHub:**
   - به [github.com/settings/tokens](https://github.com/settings/tokens) بروید
   - روی **"Generate new token (classic)"** کلیک کنید
   - نام: `city-map-deploy`
   - دسترسی‌ها: ✅ **repo** (تمام دسترسی‌های repo)
   - روی **"Generate token"** کلیک کنید
   - **Token را کپی کنید** (فقط یک بار نمایش داده می‌شود!)

2. **Push کردن:**
   ```bash
   git push -u origin main
   ```
   - Username: `mohamadjavad200024`
   - Password: **Token که کپی کردید** (نه password حساب!)

### روش 2: استفاده از GitHub Desktop

1. GitHub Desktop را نصب کنید: [desktop.github.com](https://desktop.github.com)
2. Repository را باز کنید
3. روی **"Publish repository"** کلیک کنید
4. Repository را انتخاب کنید: `mohamadjavad200024/my-city.map`
5. Push کنید!

### روش 3: استفاده از VS Code

1. VS Code را باز کنید
2. Source Control (Ctrl+Shift+G)
3. روی **"..."** کلیک کنید > **"Push"**
4. Credentials را وارد کنید

---

## 🌐 مرحله 2: استقرار روی Railway

بعد از push موفق به GitHub:

### از طریق وبسایت (ساده‌ترین روش):

1. **ورود به Railway:**
   - به [railway.app](https://railway.app) بروید
   - روی **"Start a New Project"** کلیک کنید
   - **"Login with GitHub"** را انتخاب کنید
   - اجازه دسترسی را بدهید

2. **استقرار پروژه:**
   - روی **"New Project"** کلیک کنید
   - **"Deploy from GitHub repo"** را انتخاب کنید
   - Repository **`my-city.map`** را پیدا کنید و انتخاب کنید
   - Railway به صورت خودکار:
     - ✅ پروژه را تشخیص می‌دهد (Next.js)
     - ✅ Build را شروع می‌کند
     - ✅ Deploy می‌کند

3. **دریافت Domain:**
   - بعد از 2-3 دقیقه، deploy تمام می‌شود
   - روی پروژه کلیک کنید
   - به **"Settings"** > **"Networking"** بروید
   - روی **"Generate Domain"** کلیک کنید
   - Domain رایگان دریافت می‌کنید! (مثلاً: `my-city-map-production.up.railway.app`)

### از طریق CLI (اگر Railway CLI نصب است):

```bash
# ورود به Railway
railway login

# Initialize پروژه
railway init

# Link کردن به repository
railway link

# Deploy
railway up
```

---

## ✅ بررسی استقرار

بعد از deploy:

1. **باز کردن لینک:**
   - Domain را از Railway کپی کنید
   - در مرورگر باز کنید

2. **بررسی:**
   - اگر صفحه Next.js نمایش داده شد → ✅ موفق!
   - اگر خطا دیدید → Logs را در Railway بررسی کنید

---

## 🔄 به‌روزرسانی خودکار

بعد از اولین deploy:

- هر بار که به GitHub push کنید، Railway به صورت خودکار deploy می‌کند!
- نیازی به کار دستی نیست

```bash
git add .
git commit -m "تغییرات جدید"
git push
# Railway خودکار deploy می‌کند! 🚀
```

---

## 🆘 رفع مشکلات

### خطای Permission در Push

**مشکل:** `Permission denied` یا `403 error`

**راه‌حل:**
- از Personal Access Token استفاده کنید (نه password)
- یا از GitHub Desktop استفاده کنید

### خطای Build در Railway

**مشکل:** Build failed

**راه‌حل:**
1. Logs را در Railway بررسی کنید
2. مطمئن شوید `npm run build` در local کار می‌کند:
   ```bash
   npm run build
   ```

### خطای دیتابیس

**مشکل:** دیتابیس کار نمی‌کند

**راه‌حل:**
- Railway فایل سیستم پایدار دارد
- دیتابیس به صورت خودکار ساخته می‌شود
- اگر مشکل داشتید، Logs را بررسی کنید

---

## 📝 خلاصه مراحل

1. ✅ Token در GitHub بسازید
2. ✅ `git push -u origin main` (با token)
3. ✅ به Railway بروید و login کنید
4. ✅ "Deploy from GitHub repo" > `my-city.map`
5. ✅ Domain دریافت کنید
6. ✅ پروژه آنلاین است! 🎉

---

**موفق باشید!** 🚀

