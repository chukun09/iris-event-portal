/**
 * IRIS 15TH ANNIVERSARY - EVENT REDIRECT PORTAL
 * Custom Luxury Dropdowns & Seamless Bi-directional Sync
 */

(function () {
  'use strict';

  let currentEmployee = null;
  let selectedDepartment = null;
  const STORAGE_KEY = 'iris_15th_recent_employee';

  // Confetti & Celebration State
  let confettiCtx = null;
  let confettiWidth = 0;
  let confettiHeight = 0;
  let confettiParticles = [];
  let confettiAnimId = null;

  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchDropdown = document.getElementById('searchResultsDropdown');
  
  // Custom Dropdown Phòng Ban
  const deptDropdown = document.getElementById('deptDropdown');
  const deptTrigger = document.getElementById('deptTrigger');
  const deptTriggerText = document.getElementById('deptTriggerText');
  const deptOptionsList = document.getElementById('deptOptionsList');

  // Custom Dropdown Nhân Viên
  const empDropdown = document.getElementById('empDropdown');
  const empTrigger = document.getElementById('empTrigger');
  const empTriggerText = document.getElementById('empTriggerText');
  const empOptionsList = document.getElementById('empOptionsList');

  // VIP Ticket
  const vipTicketCard = document.getElementById('vipTicketCard');
  const ticketAvatar = document.getElementById('ticketAvatar');
  const ticketFullName = document.getElementById('ticketFullName');
  const ticketDepartment = document.getElementById('ticketDepartment');
  const ticketSerial = document.getElementById('ticketSerial');
  const btnMainEnter = document.getElementById('btnMainEnter');

  // Quick Pass
  const quickPassBox = document.getElementById('quickPassBox');
  const quickAvatar = document.getElementById('quickAvatar');
  const quickName = document.getElementById('quickName');
  const quickDept = document.getElementById('quickDept');
  const btnQuickEnter = document.getElementById('btnQuickEnter');
  const btnSwitchUser = document.getElementById('btnSwitchUser');

  // Transition Screen
  const connectingScreen = document.getElementById('connectingScreen');
  const connectingDesc = document.getElementById('connectingDesc');

  initStarfield();
  initCelebrationCanvas();
  initPortal();

  // Micro Haptic Feedback (Vibration API trên mobile)
  function triggerHaptic(type = 'light') {
    try {
      if (navigator && 'vibrate' in navigator) {
        if (type === 'success') {
          navigator.vibrate([15, 40, 25]);
        } else if (type === 'medium') {
          navigator.vibrate(20);
        } else {
          navigator.vibrate(10);
        }
      }
    } catch (e) {}
  }

  function initPortal() {
    if (!window.EVENT_DATA || !window.EVENT_DATA.employees) {
      console.error('EVENT_DATA not found in js/data.js');
      return;
    }

    renderDepartmentOptions();
    checkQuickPass();
    bindUserInteractions();
  }

  // 1. Điền danh sách vào Custom Dropdown Phòng Ban
  function renderDepartmentOptions() {
    const departments = window.EVENT_DATA.departments || [];
    const employees = window.EVENT_DATA.employees || [];
    deptOptionsList.innerHTML = '';

    departments.forEach(function (dept, idx) {
      const count = employees.filter(function (e) { return e.department === dept; }).length;
      const opt = document.createElement('div');
      opt.className = 'dropdown-option';
      opt.style.setProperty('--opt-index', idx);
      opt.dataset.dept = dept;
      opt.innerHTML = `
        <div class="dept-option-left">
          <span class="dept-option-icon">🏢</span>
          <span class="dept-option-name">${escapeHtml(dept)}</span>
        </div>
        <span class="dept-option-badge">${count} người</span>
      `;

      opt.addEventListener('click', function () {
        selectDepartment(dept);
      });

      deptOptionsList.appendChild(opt);
    });
  }

  // 2. Xử lý khi chọn một phòng ban
  function selectDepartment(deptName, autoOpenEmployeeDropdown = true) {
    selectedDepartment = deptName;
    deptTriggerText.textContent = deptName;
    triggerHaptic('light');
    
    // Highlight option được chọn
    const allDeptOpts = deptOptionsList.querySelectorAll('.dropdown-option');
    allDeptOpts.forEach(function (item) {
      if (item.dataset.dept === deptName) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    closeDropdown(deptDropdown);

    // Kích hoạt Dropdown nhân viên và điền nhân sự
    renderEmployeeOptions(deptName);
    empTrigger.disabled = false;
    empTrigger.classList.remove('disabled');
    empTriggerText.textContent = '-- Bấm để chọn tên của bạn --';

    setEmployee(null); // Reset nhân viên khi chọn phòng mới

    // Tự động mở dropdown nhân viên để thao tác liền mạch
    if (autoOpenEmployeeDropdown) {
      setTimeout(function () {
        openDropdown(empDropdown);
      }, 150);
    }
  }

  // 3. Điền danh sách vào Custom Dropdown Nhân Viên theo phòng
  function renderEmployeeOptions(deptName) {
    const employees = (window.EVENT_DATA.employees || []).filter(function (e) {
      return e.department === deptName;
    });

    empOptionsList.innerHTML = '';

    employees.forEach(function (emp, idx) {
      const opt = document.createElement('div');
      opt.className = 'dropdown-option';
      opt.style.setProperty('--opt-index', idx);
      opt.dataset.username = emp.username;
      opt.innerHTML = `
        <div class="emp-option-left">
          <div class="emp-option-avatar">${getMonogram(emp.fullname)}</div>
          <div>
            <div class="emp-option-fullname">${escapeHtml(emp.fullname)}</div>
            <div class="emp-option-username">ID: ${escapeHtml(emp.username)}</div>
          </div>
        </div>
        <div class="emp-option-check" style="display: none;">✔</div>
      `;

      opt.addEventListener('click', function () {
        selectEmployeeFromDropdown(emp);
      });

      empOptionsList.appendChild(opt);
    });
  }

  // 4. Xử lý khi chọn nhân viên từ Dropdown
  function selectEmployeeFromDropdown(emp) {
    empTriggerText.textContent = emp.fullname + ' (' + emp.username + ')';
    triggerHaptic('success');

    // Highlight checkmark
    const allEmpOpts = empOptionsList.querySelectorAll('.dropdown-option');
    allEmpOpts.forEach(function (item) {
      const check = item.querySelector('.emp-option-check');
      if (item.dataset.username === emp.username) {
        item.classList.add('selected');
        if (check) check.style.display = 'block';
      } else {
        item.classList.remove('selected');
        if (check) check.style.display = 'none';
      }
    });

    closeDropdown(empDropdown);
    setEmployee(emp, true);
  }

  // 5. Đặt nhân viên được chọn và hiển thị Tấm Vé VIP
  function setEmployee(emp, shouldCelebrate = true) {
    currentEmployee = emp;

    if (!emp) {
      vipTicketCard.style.display = 'none';
      btnMainEnter.disabled = true;
      return;
    }

    ticketAvatar.textContent = getMonogram(emp.fullname);
    ticketFullName.textContent = emp.fullname;
    ticketDepartment.textContent = emp.department;
    ticketSerial.textContent = 'ID: ' + emp.username;

    vipTicketCard.style.display = 'block';
    btnMainEnter.disabled = false;

    // Kích hoạt pháo hoa hạt vàng kim & rung chúc mừng
    if (shouldCelebrate) {
      triggerCelebration();
      triggerHaptic('success');
    }

    // Ẩn bàn phím ảo nếu đang focus trên mobile
    if (document.activeElement && document.activeElement === searchInput) {
      searchInput.blur();
    }

    // Cuộn nhẹ tới vé VIP
    setTimeout(function () {
      vipTicketCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  }

  function getMonogram(name) {
    if (!name) return 'IR';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  // 6. Quản lý trạng thái Đóng/Mở Custom Dropdowns
  function toggleDropdown(dropdownEl) {
    if (dropdownEl.classList.contains('open')) {
      closeDropdown(dropdownEl);
    } else {
      // Đóng tất cả dropdown khác trước khi mở
      closeDropdown(deptDropdown);
      closeDropdown(empDropdown);
      openDropdown(dropdownEl);
    }
  }

  function openDropdown(dropdownEl) {
    dropdownEl.classList.add('open');
    const trigger = dropdownEl.querySelector('.dropdown-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown(dropdownEl) {
    dropdownEl.classList.remove('open');
    const trigger = dropdownEl.querySelector('.dropdown-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  // 7. Kiểm tra Quick Pass từ LocalStorage
  function checkQuickPass() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const emp = JSON.parse(saved);
        if (emp && emp.username && emp.fullname) {
          quickAvatar.textContent = getMonogram(emp.fullname);
          quickName.textContent = emp.fullname;
          quickDept.textContent = emp.department + ' • ' + emp.username;
          quickPassBox.style.display = 'flex';

          btnQuickEnter.onclick = function () {
            redirectToPortal(emp);
          };

          btnSwitchUser.onclick = function () {
            localStorage.removeItem(STORAGE_KEY);
            quickPassBox.style.display = 'none';
          };
        }
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  // 8. Tìm kiếm nhanh Autocomplete
  function normalizeText(text) {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }

  function highlightMatch(text, query) {
    if (!text || !query) return escapeHtml(text);
    const raw = String(text);
    const cleanRaw = normalizeText(raw);
    const cleanQ = normalizeText(query);
    const idx = cleanRaw.indexOf(cleanQ);
    if (idx === -1) return escapeHtml(raw);

    const before = raw.substring(0, idx);
    const match = raw.substring(idx, idx + query.length);
    const after = raw.substring(idx + query.length);
    return escapeHtml(before) + '<span class="search-highlight">' + escapeHtml(match) + '</span>' + escapeHtml(after);
  }

  function handleSearchInput(query) {
    query = (query || '').trim();
    if (!query) {
      clearSearchBtn.style.display = 'none';
      searchDropdown.classList.remove('active');
      searchDropdown.innerHTML = '';
      return;
    }

    clearSearchBtn.style.display = 'block';
    const cleanQuery = normalizeText(query);
    const employees = window.EVENT_DATA.employees || [];

    const matches = employees.filter(function (e) {
      const nameMatch = normalizeText(e.fullname).indexOf(cleanQuery) !== -1;
      const userMatch = e.username.toLowerCase().indexOf(query.toLowerCase()) !== -1;
      const deptMatch = normalizeText(e.department).indexOf(cleanQuery) !== -1;
      return nameMatch || userMatch || deptMatch;
    });

    searchDropdown.innerHTML = '';

    if (matches.length === 0) {
      searchDropdown.innerHTML = '<div class="result-empty">Không tìm thấy "' + escapeHtml(query) + '"</div>';
      searchDropdown.classList.add('active');
      return;
    }

    matches.slice(0, 10).forEach(function (emp) {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.innerHTML = `
        <div class="result-left">
          <div class="result-avatar">${getMonogram(emp.fullname)}</div>
          <div>
            <div class="result-fullname">${highlightMatch(emp.fullname, query)}</div>
            <div class="result-dept">${highlightMatch(emp.department, query)}</div>
          </div>
        </div>
        <div class="result-id-tag">${highlightMatch(emp.username, query)}</div>
      `;

      item.onclick = function () {
        triggerHaptic('success');
        // Đồng bộ ngược lại 2 Custom Dropdown
        selectDepartment(emp.department, false);
        selectEmployeeFromDropdown(emp);

        searchInput.value = emp.fullname;
        searchDropdown.classList.remove('active');
      };

      searchDropdown.appendChild(item);
    });

    searchDropdown.classList.add('active');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 9. Gán sự kiện tương tác
  function bindUserInteractions() {
    // Dropdown Triggers
    deptTrigger.addEventListener('click', function (e) {
      e.stopPropagation();
      triggerHaptic('light');
      toggleDropdown(deptDropdown);
    });

    empTrigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!empTrigger.disabled) {
        triggerHaptic('light');
        toggleDropdown(empDropdown);
      }
    });

    // Tìm kiếm
    let debounceTimer = null;
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      const val = this.value;
      debounceTimer = setTimeout(function () {
        handleSearchInput(val);
      }, 120);
    });

    clearSearchBtn.addEventListener('click', function () {
      searchInput.value = '';
      handleSearchInput('');
      searchInput.focus();
    });

    // Đóng dropdown khi chạm ra ngoài
    document.addEventListener('click', function (e) {
      if (!deptDropdown.contains(e.target)) {
        closeDropdown(deptDropdown);
      }
      if (!empDropdown.contains(e.target)) {
        closeDropdown(empDropdown);
      }
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove('active');
      }
    });

    // Phím Escape để đóng nhanh
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeDropdown(deptDropdown);
        closeDropdown(empDropdown);
        searchDropdown.classList.remove('active');
      }
    });

    // Nút CTA Chính
    btnMainEnter.addEventListener('click', function () {
      if (!currentEmployee) return;
      triggerHaptic('medium');
      redirectToPortal(currentEmployee);
    });
  }

  // 10. Mã hóa AES-256-CBC và Chuyển hướng tới Game Portal
  function redirectToPortal(emp) {
    const config = window.APP_CONFIG || {};

    connectingScreen.classList.add('active');
    connectingDesc.textContent = 'Chào mừng ' + emp.fullname + ' (' + emp.department + ')';

    const payload = {
      Username: emp.username,
      UserProfileAttribute: {
        FullName: emp.username, // Sử dụng Nickname để BXH hiển thị nickname thay vì họ tên thật
        Department: emp.department,
        ClientName: config.CLIENT_NAME || 'Ứng dụng sự kiện IRIS 15 Năm',
        OrgName: config.ORG_NAME || 'Công ty cổ phần giải pháp công nghệ IRIS'
      },
      ClientID: config.CLIENT_ID || 'iris_app'
    };

    try {
      if (!config.SECRET_KEY || !config.IV_KEY) {
        connectingScreen.classList.remove('active');
        alert('Hệ thống chưa được thiết lập khóa bảo mật (SECRET_KEY / IV_KEY). Vui lòng kiểm tra biến môi trường!');
        console.error('Missing SECRET_KEY or IV_KEY in window.APP_CONFIG');
        return;
      }

      const jsonStr = JSON.stringify(payload);
      const secretKey = CryptoJS.enc.Utf8.parse(config.SECRET_KEY);
      const ivKey = CryptoJS.enc.Utf8.parse(config.IV_KEY);

      const encrypted = CryptoJS.AES.encrypt(jsonStr, secretKey, {
        iv: ivKey,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const cipherToken = encrypted.toString();

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(emp));
      } catch (e) {}

      const urlParams = new URLSearchParams(window.location.search);
      const campaignId = urlParams.get('campaignId') || config.DEFAULT_CAMPAIGN_ID || '24';

      const portalBaseUrl = config.PORTAL_URL || 'https://gamezone.minigames.vn/portal/';
      const targetUrl = new URL(portalBaseUrl);
      targetUrl.searchParams.set('campaignId', campaignId);
      targetUrl.searchParams.set('authen', cipherToken);
      targetUrl.searchParams.set('tokenApp', cipherToken);
      targetUrl.searchParams.set('clientID', config.CLIENT_ID || 'iris_app');

      setTimeout(function () {
        window.location.href = targetUrl.toString();
      }, 550);

    } catch (err) {
      console.error('Encryption error:', err);
      connectingScreen.classList.remove('active');
      alert('Đã xảy ra lỗi khi tạo mã bảo mật. Vui lòng thử lại!');
    }
  }

  // 11. Canvas Starfield & Shooting Star
  function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', function () {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const stars = [];
    const count = Math.min(width < 768 ? 45 : 90, 110);

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.35,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.22 + 0.06,
        twinkle: Math.random() * 0.025 + 0.01,
        color: Math.random() > 0.4 ? 'rgba(255, 215, 77,' : 'rgba(255, 255, 255,'
      });
    }

    let shootingStar = null;
    function spawnShootingStar() {
      shootingStar = {
        x: Math.random() * width * 0.8,
        y: Math.random() * height * 0.3,
        len: Math.random() * 85 + 45,
        speed: Math.random() * 6 + 6,
        alpha: 1
      };
    }
    setInterval(spawnShootingStar, 4000);

    function loop() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.y -= s.speed;
        if (s.y < 0) {
          s.y = height;
          s.x = Math.random() * width;
        }

        s.alpha += Math.sin(Date.now() * s.twinkle) * 0.015;
        const a = Math.max(0.15, Math.min(0.85, s.alpha));

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color + a + ')';
        ctx.fill();
      }

      if (shootingStar) {
        ctx.beginPath();
        ctx.moveTo(shootingStar.x, shootingStar.y);
        ctx.lineTo(shootingStar.x + shootingStar.len, shootingStar.y + shootingStar.len * 0.5);
        ctx.strokeStyle = 'rgba(255, 230, 150,' + shootingStar.alpha + ')';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        shootingStar.x += shootingStar.speed;
        shootingStar.y += shootingStar.speed * 0.5;
        shootingStar.alpha -= 0.025;

        if (shootingStar.alpha <= 0) {
          shootingStar = null;
        }
      }

      requestAnimationFrame(loop);
    }

    loop();
  }

  // 12. Canvas Pháo Hoa & Bụi Vàng Ăn Mừng (Celebratory Gold Confetti Burst)
  function initCelebrationCanvas() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    confettiCtx = canvas.getContext('2d');
    confettiWidth = canvas.width = window.innerWidth;
    confettiHeight = canvas.height = window.innerHeight;

    window.addEventListener('resize', function () {
      if (!canvas) return;
      confettiWidth = canvas.width = window.innerWidth;
      confettiHeight = canvas.height = window.innerHeight;
    });
  }

  function triggerCelebration() {
    if (!confettiCtx) return;
    const colors = [
      '#ffe082', '#ffd54f', '#ffca28', '#ffb300', '#ffa000',
      '#fff8e1', '#ffffff', '#e6a724', '#f5b82e'
    ];

    const count = 75;
    const startX = confettiWidth / 2;
    const startY = Math.min(confettiHeight * 0.55, 450);

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const speed = Math.random() * 8.5 + 4.5;
      confettiParticles.push({
        x: startX + (Math.random() - 0.5) * 60,
        y: startY + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 4.5 + 2),
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        shape: Math.random() > 0.35 ? 'rect' : 'circle',
        decay: Math.random() * 0.015 + 0.012
      });
    }

    if (!confettiAnimId) {
      animateConfetti();
    }
  }

  function animateConfetti() {
    if (!confettiCtx) return;
    confettiCtx.clearRect(0, 0, confettiWidth, confettiHeight);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // Gravity
      p.vx *= 0.985; // Air friction
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > confettiHeight) {
        confettiParticles.splice(i, 1);
        continue;
      }

      confettiCtx.save();
      confettiCtx.globalAlpha = Math.max(0, p.alpha);
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.rotation * Math.PI) / 180);
      confettiCtx.fillStyle = p.color;

      if (p.shape === 'rect') {
        confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      } else {
        confettiCtx.beginPath();
        confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        confettiCtx.fill();
      }
      confettiCtx.restore();
    }

    if (confettiParticles.length > 0) {
      confettiAnimId = requestAnimationFrame(animateConfetti);
    } else {
      confettiCtx.clearRect(0, 0, confettiWidth, confettiHeight);
      confettiAnimId = null;
    }
  }
})();
