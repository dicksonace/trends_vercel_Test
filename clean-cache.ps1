# Clean Next.js cache script
Write-Host "Stopping Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Clearing .next directory..." -ForegroundColor Yellow
$nextPath = ".next"
if (Test-Path $nextPath) {
    Remove-Item -Recurse -Force $nextPath -ErrorAction SilentlyContinue
    Write-Host "Cache cleared successfully!" -ForegroundColor Green
} else {
    Write-Host ".next directory not found" -ForegroundColor Yellow
}

Write-Host "`nYou can now restart the dev server with: npm run dev" -ForegroundColor Cyan
