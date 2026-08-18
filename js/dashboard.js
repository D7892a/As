/* ============================================
   لوحة القيادة — نظرة شاملة على أداء المطعم
   ============================================ */

let dashCharts = {};
let _dashRange = 7; // عدد الأيام

function renderDashboard() {
    const wrap = document.getElementById('dashboardContainer');
    if (!wrap) return;
    Object.values(dashCharts).forEach(c => { try { c.destroy(); } catch (e) {} });
    dashCharts = {};

    const now = Date.now();
    const startToday = new Date().setHours(0, 0, 0, 0);
    const startYest = startToday - 86400000;
    const orders = getOrders().filter(o => o.status !== 'cancelled');

    const inRange = (from, to) => orders.filter(o => o.createdAt >= from && o.createdAt < to);
    const todayOrders = inRange(startToday, now + 1);
    const yestOrders = inRange(startYest, startToday);

    const sum = (list) => list.reduce((s, o) => s + Number(o.total || 0), 0);
    const revToday = sum(todayOrders), revYest = sum(yestOrders);
    const growth = revYest ? Math.round((revToday - revYest) / revYest * 100) : (revToday ? 100 : 0);
    const avgToday = todayOrders.length ? Math.round(revToday / todayOrders.length) : 0;

    // التكاليف والأرباح
    const cogsToday = todayOrders.reduce((s, o) => s + (o.items || []).reduce((x, i) => {
        const p = getProduct(i.productId);
        return x + (p ? Number(p.cost || 0) * i.qty : 0);
    }, 0), 0);
    const expToday = getExpenses().filter(e => e.createdAt >= startToday).reduce((s, e) => s + Number(e.amount || 0), 0);
    const profitToday = revToday - cogsToday - expToday;
    const margin = revToday ? Math.round(profitToday / revToday * 100) : 0;

    // حالات تشغيلية
    const activeOrders = getOrders().filter(o => ['pending', 'preparing'].includes(o.status)).length;
    const busyTables = getTables().filter(t => t.status === 'busy').length;
    const tableRate = getTables().length ? Math.round(busyTables / getTables().length * 100) : 0;
    const activeDeliveries = getDeliveries().filter(d => ['pending', 'assigned', 'onway'].includes(d.status)).length;
    const lateDeliveries = getDeliveries().filter(d => ['pending','assigned','onway'].includes(d.status) && Date.now() > Number(d.promisedAt || (d.createdAt + Number(getZone(d.zoneId)?.minutes || 30) * 60000))).length;
    const unsettledCash = getDeliveries().filter(d => d.collectionStatus === 'collected').reduce((s,d)=>s+Number(d.cashToCollect||0),0);
    const heldCarts = getSuspendedCarts().length;
    const unpaidPayroll = getPayroll().filter(p => !p.paid).reduce((s,p)=>s+Number(p.net||0),0);
    const todayRes = getReservations().filter(r => r.date === new Date().toISOString().slice(0, 10) && r.status === 'booked').length;
    const lowStock = getProducts().filter(p => Number(p.stock || 0) <= (getSettings().lowStockQty || 5));
    const openShift = getOpenShift();

    // بيانات الرسوم
    const labels = [], revSeries = [], ordSeries = [];
    for (let i = _dashRange - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        const list = inRange(d.getTime(), d.getTime() + 86400000);
        labels.push(d.toLocaleDateString('ar-IQ', { weekday: 'short', day: 'numeric' }));
        revSeries.push(sum(list));
        ordSeries.push(list.length);
    }
    // ذروة الساعات
    const hours = new Array(24).fill(0);
    orders.filter(o => o.createdAt >= now - _dashRange * 86400000).forEach(o => { hours[new Date(o.createdAt).getHours()] += Number(o.total || 0); });
    const peakHour = hours.indexOf(Math.max(...hours));

    // أفضل المنتجات اليوم
    const ps = {};
    todayOrders.forEach(o => (o.items || []).forEach(i => {
        if (!ps[i.productId]) ps[i.productId] = { name: i.name, qty: 0, rev: 0 };
        ps[i.productId].qty += i.qty; ps[i.productId].rev += i.price * i.qty;
    }));
    const topToday = Object.values(ps).sort((a, b) => b.qty - a.qty).slice(0, 5);

    const alerts = [];
    if (!openShift && getSettings().enableShifts) alerts.push({ t: 'warn', i: 'bi-safe', m: 'لا توجد وردية مفتوحة — افتح وردية لبدء تسجيل الصندوق', a: `navigate('shifts')` });
    if (lowStock.length) alerts.push({ t: 'danger', i: 'bi-box-seam', m: `${lowStock.length} صنف قارب على النفاد أو نفد`, a: `navigate('inventory')` });
    if (lateDeliveries) alerts.push({ t: 'danger', i: 'bi-stopwatch', m: `${lateDeliveries} توصيل متأخر عن الموعد المتوقع`, a: `_dlTab='orders';navigate('delivery')` });
    else if (activeDeliveries) alerts.push({ t: 'info', i: 'bi-truck', m: `${activeDeliveries} طلب توصيل جارٍ الآن`, a: `navigate('delivery')` });
    if (unsettledCash && (can('delivery.settlement') || can('delivery'))) alerts.push({ t: 'warn', i: 'bi-cash-coin', m: `تحصيلات سائقين غير مسوّاة: ${moneyNum(unsettledCash)}`, a: `navigate('delivery');setTimeout(()=>setDlTab('settle'),150)` });
    if (heldCarts && can('pos')) alerts.push({ t: 'info', i: 'bi-inboxes', m: `${heldCarts} طلب كاشير معلّق بانتظار الاسترجاع`, a: `navigate('pos');setTimeout(openSuspendedCarts,100)` });
    if (unpaidPayroll && can('payroll')) alerts.push({ t: 'warn', i: 'bi-people', m: `مستحقات موظفين غير مصروفة: ${moneyNum(unpaidPayroll)}`, a: `navigate('payroll')` });
    if (todayRes) alerts.push({ t: 'info', i: 'bi-calendar-check', m: `${todayRes} حجز مؤكد لهذا اليوم`, a: `navigate('reservations')` });
    const debts = getSuppliers().reduce((s, x) => s + Number(x.balance || 0), 0);
    if (debts) alerts.push({ t: 'warn', i: 'bi-wallet', m: `ذمم مستحقة للموردين: ${moneyNum(debts)}`, a: `navigate('suppliers')` });
    const u = currentUser();
    if (u && getSettings().enableAttendance) {
        const rec = todayAttendance(u.id);
        if (!rec || !rec.inAt) alerts.push({ t: 'warn', i: 'bi-fingerprint', m: 'لم تسجّل حضورك اليوم', a: `toggleMyClock()` });
    }
    const unsettle = getDeliveries().filter(d => d.status === 'delivered' && !d.settled).length;
    if (unsettle) alerts.push({ t: 'warn', i: 'bi-safe2', m: `${unsettle} طلب توصيل بانتظار تسوية السائق`, a: `navigate('delivery');setTimeout(()=>setDlTab('settle'),200)` });

    wrap.innerHTML = `
        <div class="dash-hero">
            <div>
                <h2>أهلاً ${currentUser()?.name || ''} 👋</h2>
                <p>هذه نظرة سريعة على أداء ${getSettings().restaurantName} اليوم — ${new Date().toLocaleDateString('ar-IQ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div class="spacer"></div>
            <div class="dash-hero-actions">
                <button class="btn btn-gold" data-perm="pos" onclick="navigate('pos')"><i class="bi bi-shop-window"></i> بدء طلب</button>
                <button class="btn btn-light" data-perm="reports" onclick="navigate('reports')"><i class="bi bi-bar-chart-line"></i> التقارير</button>
            </div>
        </div>

        ${alerts.length ? `<div class="alert-strip">
            ${alerts.map(a => `<div class="alert-chip ${a.t}" onclick="${a.a}"><i class="bi ${a.i}"></i> ${a.m}</div>`).join('')}
        </div>` : ''}

        <div class="stats-grid">
            <div class="stat gold">
                <i class="bi bi-cash-stack stat-icon" style="color:rgba(212,175,55,.1)"></i>
                <div class="stat-label">إيراد اليوم</div>
                <div class="stat-value" style="font-size:23px">${moneyNum(revToday)}</div>
                <div class="stat-trend ${growth >= 0 ? 'up' : 'down'}"><i class="bi bi-arrow-${growth >= 0 ? 'up' : 'down'}-right"></i> ${Math.abs(growth)}% مقارنة بالأمس</div>
            </div>
            <div class="stat green">
                <i class="bi bi-receipt stat-icon" style="color:rgba(22,163,74,.1)"></i>
                <div class="stat-label">طلبات اليوم</div>
                <div class="stat-value">${todayOrders.length}</div>
                <div class="stat-trend">متوسط الفاتورة ${moneyNum(avgToday)}</div>
            </div>
            <div class="stat blue">
                <i class="bi bi-graph-up-arrow stat-icon" style="color:rgba(37,99,235,.1)"></i>
                <div class="stat-label">صافي الربح اليوم</div>
                <div class="stat-value" style="font-size:22px;color:${profitToday >= 0 ? 'var(--success)' : 'var(--danger)'}">${moneyNum(profitToday)}</div>
                <div class="stat-trend">هامش ${margin}% • مصاريف ${moneyNum(expToday)}</div>
            </div>
            <div class="stat purple">
                <i class="bi bi-fire stat-icon" style="color:rgba(124,58,237,.1)"></i>
                <div class="stat-label">قيد التحضير الآن</div>
                <div class="stat-value">${activeOrders}</div>
                <div class="stat-trend">إشغال الصالة ${tableRate}%</div>
            </div>
        </div>

        <div class="grid grid-2" style="margin-bottom:16px">
            <div class="chart-box">
                <h4><i class="bi bi-graph-up"></i> الإيرادات والطلبات
                    <span style="float:left;display:flex;gap:5px">
                        ${[7, 14, 30].map(d => `<span class="pill ${_dashRange === d ? 'active' : ''}" onclick="setDashRange(${d})">${d} يوم</span>`).join('')}
                    </span>
                </h4>
                <div class="chart-canvas-wrap"><canvas id="dashRevChart"></canvas></div>
            </div>
            <div class="chart-box">
                <h4><i class="bi bi-clock-history"></i> ذروة المبيعات حسب الساعة <span class="badge badge-gold" style="float:left">الذروة ${peakHour}:00</span></h4>
                <div class="chart-canvas-wrap"><canvas id="dashHourChart"></canvas></div>
            </div>
        </div>

        <div class="grid grid-2">
            <div class="chart-box">
                <h4><i class="bi bi-trophy"></i> الأكثر مبيعاً اليوم</h4>
                ${topToday.length ? topToday.map((p, i) => `
                    <div class="top-product">
                        <div class="tp-rank" style="background:${['#d4af37','#c1272d','#1a5d3a','#2563eb','#7c3aed'][i]}">${i + 1}</div>
                        <div class="tp-info"><div class="n">${p.name}</div><div class="s">${moneyNum(p.rev)}</div></div>
                        <div class="tp-val">${p.qty}x</div>
                    </div>`).join('') : `<div class="empty-state"><i class="bi bi-inbox"></i><p>لا مبيعات اليوم بعد</p></div>`}
            </div>
            <div class="chart-box">
                <h4><i class="bi bi-speedometer2"></i> مؤشرات تشغيلية</h4>
                <div class="kpi-list">
                    ${kpiRow('bi-grid-3x3-gap', 'الطاولات المشغولة', `${busyTables} / ${getTables().length}`, tableRate)}
                    ${kpiRow('bi-truck', 'طلبات توصيل جارية', activeDeliveries, Math.min(100, activeDeliveries * 20))}
                    ${kpiRow('bi-calendar-check', 'حجوزات اليوم', todayRes, Math.min(100, todayRes * 20))}
                    ${kpiRow('bi-box-seam', 'أصناف تحتاج تزويد', lowStock.length, Math.min(100, lowStock.length * 10))}
                    ${kpiRow('bi-safe', 'حالة الوردية', openShift ? 'مفتوحة' : 'مغلقة', openShift ? 100 : 0)}
                    ${kpiRow('bi-fingerprint', 'حضور اليوم', `${getAttendance().filter(a => a.date === todayKey()).length} / ${getUsers().filter(u => u.active !== false).length}`, Math.round(getAttendance().filter(a => a.date === todayKey()).length / Math.max(1, getUsers().filter(u => u.active !== false).length) * 100))}
                </div>
                ${lowStock.length ? `<div class="low-stock-list">
                    <div class="ss-title" style="margin-top:12px"><i class="bi bi-exclamation-triangle"></i> تحتاج تزويد عاجل</div>
                    ${lowStock.slice(0, 5).map(p => `<div class="ls-row"><span>${p.emoji || '🍽️'} ${p.name}</span><span class="badge ${Number(p.stock||0) <= 0 ? 'badge-danger' : 'badge-warning'}">${Number(p.stock || 0)}</span></div>`).join('')}
                </div>` : ''}
            </div>
        </div>`;

    applyPermissions();
    setTimeout(() => drawDashCharts(labels, revSeries, ordSeries, hours), 60);
}

