/**
 * Script chuẩn hóa danh sách nhân sự tham gia (loại bỏ 15 người không chơi)
 * và tích hợp Mã PIN Ngày sinh (DDMM) bảo mật bằng SHA-256 vào js/data.js.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const CryptoJS = require('../js/crypto-js.min.js');

const EXCEL_PATH = 'C:\\Users\\longtd\\Downloads\\data.xlsx';
const DATA_JS_PATH = path.resolve(__dirname, '../js/data.js');

const EXCLUDED_USERNAMES = new Set([
  'PDAONAY', 'MRCHOI', 'HIEUSAT', 'HANAMICHI', 'PINK', 'ASHENG', 'THUYTTT',
  'MYXLINH', 'HATHU87', 'NGNHNG', 'NGOCHUE', 'HIEU98', 'VITCOI', 'M', 'TOANDV'
]);

const EXCLUDED_DEPARTMENTS = new Set([
  'HĐQT', 'Ban Tổng Giám đốc', 'Bộ phận Trợ lý', 'Lái xe'
]);

// Ánh xạ ngày sinh cụ thể cho các trường hợp trùng tên hoặc bổ sung mới (YYYY-MM-DD)
const EXPLICIT_BIRTHDAYS = {
  KHOAIGAO: '1990-08-09', // Nguyễn Tuấn Anh (Phòng Phát triển phần mềm) -> PIN 0908
  MEINGUYEN: '1996-05-10' // Nguyễn Trà My (Phòng Kinh doanh) -> PIN 1005
};

function readBirthdaysFromExcel(excelPath) {
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Không tìm thấy file ngày sinh: ${excelPath}`);
  }
  const pyCode = [
    'import openpyxl, json, sys',
    'wb = openpyxl.load_workbook(sys.argv[1], data_only=True)',
    's = wb.active',
    'out = {}',
    'for r in s.iter_rows(values_only=True):',
    '    if not any(r): continue',
    '    name = str(r[0]).strip() if r[0] is not None else ""',
    '    dt = r[1]',
    '    if hasattr(dt, "strftime"):',
    '        out.setdefault(name, []).append(dt.strftime("%Y-%m-%d"))',
    'print(json.dumps(out, ensure_ascii=False))'
  ].join('\n');

  const rawJson = execFileSync('python', ['-c', pyCode, excelPath], { encoding: 'utf8' });
  return JSON.parse(rawJson);
}

function dateToPinDDMM(isoDate) {
  const parts = String(isoDate).trim().split('-');
  if (parts.length !== 3) {
    throw new Error(`Định dạng ngày sinh không hợp lệ: ${isoDate}`);
  }
  const month = parts[1].padStart(2, '0');
  const day = parts[2].padStart(2, '0');
  return day + month;
}

function computePinHash(username, rawPin) {
  return CryptoJS.SHA256('IRIS15_' + String(username).toUpperCase() + '_' + String(rawPin).trim()).toString();
}

function main() {
  const dataContent = fs.readFileSync(DATA_JS_PATH, 'utf8');
  const fakeWindow = {};
  new Function('window', dataContent)(fakeWindow);
  const currentData = fakeWindow.EVENT_DATA;

  if (!currentData || !Array.isArray(currentData.employees)) {
    throw new Error('Không đọc được EVENT_DATA từ js/data.js');
  }

  const bdayMap = readBirthdaysFromExcel(EXCEL_PATH);

  const filteredEmployees = currentData.employees.filter(
    (emp) => !EXCLUDED_USERNAMES.has(emp.username)
  );

  const filteredDepartments = currentData.departments.filter(
    (dept) => !EXCLUDED_DEPARTMENTS.has(dept) && filteredEmployees.some((e) => e.department === dept)
  );

  const missingOrAmbiguous = [];
  const updatedEmployees = filteredEmployees.map((emp, idx) => {
    const cleanName = String(emp.fullname || '').trim();
    const upperUser = String(emp.username || '').trim().toUpperCase();

    let dob = EXPLICIT_BIRTHDAYS[upperUser] || null;
    if (!dob) {
      const matches = bdayMap[cleanName] || [];
      if (matches.length === 1) {
        dob = matches[0];
      } else {
        missingOrAmbiguous.push({ username: emp.username, fullname: cleanName, matches });
      }
    }

    if (!dob) {
      return null;
    }

    const pin = dateToPinDDMM(dob);
    const pinHash = computePinHash(upperUser, pin);

    return {
      stt: idx + 1,
      username: emp.username,
      fullname: cleanName,
      department: emp.department,
      note: emp.note || '',
      pinHash
    };
  });

  if (missingOrAmbiguous.length > 0) {
    console.error('❌ Thiếu hoặc trùng ngày sinh:', JSON.stringify(missingOrAmbiguous, null, 2));
    process.exit(1);
  }

  const newData = {
    departments: filteredDepartments,
    employees: updatedEmployees
  };

  const output =
    '/**\n' +
    ' * IRIS 15 Years Event - Employee & Department Data\n' +
    ' */\n' +
    'window.EVENT_DATA = ' +
    JSON.stringify(newData, null, 2) +
    ';\n';

  fs.writeFileSync(DATA_JS_PATH, output, 'utf8');

  console.log(`✅ Đã chuẩn hóa js/data.js thành công!`);
  console.log(`   - Phòng ban: ${filteredDepartments.length}`);
  console.log(`   - Nhân sự tham gia: ${updatedEmployees.length}`);
  console.log(`   - Tất cả ${updatedEmployees.length} nhân sự đều đã có pinHash (SHA-256).`);
}

main();
