/* ============================================
   أدوات القوة — بحث شامل، اختصارات، وضع ليلي، حفظ تلقائي
   ============================================ */

/* ============ 1) الوضع الليلي ============ */
function applyDarkMode(on) {
    document.documentElement.classList.toggle('dark', !!on);
    localStorage.setItem('iq_dark', on ? '1' : '0');
    const btn = document.getElementById('darkBtn');
    if (btn) btn.innerHTML = `<i class="bi bi-${on ? 'sun' : 'moon-stars'}"></i>`;
}
function toggleDarkMode() {
    applyDarkMode(!document.documentElement.classList.contains('dark'));
}

/* ============ 2) لوحة الأوامر / البحث الشامل (Ctrl+K) ============ */
const COMMANDS = [
    { icon: 'bi-speedometer2', label: 'لوحة القيادة', hint: 'صفحة', perm: 'dashboard', run: () => navigate('dashboard') },
    { icon: 'bi-shop-window', label: 'نقطة البيع', hint: 'صفحة', perm: 'pos', run: () => navigate('pos') },
    { icon: 'bi-receipt', label: 'الطلبات', hint: 'صفحة', perm: 'orders.view', run: () => navigate('orders') },
    { icon: 'bi-truck', label: 'التوصيل والسائقون', hint: 'صفحة', perm: 'delivery', run: () => navigate('delivery') },
    { icon: 'bi-calendar-check', label: 'الحجوزات', hint: 'صفحة', perm: 'reservations', run: () => navigate('reservations') },
    { icon: 'bi-grid-3x3-gap', label: 'الطاولات', hint: 'صفحة', perm: 'tables', run: () => navigate('tables') },
    { icon: 'bi-fire', label: 'شاشة المطبخ', hint: 'صفحة', perm: 'kitchen', run: () => navigate('kitchen') },
    { icon: 'bi-grid', label: 'الوجبات', hint: 'صفحة', perm: 'products', run: () => navigate('products') },
    { icon: 'bi-box-seam', label: 'المخزون', hint: 'صفحة', perm: 'inventory', run: () => navigate('inventory') },
    { icon: 'bi-truck-front', label: 'الموردون والمشتريات', hint: 'صفحة', perm: 'suppliers', run: () => navigate('suppliers') },
    { icon: 'bi-cash-stack', label: 'الرواتب والهدر', hint: 'صفحة', perm: 'payroll', run: () => navigate('payroll') },
    { icon: 'bi-qr-code', label: 'المنيو الرقمي والتقييمات', hint: 'صفحة', perm: 'qrmenu', run: () => navigate('qrmenu') },
    { icon: 'bi-bar-chart-line', label: 'التقارير', hint: 'صفحة', perm: 'reports', run: () => navigate('reports') },
    { icon: 'bi-safe', label: 'الورديات', hint: 'صفحة', perm: 'shifts', run: () => navigate('shifts') },
    { icon: 'bi-gear', label: 'الإعدادات', hint: 'صفحة', perm: 'settings', run: () => navigate('settings') },
    { icon: 'bi-plus-circle', label: 'إضافة وجبة جديدة', hint: 'إجراء', perm: 'products', run: () => { navigate('products'); setTimeout(() => openProductForm?.(), 250); } },
    { icon: 'bi-person-plus', label: 'إضافة عميل جديد', hint: 'إجراء', perm: 'customers', run: () => { navigate('customers'); setTimeout(() => openCustomerForm?.(), 250); } },
    { icon: 'bi-calendar-plus', label: 'حجز طاولة جديد', hint: 'إجراء', perm: 'reservations', run: () => { navigate('reservations'); setTimeout(() => openResForm?.(), 250); } },
    { icon: 'bi-truck', label: 'طلب توصيل يدوي', hint: 'إجراء', perm: 'delivery', run: () => { navigate('delivery'); setTimeout(() => openDeliveryForm?.(), 250); } },
    { icon: 'bi-trash3', label: 'تسجيل هدر / تالف', hint: 'إجراء', perm: 'waste', run: () => { navigate('payroll'); setTimeout(() => { setPrTab('waste'); openWasteForm?.(); }, 250); } },
    { icon: 'bi-download', label: 'نسخة احتياطية الآن', hint: 'إجراء', perm: 'admin', run: () => backupData() },
    { icon: 'bi-moon-stars', label: 'تبديل الوضع الليلي', hint: 'إجراء', perm: null, run: () => toggleDarkMode() },
    { icon: 'bi-box-arrow-right', label: 'تسجيل الخروج', hint: 'إجراء', perm: null, run: () => logout() }
];

