/* ============================================
   أدوات الواجهة — إشعارات، نوافذ، مساعدات
   ============================================ */

/* ----- الساعة ----- */
function tickClock() {
    const now = new Date();
    const el = document.getElementById('clock');
    if (el) {
        el.querySelector('.time').textContent = now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        el.querySelector('.date').textContent = now.toLocaleDateString('ar-IQ', { weekday: 'long', day: 'numeric', month: 'long' });
    }
}
setInterval(tickClock, 1000);

/* ----- الإشعارات (Toast) ----- */
function toast(msg, type = 'info', duration = 3200) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle-fill' : type === 'error' ? 'x-circle-fill' : type === 'warning' ? 'exclamation-triangle-fill' : 'info-circle-fill'}"></i><div class="msg">${msg}</div>`;
    wrap.appendChild(t);
    setTimeout(() => { t.classList.add('hide'); setTimeout(() => t.remove(), 300); }, duration);
}

/* ----- النوافذ المنبثقة ----- */
function openModal(id) {
    document.getElementById(id)?.classList.add('show');
    document.body.style.overflow = 'hidden';
}
function closeModal(el) {
    const node = typeof el === 'string' ? document.getElementById(el) : (el?.closest?.('.modal-overlay') || el);
    node?.classList.remove('show');
    if (!document.querySelector('.modal-overlay.show')) document.body.style.overflow = '';
}
// إغلاق عند النقر خارج النافذة
document.addEventListener('click', (e) => {
    if (e.target.classList?.contains('modal-overlay')) closeModal(e.target);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.show').forEach(m => closeModal(m)); });

/* ----- التنقل بين الصفحات ----- */
const PAGE_TITLES = {
    dashboard: { title: 'لوحة القيادة', sub: 'نظرة شاملة ولحظية على أداء المطعم' },
    pos: { title: 'نقطة البيع', sub: 'إنشاء طلب جديد وإتمام الدفع' },
    delivery: { title: 'التوصيل (الدليفري)', sub: 'طلبات التوصيل والسائقون وأسعار المناطق' },
    reservations: { title: 'الحجوزات', sub: 'حجز الطاولات مسبقاً وإدارة الضيوف' },
    suppliers: { title: 'الموردون والمشتريات', sub: 'فواتير الشراء وذمم الموردين' },
    payroll: { title: 'الرواتب والحضور', sub: 'رواتب يومية / أسبوعية / شهرية + الحضور والسلف والهدر' },
    qrmenu: { title: 'المنيو الرقمي والتقييمات', sub: 'رمز QR للمنيو وآراء الزبائن' },
    orders: { title: 'الطلبات', sub: 'إدارة ومتابعة جميع الطلبات' },
    tables: { title: 'الطاولات', sub: 'إدارة صالة المطعم وحالة الطاولات' },
    kitchen: { title: 'شاشة المطبخ', sub: 'متابعة تحضير الطلبات لحظياً' },
    products: { title: 'الوجبات', sub: 'إدارة قائمة الطعام والأسعار' },
    categories: { title: 'الأقسام', sub: 'تنظيم المنتجات ضمن أقسام' },
    offers: { title: 'العروض', sub: 'الوجبات المركّبة وعروض التوفير' },
    inventory: { title: 'المخزون', sub: 'الجرد والكميات وتكلفة الأصناف' },
    sales: { title: 'المبيعات', sub: 'سجل المبيعات والإيرادات' },
    expenses: { title: 'المصروفات', sub: 'تسجيل مصروفات المطعم وصافي الربح' },
    shifts: { title: 'الورديات', sub: 'فتح وتقفيل الصندوق وتقارير Z' },
    customers: { title: 'العملاء', sub: 'قاعدة العملاء ونقاط الولاء' },
    reports: { title: 'التقارير', sub: 'تحليلات وإحصائيات الأداء' },
    users: { title: 'المستخدمون والصلاحيات', sub: 'فريق العمل وحدود كل حساب' },
    admin: { title: 'أدوات المدير', sub: 'التصفير والصيانة وسجل النشاط' },
    settings: { title: 'الإعدادات', sub: 'التحكم بكافة تفاصيل النظام' }
};

/* الصلاحية المطلوبة لكل صفحة */
const PAGE_PERMS = {
    dashboard: 'dashboard', delivery: 'delivery', reservations: 'reservations',
    suppliers: 'suppliers', payroll: 'payroll', qrmenu: 'qrmenu',
    pos: 'pos', orders: 'orders.view', tables: 'tables', kitchen: 'kitchen',
    products: 'products', categories: 'categories', offers: 'offers', inventory: 'inventory',
    sales: 'sales', expenses: 'expenses', shifts: 'shifts', customers: 'customers',
    reports: 'reports', users: 'users', admin: 'admin', settings: 'settings'
};

function navigate(page) {
    // حماية الصفحات بالصلاحيات
    const need = PAGE_PERMS[page];
    if (need && typeof can === 'function' && !can(need)) { denied(); return; }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + page)?.classList.add('active');
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

    const t = PAGE_TITLES[page];
    if (t) {
        document.getElementById('pageTitle').textContent = t.title;
        document.getElementById('pageSub').textContent = t.sub;
    }
    // إعادة رسم الصفحة
    const renderer = {
        dashboard: renderDashboard, delivery: renderDelivery, reservations: renderReservations,
        suppliers: renderSuppliers, payroll: renderPayroll, qrmenu: renderQrMenu,
        pos: renderPOS, orders: renderOrders, tables: renderTables, kitchen: renderKitchen,
        products: renderProductsPage, categories: renderCategories, offers: renderOffers,
        inventory: renderInventory, sales: renderSales, expenses: renderExpenses,
        shifts: renderShifts, customers: renderCustomers, reports: renderReports,
        users: renderUsers, admin: renderAdmin, settings: renderSettings
    };
    renderer[page]?.();

    // تحديث عداد الطلبات في الشريط
    updateOrderBadge();
    // إغلاق قائمة الموبايل
    document.getElementById('sidebar')?.classList.remove('open');
    document.querySelector('.backdrop')?.classList.remove('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateOrderBadge() {
    const active = DB.orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
    const badge = document.querySelector('.nav-item[data-page="orders"] .nav-badge');
    if (badge) badge.textContent = active;
    const ob = document.getElementById('offersBadge');
    if (ob) ob.textContent = getOffers().filter(isOfferLive).length;
    // شارة التوصيل الجارية
    const db_ = document.getElementById('deliveryBadge');
    if (db_) {
        const n = getDeliveries().filter(d => ['pending', 'assigned', 'onway'].includes(d.status)).length;
        db_.textContent = n;
        db_.style.display = n ? '' : 'none';
    }
    // شارة حجوزات اليوم
    const rb = document.getElementById('resBadge');
    if (rb) {
        const today = new Date().toISOString().slice(0, 10);
        const n = getReservations().filter(r => r.date === today && r.status === 'booked').length;
        rb.textContent = n;
        rb.style.display = n ? '' : 'none';
    }
}

/* ----- تحديث اسم الكاشير والمطعم في الواجهة ----- */
function refreshBranding() {
    const s = getSettings();
    // اسم المطعم في الشريط الجانبي
    document.querySelectorAll('.brand-name').forEach(el => el.textContent = s.restaurantName);
    document.querySelectorAll('.brand-slogan').forEach(el => el.textContent = s.slogan);
    // شعار المطعم
    const logoHtml = s.restaurantLogo
        ? `<img src="${s.restaurantLogo}" alt="logo">`
        : '🍽️';
    document.querySelectorAll('.brand-logo').forEach(el => el.innerHTML = logoHtml);
    document.querySelectorAll('.login-logo').forEach(el => el.innerHTML = logoHtml);
    // الكاشير
    const u = (typeof currentUser === 'function' && currentUser()) ? currentUser() : null;
    const name = u ? u.name : s.cashierName;
    const role = u ? (ROLE_LABEL[u.role] || u.jobTitle || s.cashierRole) : s.cashierRole;
    const initials = u && u.avatar ? u.avatar : (name || '؟').trim().charAt(0);
    document.querySelectorAll('.cashier-avatar').forEach(el => el.textContent = initials);
    document.querySelectorAll('.cashier-name').forEach(el => el.textContent = name);
    document.querySelectorAll('.cashier-role').forEach(el => el.textContent = role);
}

/* ----- ضغط الصور (Base64) قبل التخزين ----- */
function compressImage(file, maxSize = 480, quality = 0.78) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) { reject(new Error('ملف غير صالح')); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > height && width > maxSize) { height = height * maxSize / width; width = maxSize; }
                else if (height > maxSize) { width = width * maxSize / height; height = maxSize; }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject(new Error('فشل قراءة الصورة'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('فشل القراءة'));
        reader.readAsDataURL(file);
    });
}