function kpiRow(icon, label, value, pct) {
    return `<div class="kpi-row">
        <i class="bi ${icon}"></i>
        <div style="flex:1">
            <div class="kpi-top"><span>${label}</span><strong>${value}</strong></div>
            <div class="kpi-bar"><div style="width:${Math.max(3, pct)}%"></div></div>
        </div>
    </div>`;
}
function setDashRange(d) { _dashRange = d; renderDashboard(); }

function drawDashCharts(labels, rev, ords, hours) {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = "'Cairo', sans-serif";
    const c1 = document.getElementById('dashRevChart');
    if (c1) dashCharts.rev = new Chart(c1, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { type: 'line', label: 'الإيراد', data: rev, borderColor: '#c1272d', backgroundColor: 'rgba(193,39,45,.12)', fill: true, tension: .35, borderWidth: 3, pointBackgroundColor: '#d4af37', pointRadius: 4, yAxisID: 'y' },
                { type: 'bar', label: 'الطلبات', data: ords, backgroundColor: 'rgba(212,175,55,.55)', borderRadius: 6, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
            scales: {
                y: { position: 'right', grid: { color: '#eee' }, ticks: { callback: v => (v / 1000) + 'k' } },
                y1: { position: 'left', grid: { display: false } }
            }
        }
    });
    const c2 = document.getElementById('dashHourChart');
    if (c2) dashCharts.hour = new Chart(c2, {
        type: 'bar',
        data: {
            labels: hours.map((_, i) => i + ':00'),
            datasets: [{ data: hours, backgroundColor: hours.map(v => v === Math.max(...hours) && v > 0 ? '#c1272d' : 'rgba(212,175,55,.6)'), borderRadius: 4 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { grid: { color: '#eee' }, ticks: { callback: v => (v / 1000) + 'k' } }, x: { ticks: { font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } } }
        }
    });
}
