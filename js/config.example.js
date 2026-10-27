/**
 * TỆP CẤU HÌNH MẪU (CONFIG TEMPLATE)
 * Không commit khóa bảo mật thật vào Git.
 * Trên Render: Điền các giá trị vào mục Environment Variables.
 * Trên Local: Tạo tệp .env hoặc sao chép tệp này thành js/config.js và điền khóa của bạn.
 */
window.APP_CONFIG = {
  PORTAL_URL: 'https://gamezone.minigames.vn/portal/',
  PORTAL_DEV_URL: 'https://gameportal-dev.anews.vn/',
  DEFAULT_CAMPAIGN_ID: '24',
  CLIENT_ID: 'iris_app',
  CLIENT_NAME: 'Ứng dụng sự kiện IRIS 15 Năm',
  ORG_NAME: 'Công ty cổ phần truyền thông IRIS',

  // Khóa bảo mật mã hóa AES-256-CBC (Bắt buộc điền trên Render Dashboard)
  SECRET_KEY: 'YOUR_SECRET_KEY_HERE',
  IV_KEY: 'YOUR_IV_KEY_HERE',

  EVENT_NAME: 'CÙNG VIẾT TIẾP HÀNH TRÌNH',
  ANNIVERSARY_TEXT: 'Anniversary 2011 - 2026',
  SLOGAN: 'Kỷ niệm 15 Năm Thành Lập IRIS',
  HOTLINE_SUPPORT: 'Phòng HCNS / Ban Tổ Chức'
};