/* ربط رفع صورة حيّ (استخدام تفويض الأحداث ليبقى فعالاً بعد استبدال innerHTML) */
function bindImageUpload(containerSel, onPick) {
    document.querySelectorAll(containerSel).forEach(box => {
        if (box._imgBound) return; // منع الربط المكرر
        box._imgBound = true;
        box.addEventListener('change', async (e) => {
            const input = box.querySelector('input[type="file"]');
            if (!input || e.target !== input) return;
            const file = input.files[0];
            if (!file) return;
            try {
                const data = await compressImage(file);
                onPick(box, data);
            } catch (err) { toast(err.message, 'error'); }
        });
        box.addEventListener('click', (ev) => {
            if (ev.target.closest('.clear-img')) return;
            const input = box.querySelector('input[type="file"]');
            if (input) input.click();
        });
    });
}

/* ----- تأكيد ----- */
function confirmAction(msg) { return confirm(msg); }

/* ----- حضور / انصراف من الشريط الجانبي ----- */
function toggleMyClock() {
    const u = currentUser();
    if (!u) return;
    if (!getSettings().enableAttendance) { toast('تسجيل الحضور معطّل من الإعدادات', 'warning'); return; }
    const rec = todayAttendance(u.id);
    if (!rec || !rec.inAt) doMyClock('in');
    else if (!rec.outAt) doMyClock('out');
    else toast('اكتمل دوامك اليوم', 'info');
    refreshClockBtn();
}
function refreshClockBtn() {
    const btn = document.getElementById('clockBtn');
    if (!btn) return;
    const u = currentUser();
    if (!u || getSettings().enableAttendance === false) { btn.style.display = 'none'; return; }
    btn.style.display = '';
    const rec = todayAttendance(u.id);
    if (!rec || !rec.inAt) {
        btn.className = 'btn btn-success btn-block btn-sm';
        btn.innerHTML = '<i class="bi bi-fingerprint"></i> تسجيل حضور';
    } else if (!rec.outAt) {
        btn.className = 'btn btn-gold btn-block btn-sm';
        btn.innerHTML = `<i class="bi bi-box-arrow-right"></i> انصراف • منذ ${fmtTime(rec.inAt)}`;
    } else {
        btn.className = 'btn btn-light btn-block btn-sm';
        btn.innerHTML = `<i class="bi bi-check2-circle"></i> دوام مكتمل ${fmtTime(rec.inAt)}–${fmtTime(rec.outAt)}`;
    }
}

/* ----- تهيئة عامة بعد تحميل DOM ----- */
document.addEventListener('DOMContentLoaded', () => {
    tickClock();
    refreshBranding();
    updateOrderBadge();
    document.querySelector('.menu-toggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
        document.querySelector('.backdrop').classList.toggle('show');
    });
    document.querySelector('.backdrop')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.querySelector('.backdrop').classList.remove('show');
    });
});
