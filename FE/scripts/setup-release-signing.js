const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (!fs.existsSync(buildGradlePath)) {
  console.log('⚠️ android/app/build.gradle not found, skipping signing configuration.');
  process.exit(0);
}

let content = fs.readFileSync(buildGradlePath, 'utf8').replace(/\r\n/g, '\n');

const keystorePassword = process.env.ANDROID_KEYSTORE_PASSWORD || process.env.KEYSTORE_PASSWORD || 'hourlink123';
const keyAlias = process.env.ANDROID_KEY_ALIAS || process.env.KEY_ALIAS || 'hourlink';
const keyPassword = process.env.ANDROID_KEY_PASSWORD || process.env.KEY_PASSWORD || 'hourlink123';

const releaseSigning = `        release {
            if (project.hasProperty('HOURLINK_RELEASE_STORE_FILE')) {
                storeFile file(HOURLINK_RELEASE_STORE_FILE)
                storePassword HOURLINK_RELEASE_STORE_PASSWORD
                keyAlias HOURLINK_RELEASE_KEY_ALIAS
                keyPassword HOURLINK_RELEASE_KEY_PASSWORD
            } else {
                storeFile file('release.keystore')
                storePassword '${keystorePassword}'
                keyAlias '${keyAlias}'
                keyPassword '${keyPassword}'
            }
        }`;

if (!content.includes('signingConfigs.release')) {
  // 1. Thêm release signing block vào signingConfigs
  content = content.replace('signingConfigs {', 'signingConfigs {\n' + releaseSigning);

  // 2. Chuyển release buildType từ debug sang release signing
  const debugTarget = `// Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;

  if (content.includes(debugTarget)) {
    content = content.replace(debugTarget, 'signingConfig signingConfigs.release');
  } else {
    content = content.replace(/(release\s*\{[\s\S]*?signingConfig\s+)signingConfigs\.debug/, '$1signingConfigs.release');
  }

  fs.writeFileSync(buildGradlePath, content, 'utf8');
  console.log('✅ Successfully configured release signing in android/app/build.gradle');
} else {
  console.log('ℹ️ release signing is already configured.');
}