let _cmdIndex = 0;
let _cmdResults = [];

function openCommandPalette() {
    if (!currentUser()) return;
    let el = document.getElementById('cmdPalette');
    if (!el) {
        el = document.createElement('div');
        el.id = 'cmdPalette';
        el.className = 'cmd-overlay';
        el.innerHTML = `
            <div class="cmd-box" onclick="event.stopPropagation()">
                <div class="cmd-input-row">
                    <i class="bi bi-search"></i>
                    <input id="cmdInput" placeholder="ابحث عن صفحة، منتج، طلب، عميل، أو نفّذ أمراً..." autocomplete="off">
                    <kbd>ESC</kbd>
                </div>
                <div class="cmd-results" id="cmdResults"></div>
                <div class="cmd-foot">
                    <span><kbd>↑</kbd><kbd>↓</kbd> تنقّل</span>
                    <span><kbd>Enter</kbd> تنفيذ</span>
                    <span><kbd>Ctrl</kbd>+<kbd>K</kbd> فتح البحث</span>
                </div>
            </div>`;
        el.addEventListener('click', closeCommandPalette);
        document.body.appendChild(el);
        document.getElementById('cmdInput').addEventListener('input', (e) => runCommandSearch(e.target.value));
        document.getElementById('cmdInput').addEventListener('keydown', cmdKeyNav);
    }
    el.classList.add('show');
    const input = document.getElementById('cmdInput');
    input.value = '';
    runCommandSearch('');
    setTimeout(() => input.focus(), 30);
}
function closeCommandPalette() {
    document.getElementById('cmdPalette')?.classList.remove('show');
}
function cmdKeyNav(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); _cmdIndex = Math.min(_cmdIndex + 1, _cmdResults.length - 1); paintCmdResults(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); _cmdIndex = Math.max(0, _cmdIndex - 1); paintCmdResults(); }
    else if (e.key === 'Enter') { e.preventDefault(); runCmdAt(_cmdIndex); }
    else if (e.key === 'Escape') closeCommandPalette();
}
function runCommandSearch(q) {
    q = (q || '').trim().toLowerCase();
    const res = [];
    // الأوامر والصفحات
    COMMANDS.filter(c => !c.perm || can(c.perm))
        .filter(c => !q || c.label.toLowerCase().includes(q))
        .slice(0, 8).forEach(c => res.push({ ...c, kind: 'cmd' }));

    if (q) {
        // المنتجات
        getProducts().filter(p => p.name.toLowerCase().includes(q)).slice(0, 5).forEach(p => res.push({
            kind: 'product', icon: 'bi-egg-fried', label: `${p.emoji || ''} ${p.name}`,
            hint: `منتج • ${moneyNum(p.price)}`,
            run: () => { navigate('pos'); setTimeout(() => { if (typeof addToCart === 'function') addToCart(p.id); }, 200); }
        }));
        // الطلبات
        getOrders().filter(o => String(o.number).includes(q) || (o.customerName || '').toLowerCase().includes(q)).slice(0, 5).forEach(o => res.push({
            kind: 'order', icon: 'bi-receipt', label: `طلب #${o.number} — ${o.customerName}`,
            hint: `${moneyNum(o.total)} • ${fmtDate(o.createdAt)}`,
            run: () => { navigate('orders'); setTimeout(() => viewOrder?.(o.id), 200); }
        }));
        // العملاء
        getCustomers().filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q)).slice(0, 4).forEach(c => res.push({
            kind: 'customer', icon: 'bi-person', label: c.name, hint: `عميل • ${c.phone}`,
            run: () => { navigate('customers'); }
        }));
        // السائقون
        getDrivers().filter(d => d.name.toLowerCase().includes(q)).slice(0, 3).forEach(d => res.push({
            kind: 'driver', icon: 'bi-person-vcard', label: d.name, hint: `سائق • ${d.phone}`,
            run: () => { navigate('delivery'); setTimeout(() => setDlTab('drivers'), 150); }
        }));
    }
    _cmdResults = res;
    _cmdIndex = 0;
    paintCmdResults();
}
function paintCmdResults() {
    const box = document.getElementById('cmdResults');
    if (!box) return;
    box.innerHTML = _cmdResults.length ? _cmdResults.map((r, i) => `
        <div class="cmd-row ${i === _cmdIndex ? 'active' : ''}" onclick="runCmdAt(${i})">
            <i class="bi ${r.icon}"></i>
            <span class="cmd-label">${r.label}</span>
            <span class="cmd-hint">${r.hint || ''}</span>
        </div>`).join('') : `<div class="cmd-empty"><i class="bi bi-search"></i> لا توجد نتائج مطابقة</div>`;
    box.querySelector('.cmd-row.active')?.scrollIntoView?.({ block: 'nearest' });
}
function runCmdAt(i) {
    const r = _cmdResults[i];
    if (!r) return;
    closeCommandPalette();
    setTimeout(() => r.run(), 60);
}

