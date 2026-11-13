/**
 * Script sinh token và URL Cổng Game IRIS cho toàn bộ nhân sự (Campaign 26)
 */
const fs = require('fs');
const path = require('path');
const CryptoJS = require('../js/crypto-js.min.js');

// 1. Đọc file .env
const envPath = path.resolve(__dirname, '../.env');
const env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      env[key] = val;
    }
  }
}

const SECRET_KEY = env.SECRET_KEY || process.env.SECRET_KEY || '';
const IV_KEY = env.IV_KEY || process.env.IV_KEY || '';
if (!SECRET_KEY || !IV_KEY) {
  console.error('❌ Thiếu SECRET_KEY hoặc IV_KEY trong file .env hoặc biến môi trường!');
  process.exit(1);
}
const CAMPAIGN_ID = env.DEFAULT_CAMPAIGN_ID || '26';
const CLIENT_ID = env.CLIENT_ID || 'iris_app';
const PORTAL_URL = env.PORTAL_URL || 'https://gamezone.minigames.vn/portal/';
const CLIENT_NAME = 'Ứng dụng sự kiện IRIS 15 Năm';
const ORG_NAME = 'Công ty cổ phần giải pháp công nghệ IRIS';

// 2. Đọc file js/data.js
const dataPath = path.resolve(__dirname, '../js/data.js');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const fakeWindow = {};
const fn = new Function('window', dataContent);
fn(fakeWindow);

const employees = fakeWindow.EVENT_DATA ? fakeWindow.EVENT_DATA.employees : [];

console.log(`Đang tạo token cho ${employees.length} nhân sự (Chiến dịch: ${CAMPAIGN_ID})...`);

const secretKeyParsed = CryptoJS.enc.Utf8.parse(SECRET_KEY);
const ivKeyParsed = CryptoJS.enc.Utf8.parse(IV_KEY);

const results = [];

for (const emp of employees) {
  const payload = {
    Username: emp.username,
    UserProfileAttribute: {
      FullName: emp.username, // Sử dụng nickname theo cấu hình app.js
      Department: emp.department,
      ClientName: CLIENT_NAME,
      OrgName: ORG_NAME
    },
    ClientID: CLIENT_ID
  };

  const jsonStr = JSON.stringify(payload);
  const encrypted = CryptoJS.AES.encrypt(jsonStr, secretKeyParsed, {
    iv: ivKeyParsed,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const cipherToken = encrypted.toString();

  const url = new URL(PORTAL_URL);
  url.searchParams.set('campaignId', CAMPAIGN_ID);
  url.searchParams.set('authen', cipherToken);
  url.searchParams.set('tokenApp', cipherToken);
  url.searchParams.set('clientID', CLIENT_ID);

  results.push({
    stt: emp.stt,
    username: emp.username,
    fullname: emp.fullname,
    department: emp.department,
    campaignId: CAMPAIGN_ID,
    token: cipherToken,
    url: url.toString()
  });
}

const outputPath = path.resolve(__dirname, 'tokens_campaign_26.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
console.log(`✅ Đã xuất ${results.length} token và link vào: ${outputPath}`);

