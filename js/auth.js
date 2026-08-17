/* ============================================
   المستخدمون والصلاحيات — تسجيل الدخول والحماية
   ============================================ */

/* ----- قائمة الصلاحيات القابلة للمنح ----- */
const PERMS = [
    { group: 'العمليات', key: 'pos', label: 'نقطة البيع', desc: 'إنشاء الطلبات وإتمام الدفع', icon: 'bi-shop-window' },
    { group: 'العمليات', key: 'pos.discount', label: 'منح الخصومات', desc: 'تطبيق خصم يدوي على الطلب', icon: 'bi-tag' },
    { group: 'العمليات', key: 'pos.price', label: 'تعديل السعر عند البيع', desc: 'تغيير سعر الصنف داخل السلة', icon: 'bi-pencil-square' },
    { group: 'العمليات', key: 'orders.view', label: 'عرض الطلبات', desc: 'الاطلاع على سجل الطلبات', icon: 'bi-receipt' },
    { group: 'العمليات', key: 'orders.status', label: 'تغيير حالة الطلب', desc: 'تحضير / إكمال الطلبات', icon: 'bi-arrow-repeat' },
    { group: 'العمليات', key: 'orders.cancel', label: 'إلغاء الطلبات', desc: 'إلغاء طلب بعد إنشائه', icon: 'bi-x-circle' },
    { group: 'العمليات', key: 'orders.delete', label: 'حذف الطلبات', desc: 'حذف الطلب نهائياً من السجل', icon: 'bi-trash' },
    { group: 'العمليات', key: 'tables', label: 'إدارة الطاولات', desc: 'فتح وإغلاق ونقل الطاولات', icon: 'bi-grid-3x3-gap' },
    { group: 'العمليات', key: 'kitchen', label: 'شاشة المطبخ', desc: 'متابعة الطلبات قيد التحضير', icon: 'bi-fire' },

    { group: 'القائمة', key: 'products', label: 'إدارة الوجبات', desc: 'إضافة وتعديل وحذف المنتجات', icon: 'bi-grid' },
    { group: 'القائمة', key: 'categories', label: 'إدارة الأقسام', desc: 'تنظيم أقسام القائمة', icon: 'bi-tags' },
    { group: 'القائمة', key: 'offers', label: 'إدارة العروض', desc: 'إنشاء عروض ووجبات مركّبة', icon: 'bi-stars' },
    { group: 'القائمة', key: 'inventory', label: 'إدارة المخزون', desc: 'الجرد وإضافة الكميات', icon: 'bi-box-seam' },

    { group: 'المال', key: 'sales', label: 'سجل المبيعات', desc: 'عرض الإيرادات والمبيعات', icon: 'bi-graph-up-arrow' },
    { group: 'المال', key: 'expenses', label: 'المصروفات', desc: 'تسجيل مصروفات المطعم', icon: 'bi-wallet2' },
    { group: 'المال', key: 'shifts', label: 'الورديات وتقفيل الصندوق', desc: 'فتح وإغلاق الوردية', icon: 'bi-safe' },
    { group: 'المال', key: 'reports', label: 'التقارير والتحليلات', desc: 'الرسوم البيانية وتقارير الأداء', icon: 'bi-bar-chart-line' },

    { group: 'العملاء', key: 'customers', label: 'إدارة العملاء', desc: 'قاعدة العملاء ونقاط الولاء', icon: 'bi-people' },

    { group: 'النظام', key: 'users', label: 'إدارة المستخدمين', desc: 'إضافة كاشير ومنح الصلاحيات', icon: 'bi-person-badge' },
    { group: 'النظام', key: 'settings', label: 'الإعدادات العامة', desc: 'هوية المطعم والضرائب والإيصال', icon: 'bi-gear' },
    { group: 'النظام', key: 'admin', label: 'أدوات المدير (التصفير)', desc: 'تصفير الطلبات والوجبات والبيانات', icon: 'bi-shield-lock' }
];

const PERM_KEYS = PERMS.map(p => p.key);

/* صلاحيات افتراضية لكل دور */
const ROLE_DEFAULTS = {
    admin: PERM_KEYS.reduce((o, k) => (o[k] = true, o), {}),
    manager: {
        pos: true, 'pos.discount': true, 'pos.price': true, 'orders.view': true, 'orders.status': true,
        'orders.cancel': true, 'orders.delete': false, tables: true, kitchen: true,
        products: true, categories: true, offers: true, inventory: true,
        sales: true, expenses: true, shifts: true, reports: true, customers: true,
        users: false, settings: true, admin: false
    },
    cashier: {
        pos: true, 'pos.discount': false, 'pos.price': false, 'orders.view': true, 'orders.status': true,
        'orders.cancel': false, 'orders.delete': false, tables: true, kitchen: true,
        products: false, categories: false, offers: false, inventory: false,
        sales: false, expenses: false, shifts: true, reports: false, customers: true,
        users: false, settings: false, admin: false
    },
    kitchen: {
        pos: false, 'orders.view': true, 'orders.status': true, kitchen: true, tables: true
    }
};

