/**
 * Script Build Config for Render / CI/CD Deployment
 * Tự động đọc biến môi trường (Render Environment Variables hoặc file local .env) và sinh file js/config.js.
 * Tuyệt đối KHÔNG hardcode khóa bí mật (Secret Key, IV Key) vào tệp này.
 * Chạy lệnh: node scripts/build-config.js
 */

const fs = require('fs');
const path = require('path');

// Tự động load file .env nếu có (khi chạy local)
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  try {
    const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of envLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (e) {
    console.warn('[Build Config] Note: Could not read local .env file:', e.message);
  }
}

const secretKey = process.env.SECRET_KEY || '';
const ivKey = process.env.IV_KEY || '';

if (!secretKey || !ivKey) {
  console.warn('\n⚠️ [Build Config] CẢNH BÁO: SECRET_KEY hoặc IV_KEY chưa được cấu hình!');
  console.warn('   Vui lòng thêm SECRET_KEY và IV_KEY vào tab Environment trên Render Dashboard hoặc file .env local.\n');
}

const config = {
  PORTAL_URL: process.env.PORTAL_URL || 'https://gamezone.minigames.vn/portal/',
  PORTAL_DEV_URL: process.env.PORTAL_DEV_URL || 'https://gameportal-dev.anews.vn/',
  DEFAULT_CAMPAIGN_ID: process.env.DEFAULT_CAMPAIGN_ID || '24',
  CLIENT_ID: process.env.CLIENT_ID || 'iris_app',
  CLIENT_NAME: process.env.CLIENT_NAME || 'Ứng dụng sự kiện IRIS 15 Năm',
  ORG_NAME: process.env.ORG_NAME || 'Công ty cổ phần giải pháp công nghệ IRIS',
  SECRET_KEY: secretKey,
  IV_KEY: ivKey,
  EVENT_NAME: process.env.EVENT_NAME || 'CÙNG VIẾT TIẾP HÀNH TRÌNH',
  ANNIVERSARY_TEXT: process.env.ANNIVERSARY_TEXT || 'Anniversary 2011 - 2026',
  SLOGAN: process.env.SLOGAN || 'Kỷ niệm 15 Năm Thành Lập IRIS',
  HOTLINE_SUPPORT: process.env.HOTLINE_SUPPORT || 'Phòng HCNS / Ban Tổ Chức'
};

const outputContent = `/**
 * Cấu hình hệ thống Landing Page Sự kiện IRIS 15 Năm
 * Tệp này được tự động sinh trong quá trình build bởi scripts/build-config.js.
 * KHÔNG sửa trực tiếp tệp này vì sẽ bị ghi đè khi build lại.
 */
window.APP_CONFIG = ${JSON.stringify(config, null, 2)};
`;

const targetPath = path.resolve(__dirname, '../js/config.js');

try {
  fs.writeFileSync(targetPath, outputContent, 'utf8');
  console.log('[Build Config] Successfully generated js/config.js:');
  console.log({
    PORTAL_URL: config.PORTAL_URL,
    DEFAULT_CAMPAIGN_ID: config.DEFAULT_CAMPAIGN_ID,
    CLIENT_ID: config.CLIENT_ID,
    SECRET_KEY_CONFIGURED: !!secretKey ? '✅ Đã cấu hình' : '❌ Chưa cấu hình',
    IV_KEY_CONFIGURED: !!ivKey ? '✅ Đã cấu hình' : '❌ Chưa cấu hình'
  });
} catch (err) {
  console.error('[Build Config] Error writing js/config.js:', err);
  process.exit(1);
}
