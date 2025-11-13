# راهنمای استقرار روی GitHub

## مرحله 1: ایجاد Repository در GitHub

1. به [github.com](https://github.com) بروید و وارد حساب کاربری خود شوید
2. روی دکمه **"+"** در بالای صفحه کلیک کنید
3. **"New repository"** را انتخاب کنید
4. اطلاعات زیر را وارد کنید:
   - **Repository name**: `city-map` (یا هر نام دیگری که می‌خواهید)
   - **Description**: `نقشه شهر با قابلیت نمایش فروشگاه‌ها و آگهی‌ها`
   - **Visibility**: 
     - ✅ **Public** (اگر می‌خواهید دیگران ببینند)
     - ✅ **Private** (اگر می‌خواهید خصوصی باشد)
   - ❌ **DO NOT** initialize with README, .gitignore, or license (چون قبلاً داریم)
5. روی **"Create repository"** کلیک کنید

## مرحله 2: Push کردن پروژه به GitHub

بعد از ایجاد repository، GitHub دستورات لازم را نشان می‌دهد. اما چون ما قبلاً Git را initialize کرده‌ایم، دستورات زیر را اجرا کنید:

### اگر repository خالی است (پیشنهادی):

```bash
# اضافه کردن remote repository
git remote add origin https://github.com/YOUR_USERNAME/city-map.git

# تغییر نام branch به main (اگر لازم باشد)
git branch -M main

# Push کردن به GitHub
git push -u origin main
```

**⚠️ توجه**: `YOUR_USERNAME` را با نام کاربری GitHub خود جایگزین کنید.

### اگر repository قبلاً فایل دارد:

```bash
# اضافه کردن remote repository
git remote add origin https://github.com/YOUR_USERNAME/city-map.git

# تغییر نام branch به main
git branch -M main

# Pull کردن تغییرات (اگر وجود دارد)
git pull origin main --allow-unrelated-histories

# Push کردن به GitHub
git push -u origin main
```

## مرحله 3: بررسی

بعد از push، به صفحه repository در GitHub بروید و مطمئن شوید که تمام فایل‌ها آپلود شده‌اند.

## مرحله 4: استقرار از GitHub

حالا که پروژه روی GitHub است، می‌توانید از پلتفرم‌های مختلف deploy کنید:

### 🚀 Railway (پیشنهادی برای SQLite)

1. به [railway.app](https://railway.app) بروید
2. با GitHub وارد شوید
3. **"New Project"** > **"Deploy from GitHub repo"**
4. Repository `city-map` را انتخاب کنید
5. Railway به صورت خودکار deploy می‌کند
6. ✅ تمام! پروژه شما آنلاین است

### 🌐 Render

1. به [render.com](https://render.com) بروید
2. با GitHub وارد شوید
3. **"New +"** > **"Web Service"**
4. Repository را انتخاب کنید
5. تنظیمات:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. **"Create Web Service"** را بزنید

### ⚡ Vercel

⚠️ **توجه**: Vercel برای SQLite مناسب نیست. اگر می‌خواهید از Vercel استفاده کنید، باید دیتابیس را به PostgreSQL تبدیل کنید.

1. به [vercel.com](https://vercel.com) بروید
2. با GitHub وارد شوید
3. **"Add New Project"**
4. Repository را انتخاب کنید
5. **"Deploy"** را بزنید

## 🔄 به‌روزرسانی پروژه

هر زمان که تغییراتی ایجاد کردید:

```bash
# اضافه کردن تغییرات
git add .

# Commit کردن
git commit -m "توضیح تغییرات"

# Push کردن به GitHub
git push
```

بعد از push، اگر از Railway یا Render استفاده می‌کنید، به صورت خودکار deploy می‌شود.

## 📝 نکات مهم

### ✅ فایل‌هایی که در GitHub هستند:
- کد منبع
- فایل‌های تنظیمات
- README و مستندات

### ❌ فایل‌هایی که در GitHub نیستند (به خاطر .gitignore):
- `node_modules/` - وابستگی‌ها
- `database/*.db` - فایل‌های دیتابیس
- `public/uploads/*` - فایل‌های آپلود شده
- `.next/` - فایل‌های build

این فایل‌ها در production به صورت خودکار ساخته می‌شوند.

## 🆘 رفع مشکلات

### خطای Authentication

اگر هنگام push خطای authentication گرفتید:

**روش 1: استفاده از Personal Access Token**
1. به GitHub > Settings > Developer settings > Personal access tokens بروید
2. "Generate new token" را بزنید
3. دسترسی‌های لازم را انتخاب کنید
4. Token را کپی کنید
5. هنگام push، به جای password از token استفاده کنید

**روش 2: استفاده از GitHub CLI**
```bash
# نصب GitHub CLI
winget install GitHub.cli

# ورود
gh auth login

# Push
git push
```

### خطای "remote origin already exists"

اگر این خطا را گرفتید:
```bash
# حذف remote قبلی
git remote remove origin

# اضافه کردن دوباره
git remote add origin https://github.com/YOUR_USERNAME/city-map.git
```

## ✨ نتیجه

حالا پروژه شما روی GitHub است و می‌توانید:
- ✅ از هر جا به کد دسترسی داشته باشید
- ✅ با دیگران همکاری کنید
- ✅ به راحتی deploy کنید
- ✅ نسخه‌های مختلف را مدیریت کنید

**مرحله بعد**: از Railway یا Render برای deploy استفاده کنید! 🚀

