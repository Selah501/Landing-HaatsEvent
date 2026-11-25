param(
    [switch]$CheckOnly
)

Write-Host "=== [1/2] 사전 건강검진 실행 (health_check.py) ===" -ForegroundColor Cyan
python "c:\dev\전단지이벤트\scripts\health_check.py"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 건강검진 실패! 배포가 자동 차단되었습니다." -ForegroundColor Red
    exit 1
}

if ($CheckOnly) {
    Write-Host "✅ 건강검진 통과 (CheckOnly 모드이므로 배포 생략)" -ForegroundColor Green
    exit 0
}

Write-Host "`n=== [2/2] 건강검진 통과 -> Firebase Hosting 배포 시작 ===" -ForegroundColor Green
Set-Location "c:\dev\전단지이벤트\landing"
firebase deploy --only hosting
