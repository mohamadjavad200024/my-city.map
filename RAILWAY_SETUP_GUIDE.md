# 🚀 راهنمای تنظیم Railway - مرحله به مرحله

## ✅ تنظیمات فعلی شما

- ✅ Source Repo: `mohamadjavad200024/my-city.map` - درست است!
- ✅ Branch: `main` - درست است!
- ✅ Auto-deploy: فعال است - هر push جدید خودکار deploy می‌شود!

---

## 🔧 تنظیمات لازم

### 1. Networking - دریافت Domain

1. در بخش **"Networking"**
2. روی **"Generate Domain"** کلیک کنید
3. یک domain رایگان دریافت می‌کنید (مثلاً: `my-city-map-production.up.railway.app`)

### 2. Build Settings - بررسی Build Command

در بخش **"Build"**:

- **Builder**: `Railpack` (پیش‌فرض) ✅
- **Build Command**: خالی بگذارید (Railway خودکار `npm run build` را اجرا می‌کند) ✅

**یا اگر می‌خواهید دستی تنظیم کنید:**
```
npm install && npm run build
```

### 3. Deploy Settings - بررسی Start Command

در بخش **"Deploy"**:

- **Start Command**: خالی بگذارید (Railway خودکار `npm start` را اجرا می‌کند) ✅

**یا اگر می‌خواهید دستی تنظیم کنید:**
```
npm start
```

### 4. Resource Limits (اختیاری)

- **CPU**: 2 vCPU (پیش‌فرض) ✅
- **Memory**: 1 GB (پیش‌فرض) ✅

این تنظیمات برای شروع کافی است.

### 5. Restart Policy

- **On Failure**: ✅ درست است
- **Max restart retries**: 10 ✅ درست است

---

## 🚀 شروع Deploy

بعد از تنظیمات:

1. Railway به صورت خودکار deploy را شروع می‌کند
2. یا می‌توانید روی **"Deploy"** یا **"Redeploy"** کلیک کنید
3. منتظر بمانید تا build و deploy تمام شود (2-3 دقیقه)

---

## 📊 بررسی Deploy

1. به بخش **"Deployments"** بروید
2. آخرین deployment را ببینید
3. روی آن کلیک کنید تا **Logs** را ببینید
4. اگر build موفق بود → ✅ پروژه شما آنلاین است!

---

## 🌐 دسترسی به پروژه

بعد از deploy موفق:

1. Domain را از بخش **"Networking"** کپی کنید
2. در مرورگر باز کنید
3. اگر صفحه Next.js نمایش داده شد → ✅ **موفق!**

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

### Build Failed

1. به **"Deployments"** بروید
2. روی آخرین deployment کلیک کنید
3. **"View Logs"** را بزنید
4. خطا را بررسی کنید

**خطاهای رایج:**
- اگر `npm run build` خطا داد → Logs را بررسی کنید
- اگر dependency مشکل داشت → `package.json` را بررسی کنید

### دیتابیس کار نمی‌کند

- Railway فایل سیستم پایدار دارد
- دیتابیس به صورت خودکار در پوشه `database` ساخته می‌شود
- اگر مشکل داشتید، Logs را بررسی کنید

### Port Error

- Railway به صورت خودکار PORT را تنظیم می‌کند
- Next.js خودکار PORT را از environment variable می‌خواند
- معمولاً مشکلی نیست

---

## ✨ خلاصه مراحل

1. ✅ **Generate Domain** را بزنید
2. ✅ Build Command و Start Command را بررسی کنید (معمولاً خالی بگذارید)
3. ✅ منتظر بمانید تا deploy تمام شود
4. ✅ Domain را باز کنید و تست کنید
5. ✅ پروژه شما آنلاین است! 🎉

---

**موفق باشید!** 🚀

