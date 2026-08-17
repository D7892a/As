/* ============================================
   أدوات المدير — التصفير والصيانة وسجل النشاط
   ============================================ */

function renderAdmin() {
    const wrap = document.getElementById('adminContainer');
    if (!wrap) return;
    if (!can('admin')) {
        wrap.innerHTML = `<div class="empty-state"><i class="bi bi-shield-lock"></i><p>هذه الصفحة مخصّصة لمدير النظام فقط</p></div>`;
        return;
    }
    const today = new Date().setHours(0, 0, 0, 0);
    const cancelled = getOrders().filter(o => o.status === 'cancelled').length;
    const todayCount = getOrders().filter(o => o.createdAt >= today).length;

    const tools = [
        { id: 'orders', icon: 'bi-receipt', color: 'danger', title: 'تصفير جميع الطلبات', desc: `حذف ${getOrders().length} طلب من السجل بالكامل`, btn: 'تصفير الطلبات', fn: 'dangerResetOrders()' },
        { id: 'today', icon: 'bi-calendar-x', color: 'warn', title: 'حذف طلبات اليوم', desc: `${todayCount} طلب اليوم`, btn: 'حذف طلبات اليوم', fn: 'dangerResetToday()' },
        { id: 'cancelled', icon: 'bi-x-octagon', color: 'warn', title: 'تنظيف الطلبات الملغاة', desc: `${cancelled} طلب ملغي`, btn: 'حذف الملغاة', fn: 'dangerResetCancelled()' },
        { id: 'counter', icon: 'bi-123', color: 'info', title: 'ضبط عدّاد الطلبات', desc: `العدّاد الحالي: #${DB.orderCounter}`, btn: 'إعادة الترقيم', fn: 'dangerResetCounter()' },
        { id: 'products', icon: 'bi-grid', color: 'danger', title: 'تصفير جميع الوجبات', desc: `حذف ${getProducts().length} وجبة من القائمة`, btn: 'تصفير الوجبات', fn: 'dangerResetProducts()' },
        { id: 'menu', icon: 'bi-arrow-clockwise', color: 'info', title: 'استعادة القائمة الافتراضية', desc: 'إرجاع قائمة الطعام العراقية الأصلية', btn: 'استعادة القائمة', fn: 'dangerRestoreMenu()' },
        { id: 'cats', icon: 'bi-tags', color: 'danger', title: 'تصفير الأقسام والوجبات', desc: `${getCategories().length} قسم`, btn: 'تصفير الأقسام', fn: 'dangerResetCategories()' },
        { id: 'offers', icon: 'bi-stars', color: 'warn', title: 'تصفير العروض', desc: `${getOffers().length} عرض`, btn: 'حذف العروض', fn: 'dangerResetOffers()' },
        { id: 'stock', icon: 'bi-box-seam', color: 'warn', title: 'تصفير المخزون', desc: 'ضبط كميات كل الأصناف على صفر', btn: 'تصفير المخزون', fn: 'dangerResetStock()' },
        { id: 'customers', icon: 'bi-people', color: 'danger', title: 'تصفير العملاء', desc: `${getCustomers().length} عميل (يبقى العميل النقدي)`, btn: 'حذف العملاء', fn: 'dangerResetCustomers()' },
        { id: 'points', icon: 'bi-award', color: 'warn', title: 'تصفير نقاط الولاء', desc: 'إرجاع نقاط جميع العملاء إلى صفر', btn: 'تصفير النقاط', fn: 'dangerResetPoints()' },
        { id: 'expenses', icon: 'bi-wallet2', color: 'warn', title: 'تصفير المصروفات', desc: `${getExpenses().length} قيد مصروف`, btn: 'حذف المصروفات', fn: 'dangerResetExpenses()' },
        { id: 'shifts', icon: 'bi-safe', color: 'warn', title: 'تصفير الورديات', desc: `${getShifts().length} وردية`, btn: 'حذف الورديات', fn: 'dangerResetShifts()' },
        { id: 'deliveries', icon: 'bi-truck', color: 'warn', title: 'تصفير سجل التوصيل', desc: `${getDeliveries().length} طلب توصيل`, btn: 'حذف السجل', fn: 'dangerResetDeliveries()' },
        { id: 'reservations', icon: 'bi-calendar-check', color: 'warn', title: 'تصفير الحجوزات', desc: `${getReservations().length} حجز`, btn: 'حذف الحجوزات', fn: 'dangerResetReservations()' },
        { id: 'purchases', icon: 'bi-receipt-cutoff', color: 'danger', title: 'تصفير المشتريات والذمم', desc: `${getPurchases().length} فاتورة شراء`, btn: 'حذف المشتريات', fn: 'dangerResetPurchases()' },
        { id: 'payroll', icon: 'bi-cash-stack', color: 'danger', title: 'تصفير كشوف الرواتب', desc: `${getPayroll().length} قيد راتب`, btn: 'حذف الرواتب', fn: 'dangerResetPayroll()' },
        { id: 'wastes', icon: 'bi-trash3', color: 'warn', title: 'تصفير سجل الهدر', desc: `${getWastes().length} قيد هدر`, btn: 'حذف السجل', fn: 'dangerResetWastes()' },
        { id: 'feedback', icon: 'bi-chat-heart', color: 'warn', title: 'تصفير التقييمات', desc: `${getFeedback().length} تقييم`, btn: 'حذف التقييمات', fn: 'dangerResetFeedback()' },
        { id: 'all', icon: 'bi-exclamation-octagon-fill', color: 'danger', title: 'إعادة ضبط المصنع', desc: 'حذف كل شيء والعودة لحالة النظام الأولى', btn: 'إعادة ضبط كاملة', fn: 'dangerFactoryReset()' }
    ];

    wrap.innerHTML = `
        <div class="admin-hero">
            <div class="ah-icon"><i class="bi bi-shield-lock-fill"></i></div>
            <div>
                <h2>أدوات مدير النظام</h2>
                <p>صلاحيات كاملة للتحكم بالبيانات — كل عملية تصفير تتطلب تأكيداً برمز المدير ولا يمكن التراجع عنها.</p>
            </div>
            <div class="spacer"></div>
            <button class="btn btn-light" onclick="backupData()"><i class="bi bi-download"></i> نسخة احتياطية قبل التصفير</button>
        </div>

        ${(() => {
            const u = storageUsage(); const ab = getAutoBackupInfo();
            return `<div class="card card-pad" style="margin-bottom:18px">
                <div class="ss-title"><i class="bi bi-hdd"></i> حالة التخزين والنسخ التلقائية</div>
                <div class="kpi-row" style="margin-bottom:12px">
                    <i class="bi bi-hdd-stack"></i>
                    <div style="flex:1">
                        <div class="kpi-top"><span>مساحة البيانات المستخدمة</span><strong>${u.mb} ميغابايت (${u.pct}%)</strong></div>
                        <div class="kpi-bar"><div style="width:${Math.max(3, u.pct)}%"></div></div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px">
                    <i class="bi bi-clock-history" style="color:var(--primary)"></i>
                    <span>${ab ? `آخر نسخة تلقائية: <strong>${fmtDateTime(ab.at)}</strong> (${ab.size} ك.ب)` : 'لم تُحفظ نسخة تلقائية بعد — تُحفظ كل دقيقتين'}</span>
                    <div class="spacer"></div>
                    <button class="btn btn-light btn-sm" onclick="autoBackup();renderAdmin();toast('تم حفظ نسخة تلقائية','success')"><i class="bi bi-save"></i> حفظ نسخة الآن</button>
                    ${ab ? `<button class="btn btn-gold btn-sm" onclick="restoreAutoBackup()"><i class="bi bi-arrow-counterclockwise"></i> استرجاع آخر نسخة</button>` : ''}
                    <button class="btn btn-light btn-sm" onclick="exportOrdersCSV()"><i class="bi bi-filetype-csv"></i> تصدير الطلبات CSV</button>
                    <button class="btn btn-light btn-sm" onclick="exportProductsCSV()"><i class="bi bi-filetype-csv"></i> تصدير الوجبات CSV</button>
                    <button class="btn btn-light btn-sm" onclick="exportCustomersCSV()"><i class="bi bi-filetype-csv"></i> تصدير العملاء CSV</button>
                </div>
            </div>`;
        })()}

        <div class="stats-grid">
            <div class="stat"><i class="bi bi-receipt stat-icon"></i><div class="stat-label">الطلبات</div><div class="stat-value">${getOrders().length}</div></div>
            <div class="stat gold"><i class="bi bi-grid stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">الوجبات</div><div class="stat-value">${getProducts().length}</div></div>
            <div class="stat green"><i class="bi bi-people stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">العملاء</div><div class="stat-value">${getCustomers().length}</div></div>
            <div class="stat blue"><i class="bi bi-stars stat-icon" style="color:rgba(37,99,235,.1)"></i><div class="stat-label">العروض</div><div class="stat-value">${getOffers().length}</div></div>
        </div>

        <div class="danger-grid">
            ${tools.map(t => `
                <div class="danger-card ${t.color}">
                    <div class="dc-top"><i class="bi ${t.icon}"></i></div>
                    <div class="dc-title">${t.title}</div>
                    <div class="dc-desc">${t.desc}</div>
                    <button class="btn btn-sm ${t.color === 'danger' ? 'btn-danger' : t.color === 'warn' ? 'btn-gold' : 'btn-light'} btn-block" onclick="${t.fn}">
                        <i class="bi bi-play-fill"></i> ${t.btn}
                    </button>
                </div>`).join('')}
        </div>

        <div class="card card-pad" style="margin-top:18px">
            <div class="ss-title" style="display:flex;align-items:center">
                <i class="bi bi-clock-history"></i> سجل النشاط
                <div class="spacer"></div>
                <button class="btn btn-light btn-sm" onclick="api.resetActivity();renderAdmin();toast('تم تفريغ السجل','success')"><i class="bi bi-eraser"></i> تفريغ السجل</button>
            </div>
            <div class="activity-list">
                ${(DB.activity || []).slice(0, 40).map(a => `
                    <div class="act-row act-${a.type}">
                        <span class="act-dot"></span>
                        <div class="act-text">${a.text}</div>
                        <div class="act-user">${a.user}</div>
                        <div class="act-time">${fmtDateTime(a.at)}</div>
                    </div>`).join('') || `<div class="empty-state"><i class="bi bi-clock-history"></i><p>لا يوجد نشاط مسجل</p></div>`}
            </div>
        </div>`;
}