const ROLE_LABEL = { admin: 'مدير النظام', manager: 'مدير مناوب', cashier: 'كاشير', kitchen: 'مطبخ' };
const ROLE_BADGE = { admin: 'badge-danger', manager: 'badge-gold', cashier: 'badge-info', kitchen: 'badge-success' };

/* ----- الجلسة الحالية ----- */
let _CURRENT_USER = null;
function currentUser() { return _CURRENT_USER; }

function effectivePerms(user) {
    if (!user) return {};
    if (user.role === 'admin') return { ...ROLE_DEFAULTS.admin };
    const base = { ...(ROLE_DEFAULTS[user.role] || ROLE_DEFAULTS.cashier) };
    return { ...base, ...(user.perms || {}) };
}

/* هل يملك المستخدم الحالي الصلاحية؟ */
function can(perm) {
    const u = currentUser();
    if (!u) return false;
    if (u.role === 'admin') return true;
    return !!effectivePerms(u)[perm];
}

/* تنفيذ محمي بصلاحية */
function guard(perm, fn) {
    if (!can(perm)) { denied(); return false; }
    if (typeof fn === 'function') fn();
    return true;
}
function denied() {
    toast('🚫 ليس لديك صلاحية لهذا الإجراء — راجع مدير النظام', 'error');
}

/* ============================================
   شاشة الدخول
   ============================================ */
let _loginUserId = null;
let _pinBuffer = '';

function renderLoginScreen() {
    const wrap = document.getElementById('loginUsers');
    if (!wrap) return;
    const users = getUsers().filter(u => u.active !== false);
    wrap.innerHTML = users.map(u => `
        <div class="login-user ${_loginUserId === u.id ? 'active' : ''}" onclick="selectLoginUser('${u.id}')">
            <div class="lu-avatar">${u.avatar || '🧑'}</div>
            <div class="lu-info">
                <div class="lu-name">${u.name}</div>
                <span class="badge ${ROLE_BADGE[u.role] || 'badge-dark'}">${ROLE_LABEL[u.role] || u.role}</span>
            </div>
            <i class="bi bi-chevron-left lu-arrow"></i>
        </div>`).join('');
    document.getElementById('pinPanel').style.display = _loginUserId ? 'block' : 'none';
}

function selectLoginUser(id) {
    _loginUserId = id;
    _pinBuffer = '';
    const u = getUser(id);
    renderLoginScreen();
    const panel = document.getElementById('pinPanel');
    panel.querySelector('.pin-user').textContent = u.name;
    renderPinDots();
    if (!getSettings().requirePin) doLogin();
}

function pinPress(d) {
    if (_pinBuffer.length >= 6) return;
    _pinBuffer += d;
    renderPinDots();
    const u = getUser(_loginUserId);
    if (u && _pinBuffer.length === String(u.pin || '').length) setTimeout(doLogin, 120);
}
function pinClear() { _pinBuffer = ''; renderPinDots(); }
function pinBack() { _pinBuffer = _pinBuffer.slice(0, -1); renderPinDots(); }
function renderPinDots() {
    const dots = document.getElementById('pinDots');
    if (!dots) return;
    dots.innerHTML = Array.from({ length: Math.max(4, _pinBuffer.length) })
        .map((_, i) => `<span class="pin-dot ${i < _pinBuffer.length ? 'filled' : ''}"></span>`).join('');
}

function doLogin() {
    const u = getUser(_loginUserId);
    if (!u) { toast('اختر المستخدم أولاً', 'warning'); return; }
    if (getSettings().requirePin && String(u.pin || '') !== _pinBuffer) {
        toast('الرمز السري غير صحيح ❌', 'error');
        _pinBuffer = ''; renderPinDots();
        document.getElementById('pinPanel')?.classList.add('shake');
        setTimeout(() => document.getElementById('pinPanel')?.classList.remove('shake'), 500);
        return;
    }
    startSession(u);
}

function startSession(u) {
    _CURRENT_USER = u;
    try { localStorage.setItem(SESSION_KEY, u.id); } catch (e) {}
    u.lastLogin = Date.now();
    logActivity('login', `تسجيل دخول: ${u.name}`);
    persist();

    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'flex';
    applyPermissions();
    refreshBranding();
    renderPOS();
    // أول صفحة مسموح بها
    navigate(firstAllowedPage());
    setTimeout(() => toast(`أهلاً ${u.name} 👋 — ${ROLE_LABEL[u.role] || ''}`, 'success'), 250);
}