/* ============ 3) اختصارات لوحة المفاتيح ============ */
const SHORTCUTS = [
    ['Ctrl + K', 'فتح البحث الشامل ولوحة الأوامر'],
    ['F1', 'نقطة البيع'],
    ['F2', 'الطلبات'],
    ['F3', 'الطاولات'],
    ['F4', 'شاشة المطبخ'],
    ['F5', 'لوحة القيادة'],
    ['F8', 'التوصيل'],
    ['F9', 'إتمام الدفع (داخل نقطة البيع)'],
    ['Ctrl + D', 'تبديل الوضع الليلي'],
    ['Ctrl + B', 'نسخة احتياطية فورية'],
    ['Ctrl + P', 'طباعة آخر إيصال'],
    ['Esc', 'إغلاق النوافذ'],
    ['؟ / Shift+/', 'عرض قائمة الاختصارات']
];

document.addEventListener('keydown', (e) => {
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    // Ctrl+K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCommandPalette(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); toggleDarkMode(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); if (can('admin')) backupData(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        const last = getOrders()[0];
        if (last) { e.preventDefault(); showReceipt(last.id); }
        return;
    }
    if (!currentUser() || typing) return;
    const map = { F1: 'pos', F2: 'orders', F3: 'tables', F4: 'kitchen', F5: 'dashboard', F8: 'delivery' };
    if (map[e.key]) { e.preventDefault(); navigate(map[e.key]); return; }
    if (e.key === 'F9') {
        e.preventDefault();
        if (typeof cart !== 'undefined' && cart.length) openPayment();
        else toast('السلة فارغة', 'warning');
        return;
    }
    if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); showShortcuts(); }
});

function showShortcuts() {
    openModalContent('اختصارات لوحة المفاتيح', `
        <div class="shortcut-grid">
            ${SHORTCUTS.map(([k, d]) => `<div class="sc-row"><kbd>${k}</kbd><span>${d}</span></div>`).join('')}
        </div>`, `<button class="btn btn-primary btn-block" onclick="closeModal('dynModal')">تمام</button>`);
}