/* ============ عمليات التصفير (محميّة برمز المدير) ============ */
function _danger(title, msg, fn) {
    if (!can('admin')) { denied(); return; }
    requireAdminPin(title, msg, () => { fn(); afterDanger(); });
}
function afterDanger() {
    renderAdmin();
    updateOrderBadge();
    if (typeof renderPOS === 'function') renderPOS();
    toast('تم تنفيذ العملية بنجاح ✅', 'success');
}

function dangerResetOrders() {
    _danger('تصفير جميع الطلبات', `سيتم حذف <strong>${getOrders().length}</strong> طلب نهائياً مع تحرير كل الطاولات. لا يمكن التراجع.`, () => {
        const alsoCounter = confirm('هل تريد إعادة عدّاد أرقام الطلبات إلى 1000 أيضاً؟');
        api.resetOrders(alsoCounter);
    });
}
function dangerResetToday() {
    _danger('حذف طلبات اليوم', 'سيتم حذف جميع الطلبات المسجّلة اليوم فقط.', () => api.resetTodayOrders());
}
function dangerResetCancelled() {
    _danger('حذف الطلبات الملغاة', 'سيتم حذف كل الطلبات ذات الحالة «ملغي».', () => api.resetCancelledOrders());
}
function dangerResetCounter() {
    _danger('ضبط عدّاد الطلبات', 'سيبدأ ترقيم الطلبات من جديد.', () => {
        const v = prompt('ابدأ الترقيم من الرقم:', '1000');
        if (v !== null) api.resetCounter(Number(v) || 1000);
    });
}
function dangerResetProducts() {
    _danger('تصفير جميع الوجبات', `سيتم حذف <strong>${getProducts().length}</strong> وجبة من القائمة نهائياً.`, () => api.resetProducts());
}
function dangerRestoreMenu() {
    _danger('استعادة القائمة الافتراضية', 'سيتم استبدال الوجبات والأقسام الحالية بالقائمة العراقية الافتراضية.', () => api.restoreDefaultMenu());
}
function dangerResetCategories() {
    _danger('تصفير الأقسام', 'سيتم حذف جميع الأقسام <strong>وكل الوجبات التابعة لها</strong>.', () => api.resetCategories());
}
function dangerResetOffers() {
    _danger('تصفير العروض', 'سيتم حذف جميع العروض والوجبات المركّبة.', () => api.resetOffers());
}
function dangerResetStock() {
    _danger('تصفير المخزون', 'سيتم ضبط كمية جميع الأصناف على صفر.', () => api.resetStock(0));
}
function dangerResetCustomers() {
    _danger('تصفير العملاء', 'سيتم حذف جميع العملاء ما عدا «عميل نقدي».', () => api.resetCustomers());
}
function dangerResetPoints() {
    _danger('تصفير نقاط الولاء', 'سيتم إرجاع نقاط جميع العملاء إلى صفر.', () => api.resetPoints());
}
function dangerResetExpenses() {
    _danger('تصفير المصروفات', 'سيتم حذف جميع قيود المصروفات.', () => api.resetExpenses());
}
function dangerResetShifts() {
    _danger('تصفير الورديات', 'سيتم حذف سجل جميع الورديات المفتوحة والمغلقة.', () => api.resetShifts());
}
function dangerResetDeliveries() {
    _danger('تصفير سجل التوصيل', 'سيتم حذف جميع طلبات التوصيل المسجّلة (السائقون والمناطق تبقى).', () => api.resetDeliveries());
}
function dangerResetReservations() {
    _danger('تصفير الحجوزات', 'سيتم حذف جميع الحجوزات وتحرير الطاولات المحجوزة.', () => api.resetReservations());
}
function dangerResetPurchases() {
    _danger('تصفير المشتريات', 'سيتم حذف جميع فواتير الشراء وتصفير أرصدة الموردين.', () => api.resetPurchases());
}
function dangerResetPayroll() {
    _danger('تصفير كشوف الرواتب', 'سيتم حذف جميع قيود الرواتب (المصروفات المسجّلة تبقى).', () => api.resetPayroll());
}
function dangerResetWastes() {
    _danger('تصفير سجل الهدر', 'سيتم حذف جميع قيود الهدر والتالف (المخزون لا يُعاد).', () => api.resetWastes());
}
function dangerResetFeedback() {
    _danger('تصفير التقييمات', 'سيتم حذف جميع تقييمات وآراء الزبائن.', () => api.resetFeedback());
}
function dangerFactoryReset() {
    _danger('إعادة ضبط المصنع', '⚠️ سيتم مسح <strong>كل البيانات</strong> (طلبات، وجبات، عملاء، مستخدمين، إعدادات) والعودة للحالة الأولى.', () => {
        api.resetAll();
        setTimeout(() => location.reload(), 600);
    });
}
