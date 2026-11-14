#!/usr/bin/env bash
# ==============================================================================
# HourLink - Tạo Android Release Keystore & Mã hóa Base64 cho GitHub Actions
# ==============================================================================

set -e

KEYSTORE_NAME="release.keystore"
KEY_ALIAS="hourlink"
KEY_PASS="hourlink123"
STORE_PASS="hourlink123"
TARGET_DIR="../fastlane"

mkdir -p "$TARGET_DIR"
KEYSTORE_PATH="$TARGET_DIR/$KEYSTORE_NAME"

echo "🔐 Bắt đầu tạo Android Release Keystore..."

if [ -f "$KEYSTORE_PATH" ]; then
  echo "⚠️ Keystore đã tồn tại tại: $KEYSTORE_PATH"
  read -p "Bạn có muốn ghi đè không? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Giữ nguyên keystore hiện tại."
  else
    rm -f "$KEYSTORE_PATH"
  fi
fi

if [ ! -f "$KEYSTORE_PATH" ]; then
  keytool -genkey -v \
    -keystore "$KEYSTORE_PATH" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$STORE_PASS" \
    -keypass "$KEY_PASS" \
    -dname "CN=HourLink, OU=Mobile, O=HourLink Team, L=Hanoi, ST=Hanoi, C=VN" \
    -noprompt

  echo "✅ Đã tạo Keystore thành công tại: $KEYSTORE_PATH"
fi

echo ""
echo "=============================================================================="
echo "📋 THÔNG TIN CẤU HÌNH GITHUB SECRETS (Repository -> Settings -> Secrets -> Actions)"
echo "=============================================================================="
echo "ANDROID_KEYSTORE_PASSWORD: $STORE_PASS"
echo "ANDROID_KEY_ALIAS:        $KEY_ALIAS"
echo "ANDROID_KEY_PASSWORD:     $KEY_PASS"
echo "------------------------------------------------------------------------------"
echo "ANDROID_KEYSTORE_BASE64 (Copy toàn bộ chuỗi bên dưới):"
echo ""

if command -v base64 >/dev/null 2>&1; then
  base64 -w 0 "$KEYSTORE_PATH" 2>/dev/null || base64 "$KEYSTORE_PATH"
  echo ""
else
  echo "Không tìm thấy lệnh base64 để mã hóa."
fi
echo "=============================================================================="