/* ============ 4) النسخ الاحتياطي التلقائي ============ */
const AUTO_BACKUP_KEY = 'iq_cashier_autobackup';
function autoBackup() {
    try {
        const snap = { at: Date.now(), data: JSON.stringify(DB) };
        localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(snap));
    } catch (e) { /* الذاكرة ممتلئة — تجاهل */ }
}
function getAutoBackupInfo() {
    try {
        const raw = localStorage.getItem(AUTO_BACKUP_KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        return { at: s.at, size: Math.round(s.data.length / 1024) };
    } catch (e) { return null; }
}
function restoreAutoBackup() {
    const raw = localStorage.getItem(AUTO_BACKUP_KEY);
    if (!raw) { toast('لا توجد نسخة تلقائية محفوظة', 'warning'); return; }
    if (!confirmAction('سيتم استرجاع آخر نسخة تلقائية واستبدال البيانات الحالية. متابعة؟')) return;
    try {
        const snap = JSON.parse(raw);
        DB = JSON.parse(snap.data);
        persist();
        toast('تمت الاستعادة من النسخة التلقائية ✅', 'success');
        setTimeout(() => location.reload(), 700);
    } catch (e) { toast('النسخة التلقائية تالفة', 'error'); }
}
setInterval(() => { if (currentUser()) autoBackup(); }, 120000); // كل دقيقتين

/* ============ 5) مؤشر حجم التخزين ============ */
function storageUsage() {
    let total = 0;
    for (let k in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, k)) total += (localStorage[k] || '').length;
    }
    const kb = total / 1024;
    return { kb: Math.round(kb), mb: (kb / 1024).toFixed(2), pct: Math.min(100, Math.round(kb / 5120 * 100)) };
}

/* ============ 6) تصدير CSV / Excel لأي جدول ============ */
function exportCSV(rows, filename = 'export.csv') {
    if (!rows || !rows.length) { toast('لا توجد بيانات للتصدير', 'warning'); return; }
    const headers = Object.keys(rows[0]);
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '\uFEFF' + [headers.map(esc).join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    toast('تم تصدير الملف ✅', 'success');
}
function exportOrdersCSV() {
    exportCSV(getOrders().map(o => ({
        'رقم الطلب': o.number, 'التاريخ': fmtDateTime(o.createdAt), 'العميل': o.customerName,
        'النوع': o.orderTypeLabel, 'الطاولة': o.tableName || '-', 'عدد الأصناف': (o.items || []).reduce((n, i) => n + i.qty, 0),
        'المجموع الفرعي': o.subtotal, 'الضريبة': o.tax, 'الخصم': o.discount, 'الإجمالي': o.total,
        'طريقة الدفع': o.paymentMethod, 'الحالة': o.status, 'الكاشير': o.cashierName
    })), `orders-${new Date().toISOString().slice(0, 10)}.csv`);
}
function exportProductsCSV() {
    exportCSV(getProducts().map(p => ({
        'الصنف': p.name, 'القسم': getCategory(p.categoryId)?.name || '-', 'السعر': p.price,
        'التكلفة': p.cost || 0, 'الربح': (p.price || 0) - (p.cost || 0), 'المخزون': p.stock || 0,
        'SKU': p.sku || '', 'متوفر': p.available ? 'نعم' : 'لا'
    })), `products-${new Date().toISOString().slice(0, 10)}.csv`);
}
function exportCustomersCSV() {
    exportCSV(getCustomers().map(c => {
        const tier = customerTier(c.id);
        return { 'العميل': c.name, 'الهاتف': c.phone, 'النقاط': c.points || 0, 'إجمالي الإنفاق': tier.spent, 'المستوى': tier.label };
    }), `customers-${new Date().toISOString().slice(0, 10)}.csv`);
}

/* ============ 7) تهيئة ============ */
document.addEventListener('DOMContentLoaded', () => {
    applyDarkMode(localStorage.getItem('iq_dark') === '1');
});
