# مراحل نهایی برای Push و Deploy

## ⚠️ مشکل فعلی

Git با credentials حساب قبلی (`MohamadJavad22`) سعی می‌کند push کند، اما repository متعلق به `mohamadjavad200024` است.

## ✅ راه‌حل: استفاده از Personal Access Token

### مرحله 1: ساخت Token در GitHub

1. به این آدرس بروید: **https://github.com/settings/tokens**
2. روی **"Generate new token (classic)"** کلیک کنید
3. تنظیمات:
   - **Note**: `city-map-deploy`
   - **Expiration**: `90 days` (یا بیشتر)
   - **Select scopes**: ✅ **repo** (تمام دسترسی‌های repo)
4. روی **"Generate token"** کلیک کنید
5. **Token را کپی کنید** (فقط یک بار نمایش داده می‌شود!)

### مرحله 2: Push با Token

دستور زیر را اجرا کنید:

```bash
git push -u origin main
```

**هنگام درخواست:**
- **Username**: `mohamadjavad200024`
- **Password**: **Token که کپی کردید** (نه password حساب!)

---

## 🚀 یا استفاده از GitHub Desktop (ساده‌تر)

1. **نصب GitHub Desktop:**
   - به [desktop.github.com](https://desktop.github.com) بروید
   - دانلود و نصب کنید

2. **باز کردن پروژه:**
   - GitHub Desktop را باز کنید
   - File > Add Local Repository
   - پوشه `city-map` را انتخاب کنید

3. **Push:**
   - روی **"Publish repository"** کلیک کنید
   - Repository: `mohamadjavad200024/my-city.map`
   - ✅ **"Keep this code private"** را اگر می‌خواهید private باشد
   - **"Publish repository"** را بزنید

---

## 🌐 بعد از Push: Deploy روی Railway

1. به [railway.app](https://railway.app) بروید
2. **"Login with GitHub"** را بزنید
3. **"New Project"** > **"Deploy from GitHub repo"**
4. Repository **`my-city.map`** را انتخاب کنید
5. Railway خودکار deploy می‌کند!
6. در **Settings > Networking**، Domain دریافت کنید

---

## ✨ خلاصه

1. ✅ Token در GitHub بسازید
2. ✅ `git push -u origin main` (با token)
3. ✅ به Railway بروید و deploy کنید
4. ✅ Domain دریافت کنید
5. ✅ پروژه آنلاین است! 🎉

---

**پیشنهاد**: از GitHub Desktop استفاده کنید - خیلی ساده‌تر است! 🚀