function firstAllowedPage() {
    const order = [['pos', 'pos'], ['kitchen', 'kitchen'], ['orders', 'orders.view'], ['tables', 'tables'], ['reports', 'reports'], ['settings', 'settings']];
    const f = order.find(([, perm]) => can(perm));
    return f ? f[0] : 'pos';
}

function logout() {
    logActivity('logout', `خروج: ${_CURRENT_USER ? _CURRENT_USER.name : ''}`);
    persist();
    _CURRENT_USER = null;
    _loginUserId = null;
    _pinBuffer = '';
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    document.getElementById('appShell').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    renderLoginScreen();
}

/* استعادة الجلسة عند إعادة التحميل */
function restoreSession() {
    let id = null;
    try { id = localStorage.getItem(SESSION_KEY); } catch (e) {}
    const u = id ? getUser(id) : null;
    if (u && u.active !== false) { _loginUserId = u.id; startSession(u); return true; }
    renderLoginScreen();
    return false;
}

/* ============================================
   تطبيق الصلاحيات على الواجهة
   ============================================ */
function applyPermissions() {
    const u = currentUser();
    if (!u) return;
    document.querySelectorAll('[data-perm]').forEach(el => {
        const need = el.dataset.perm;
        const ok = need.split('|').some(p => can(p.trim()));
        el.style.display = ok ? '' : 'none';
    });
    // إخفاء عناوين المجموعات الفارغة
    document.querySelectorAll('.nav-group').forEach(g => {
        const visible = [...g.querySelectorAll('.nav-item')].some(n => n.style.display !== 'none');
        g.style.display = visible ? '' : 'none';
    });
    // شارة الدور
    document.querySelectorAll('.cashier-role').forEach(el => el.textContent = ROLE_LABEL[u.role] || u.jobTitle || '');
    const chip = document.getElementById('roleChip');
    if (chip) {
        chip.className = 'badge ' + (ROLE_BADGE[u.role] || 'badge-dark');
        chip.innerHTML = `<i class="bi ${u.role === 'admin' ? 'bi-shield-lock-fill' : 'bi-person-badge'}"></i> ${ROLE_LABEL[u.role] || u.role}`;
    }
}

/* ============================================
   تأكيد بالرمز السري للمدير (للعمليات الخطرة)
   ============================================ */
function requireAdminPin(title, message, onOk) {
    if (!getSettings().requirePin) { if (confirmAction(message)) onOk(); return; }
    openModalContent(title, `
        <div class="danger-confirm">
            <div class="dc-icon"><i class="bi bi-shield-exclamation"></i></div>
            <p class="dc-msg">${message}</p>
            <div class="field" style="max-width:260px;margin:0 auto">
                <label style="text-align:center;display:block">أدخل رمز المدير للتأكيد</label>
                <input class="input pin-input" id="adminPinInput" type="password" inputmode="numeric" placeholder="••••"
                       style="text-align:center;letter-spacing:8px;font-size:20px" autocomplete="off">
            </div>
        </div>`, `
        <button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-danger" style="flex:1" onclick="_verifyAdminPin()"><i class="bi bi-check2-circle"></i> تأكيد التنفيذ</button>`);
    window._adminPinCb = onOk;
    setTimeout(() => {
        const el = document.getElementById('adminPinInput');
        el?.focus();
        el?.addEventListener('keydown', e => { if (e.key === 'Enter') _verifyAdminPin(); });
    }, 120);
}
function _verifyAdminPin() {
    const pin = document.getElementById('adminPinInput')?.value || '';
    const admins = getUsers().filter(u => u.role === 'admin');
    const ok = admins.some(a => String(a.pin) === pin) || (currentUser() && String(currentUser().pin) === pin && can('admin'));
    if (!ok) { toast('رمز المدير غير صحيح ❌', 'error'); return; }
    closeModal('dynModal');
    const cb = window._adminPinCb;
    window._adminPinCb = null;
    if (typeof cb === 'function') cb();
}

/* لوحة مفاتيح الدخول بالكيبورد */
document.addEventListener('keydown', (e) => {
    const login = document.getElementById('loginScreen');
    if (!login || login.style.display === 'none' || !_loginUserId) return;
    if (/^[0-9]$/.test(e.key)) pinPress(e.key);
    else if (e.key === 'Backspace') pinBack();
    else if (e.key === 'Enter') doLogin();
});
