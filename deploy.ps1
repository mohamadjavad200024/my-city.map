# PowerShell Script for Auto Deploy
# این script برای استقرار خودکار استفاده می‌شود

Write-Host "🚀 شروع استقرار خودکار..." -ForegroundColor Green

# بررسی Git status
Write-Host "`n📦 بررسی تغییرات Git..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  تغییرات commit نشده وجود دارد!" -ForegroundColor Red
    Write-Host "لطفاً ابتدا تغییرات را commit کنید:" -ForegroundColor Yellow
    Write-Host "  git add ." -ForegroundColor Cyan
    Write-Host "  git commit -m 'your message'" -ForegroundColor Cyan
    exit 1
}

# Push به GitHub
Write-Host "`n📤 Push کردن به GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ خطا در push!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Push موفق بود!" -ForegroundColor Green

# راهنمای deploy
Write-Host "`n🌐 برای deploy:" -ForegroundColor Cyan
Write-Host "1. به https://railway.app بروید" -ForegroundColor White
Write-Host "2. New Project > Deploy from GitHub repo" -ForegroundColor White
Write-Host "3. Repository 'my-city.map' را انتخاب کنید" -ForegroundColor White
Write-Host "4. Railway خودکار deploy می‌کند!" -ForegroundColor White

Write-Host "`n✨ تمام!" -ForegroundColor Green

