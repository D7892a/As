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
    pos: { title: 'نقطة البيع', sub: 'إنشاء طلب جديد وإتمام الدفع' },
    orders: { title: 'الطلبات', sub: 'إدارة ومتابعة جميع الطلبات' },
    products: { title: 'المنتجات', sub: 'إدارة قائمة الطعام والأسعار' },
    categories: { title: 'الأقسام', sub: 'تنظيم المنتجات ضمن أقسام' },
    sales: { title: 'المبيعات', sub: 'سجل المبيعات والإيرادات' },
    customers: { title: 'العملاء', sub: 'قاعدة العملاء ونقاط الولاء' },
    reports: { title: 'التقارير', sub: 'تحليلات وإحصائيات الأداء' },
    settings: { title: 'الإعدادات', sub: 'التحكم بكافة تفاصيل النظام' }
};

function navigate(page) {
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
        pos: () => {}, orders: renderOrders, products: renderProductsPage,
        categories: renderCategories, sales: renderSales, customers: renderCustomers,
        reports: renderReports, settings: renderSettings
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
    const initials = (s.cashierName || '؟').trim().charAt(0);
    document.querySelectorAll('.cashier-avatar').forEach(el => el.textContent = initials);
    document.querySelectorAll('.cashier-name').forEach(el => el.textContent = s.cashierName);
    document.querySelectorAll('.cashier-role').forEach(el => el.textContent = s.cashierRole);
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
