# ==============================================================================
# HourLink - Tạo Android Release Keystore & Mã hóa Base64 cho GitHub Actions (Windows)
# ==============================================================================

$KeystoreName = "release.keystore"
$KeyAlias = "hourlink"
$Password = "hourlink123"
$TargetDir = Join-Path $PSScriptRoot "..\fastlane"
$KeystorePath = Join-Path $TargetDir $KeystoreName

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

Write-Host "🔐 Đang kiểm tra tạo Keystore..." -ForegroundColor Cyan

if (Test-Path $KeystorePath) {
    Write-Host "⚠️ Keystore đã tồn tại tại: $KeystorePath" -ForegroundColor Yellow
} else {
    $KeytoolArgs = @(
        "-genkey", "-v",
        "-keystore", $KeystorePath,
        "-alias", $KeyAlias,
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-storepass", $Password,
        "-keypass", $Password,
        "-dname", "CN=HourLink, OU=Mobile, O=HourLink Team, L=Hanoi, ST=Hanoi, C=VN",
        "-noprompt"
    )

    try {
        & keytool $KeytoolArgs
        Write-Host "✅ Đã tạo Keystore thành công tại: $KeystorePath" -ForegroundColor Green
    } catch {
        Write-Host "❌ Không tìm thấy 'keytool' trong PATH hoặc xảy ra lỗi." -ForegroundColor Red
        Write-Host "Hãy đảm bảo JDK đã được cài đặt (Keytool nằm trong thư mục bin của JDK)." -ForegroundColor Yellow
        exit 1
    }
}

if (Test-Path $KeystorePath) {
    $Bytes = [System.IO.File]::ReadAllBytes($KeystorePath)
    $Base64 = [System.Convert]::ToBase64String($Bytes)

    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host "📋 THÔNG TIN CẤU HÌNH GITHUB SECRETS (Repository -> Settings -> Secrets -> Actions)" -ForegroundColor Green
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host "ANDROID_KEYSTORE_PASSWORD : $Password"
    Write-Host "ANDROID_KEY_ALIAS        : $KeyAlias"
    Write-Host "ANDROID_KEY_PASSWORD     : $Password"
    Write-Host "------------------------------------------------------------------------------"
    Write-Host "ANDROID_KEYSTORE_BASE64 (Copy chuỗi base64):"
    Write-Host $Base64
    Write-Host "==============================================================================" -ForegroundColor Green
}

