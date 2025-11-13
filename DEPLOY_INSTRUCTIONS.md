# دستورالعمل استقرار - my-city.map

## مرحله 1: Push به GitHub

برای push کردن به repository جدید، یکی از این روش‌ها را استفاده کنید:

### روش 1: استفاده از GitHub Desktop یا VS Code
- از GitHub Desktop یا VS Code برای push استفاده کنید
- یا credentials را در Windows Credential Manager تنظیم کنید

### روش 2: استفاده از Personal Access Token

1. به GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic) بروید
2. "Generate new token" را بزنید
3. دسترسی‌های `repo` را انتخاب کنید
4. Token را کپی کنید
5. دستورات زیر را اجرا کنید:

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/mohamadjavad200024/my-city.map.git
git push -u origin main
```

یا هنگام push، username را `mohamadjavad200024` و password را token قرار دهید.

## مرحله 2: استقرار روی Railway

بعد از push موفق، برای deploy:

### از طریق وبسایت Railway (ساده‌ترین):

1. به [railway.app](https://railway.app) بروید
2. با GitHub login کنید
3. "New Project" > "Deploy from GitHub repo"
4. Repository `my-city.map` را انتخاب کنید
5. Railway به صورت خودکار deploy می‌کند!

### از طریق CLI:

```bash
railway login
railway init
railway up
```

## مرحله 3: دریافت Domain

بعد از deploy:
1. در Railway، به Settings > Networking بروید
2. "Generate Domain" را بزنید
3. Domain رایگان دریافت می‌کنید!

---

**نکته**: اگر در push مشکل دارید، می‌توانید از GitHub Desktop استفاده کنید که ساده‌تر است.

