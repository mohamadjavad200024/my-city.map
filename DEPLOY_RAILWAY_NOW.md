# 🚀 استقرار روی Railway - راهنمای سریع

## ✅ وضعیت فعلی

- ✅ پروژه به GitHub push شد: `mohamadjavad200024/my-city.map`
- ✅ Railway CLI نصب است اما login مشکل دارد
- ✅ **راه حل: استفاده از وبسایت Railway (ساده‌تر!)**

---

## 🌐 استقرار از طریق وبسایت Railway

### مرحله 1: ورود به Railway

1. به [railway.app](https://railway.app) بروید
2. روی **"Start a New Project"** یا **"Login"** کلیک کنید
3. **"Login with GitHub"** را انتخاب کنید
4. اجازه دسترسی به GitHub را بدهید

### مرحله 2: استقرار پروژه

1. بعد از ورود، در داشبورد روی **"New Project"** کلیک کنید
2. **"Deploy from GitHub repo"** را انتخاب کنید
3. Repository **`my-city.map`** را پیدا کنید و انتخاب کنید
4. Railway به صورت خودکار:
   - ✅ پروژه را تشخیص می‌دهد (Next.js)
   - ✅ Build را شروع می‌کند
   - ✅ Deploy می‌کند

### مرحله 3: دریافت Domain

1. بعد از 2-3 دقیقه، deploy تمام می‌شود
2. روی پروژه کلیک کنید
3. به **"Settings"** بروید
4. در بخش **"Networking"**:
   - روی **"Generate Domain"** کلیک کنید
   - یک domain رایگان دریافت می‌کنید!
   - مثلاً: `my-city-map-production.up.railway.app`

### مرحله 4: بررسی

1. Domain را کپی کنید
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

## 📊 وضعیت Deploy

می‌توانید وضعیت deploy را در داشبورد Railway ببینید:
- **Logs**: خروجی build و runtime
- **Metrics**: استفاده از منابع
- **Settings**: تنظیمات پروژه

---

## 🆘 اگر مشکلی پیش آمد

### Build Failed

1. در Railway، به **"Deployments"** بروید
2. روی آخرین deployment کلیک کنید
3. **"View Logs"** را بزنید
4. خطا را بررسی کنید

### دیتابیس کار نمی‌کند

- Railway فایل سیستم پایدار دارد
- دیتابیس به صورت خودکار در پوشه `database` ساخته می‌شود
- اگر مشکل داشتید، Logs را بررسی کنید

---

## ✨ خلاصه

1. ✅ به [railway.app](https://railway.app) بروید
2. ✅ با GitHub login کنید
3. ✅ "New Project" > "Deploy from GitHub repo"
4. ✅ Repository `my-city.map` را انتخاب کنید
5. ✅ منتظر بمانید (2-3 دقیقه)
6. ✅ Domain دریافت کنید
7. ✅ پروژه آنلاین است! 🎉

---

**موفق باشید!** 🚀

