/* ============================================
   التقارير — تحليلات ورسوم بيانية
   ============================================ */

let charts = {}; // حفظ مراجع الرسوم لإتلافها قبل إعادة الرسم

function destroyCharts() {
    Object.values(charts).forEach(c => { try { c.destroy(); } catch (e) {} });
    charts = {};
}

function renderReports() {
    const wrap = document.getElementById('reportsContainer');
    if (!wrap) return;
    destroyCharts();

    const orders = getOrders().filter(o => o.status !== 'cancelled');
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalTax = orders.reduce((s, o) => s + (o.tax || 0), 0);
    const totalDiscount = orders.reduce((s, o) => s + (o.discount || 0), 0);
    const avg = orders.length ? Math.round(totalRevenue / orders.length) : 0;

    // أعلى المنتجات
    const productSales = {};
    orders.forEach(o => o.items.forEach(i => {
        if (!productSales[i.productId]) productSales[i.productId] = { name: i.name, qty: 0, revenue: 0 };
        productSales[i.productId].qty += i.qty;
        productSales[i.productId].revenue += i.price * i.qty;
    }));
    const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 6);

    // المبيعات حسب القسم
    const catSales = {};
    getCategories().forEach(c => catSales[c.id] = { name: c.name, icon: c.icon, color: c.color, revenue: 0 });
    orders.forEach(o => o.items.forEach(i => {
        const p = getProduct(i.productId);
        const catId = p ? p.categoryId : null;
        if (catId && catSales[catId]) catSales[catId].revenue += i.price * i.qty;
    }));
    const catArr = Object.values(catSales).filter(c => c.revenue > 0);

    // المبيعات اليومية (آخر 7 أيام)
    const days = [];
    const dayLabels = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        const next = d.getTime() + 86400000;
        const rev = orders.filter(o => o.createdAt >= d.getTime() && o.createdAt < next).reduce((s, o) => s + o.total, 0);
        days.push(rev);
        dayLabels.push(d.toLocaleDateString('ar-IQ', { weekday: 'short', day: 'numeric' }));
    }

    // أنواع الطلبات
    const typeSales = { dine: 0, take: 0, delivery: 0 };
    orders.forEach(o => { typeSales[o.orderType] = (typeSales[o.orderType] || 0) + o.total; });

    // طرق الدفع
    const paySales = { cash: 0, card: 0, online: 0 };
    orders.forEach(o => { paySales[o.paymentMethod] = (paySales[o.paymentMethod] || 0) + o.total; });

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat gold"><i class="bi bi-cash-stack stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">إجمالي الإيرادات</div><div class="stat-value">${moneyNum(totalRevenue)}</div></div>
            <div class="stat green"><i class="bi bi-receipt stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">عدد الطلبات</div><div class="stat-value">${orders.length}</div></div>
            <div class="stat blue"><i class="bi bi-graph-up-arrow stat-icon" style="color:rgba(37,99,235,.1)"></i><div class="stat-label">متوسط الطلب</div><div class="stat-value">${moneyNum(avg)}</div></div>
            <div class="stat purple"><i class="bi bi-percent stat-icon" style="color:rgba(124,58,237,.1)"></i><div class="stat-label">إجمالي الضريبة</div><div class="stat-value">${moneyNum(totalTax)}</div></div>
        </div>

        <div class="toolbar" style="margin-bottom:18px">
            <button class="btn btn-gold" onclick="exportFullReportPDF()"><i class="bi bi-filetype-pdf"></i> تقرير شامل PDF</button>
            <button class="btn btn-primary" onclick="exportTopProductsPDF()"><i class="bi bi-bar-chart"></i> تقرير المنتجات PDF</button>
        </div>

        <div class="grid grid-2" style="margin-bottom:16px">
            <div class="chart-box">
                <h4><i class="bi bi-graph-up"></i> المبيعات خلال آخر 7 أيام</h4>
                <div class="chart-canvas-wrap"><canvas id="chartSales"></canvas></div>
            </div>
            <div class="chart-box">
                <h4><i class="bi bi-pie-chart"></i> المبيعات حسب القسم</h4>
                <div class="chart-canvas-wrap"><canvas id="chartCat"></canvas></div>
            </div>
        </div>

        <div class="grid grid-2" style="margin-bottom:16px">
            <div class="chart-box">
                <h4><i class="bi bi-trophy"></i> الأكثر مبيعاً</h4>
                ${topProducts.length ? topProducts.map((p, i) => {
                    const colors = ['#d4af37', '#c1272d', '#1a5d3a', '#2563eb', '#7c3aed', '#d97706'];
                    return `<div class="top-product">
                        <div class="tp-rank" style="background:${colors[i] || '#999'}">${i + 1}</div>
                        <div class="tp-info"><div class="n">${p.name}</div><div class="s">${p.qty} مبيع • ${moneyNum(p.revenue)}</div></div>
                        <div class="tp-val">${p.qty}x</div>
                    </div>`;
                }).join('') : '<div class="empty-state"><i class="bi bi-inbox"></i><p>لا توجد بيانات</p></div>'}
            </div>
            <div class="chart-box">
                <h4><i class="bi bi-tags"></i> طرق الطلب والدفع</h4>
                <div class="chart-canvas-wrap" style="height:140px"><canvas id="chartType"></canvas></div>
                <div style="margin-top:14px">
                    ${[['كاش', paySales.cash, 'bi-cash-coin', '#16a34a'], ['بطاقة', paySales.card, 'bi-credit-card', '#2563eb'], ['إلكتروني', paySales.online, 'bi-phone', '#7c3aed'], ['مختلط', paySales.split || 0, 'bi-intersect', '#d97706'], ['عند الاستلام', paySales.cod || 0, 'bi-truck', '#c1272d']].map(([l, v, i, c]) =>
                        `<div class="totals-row"><span><i class="bi ${i}" style="color:${c};margin-left:6px"></i> ${l}</span><strong>${moneyNum(v)}</strong></div>`).join('')}
                </div>
            </div>
        </div>

        ${(() => {
            const zmap = {};
            orders.filter(o => o.orderType === 'delivery').forEach(o => {
                const name = o.zoneName || getZone(o.zoneId)?.name || 'بدون منطقة';
                if (!zmap[name]) zmap[name] = { n: 0, v: 0, fee: 0 };
                zmap[name].n++; zmap[name].v += Number(o.total || 0); zmap[name].fee += Number(o.deliveryFee || 0);
            });
            const zs = Object.entries(zmap).sort((a, b) => b[1].v - a[1].v);
            if (!zs.length) return '';
            return `<div class="card card-pad" style="margin-bottom:16px">
                <h3 style="font-size:15px;font-weight:800;margin-bottom:14px"><i class="bi bi-geo-alt" style="color:var(--primary)"></i> المبيعات حسب منطقة التوصيل</h3>
                ${zs.map(([n, v]) => {
                    const pct = totalRevenue ? Math.round(v.v / totalRevenue * 100) : 0;
                    return `<div style="margin-bottom:10px">
                        <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:5px">
                            <span>${n} (${v.n} طلب)</span><span>${moneyNum(v.v)} • أجور ${moneyNum(v.fee)}</span>
                        </div>
                        <div style="height:10px;background:var(--cream);border-radius:10px;overflow:hidden">
                            <div style="height:100%;width:${pct}%;background:var(--info);border-radius:10px"></div>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
        })()}

        <div class="card card-pad">
            <h3 style="font-size:15px;font-weight:800;margin-bottom:14px"><i class="bi bi-list-check" style="color:var(--primary)"></i> أداء الأقسام</h3>
            ${catArr.length ? catArr.sort((a,b)=>b.revenue-a.revenue).map(c => {
                const pct = totalRevenue ? Math.round(c.revenue / totalRevenue * 100) : 0;
                return `<div style="margin-bottom:12px">
                    <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:5px">
                        <span>${c.icon} ${c.name}</span><span>${moneyNum(c.revenue)} (${pct}%)</span>
                    </div>
                    <div style="height:10px;background:var(--cream);border-radius:10px;overflow:hidden">
                        <div style="height:100%;width:${pct}%;background:${c.color};border-radius:10px;transition:width .6s"></div>
                    </div>
                </div>`;
            }).join('') : '<div class="empty-state"><i class="bi bi-inbox"></i><p>لا توجد بيانات</p></div>'}
        </div>`;

    // رسم المخططات
    setTimeout(() => drawCharts(days, dayLabels, catArr, typeSales), 80);
}

function drawCharts(days, dayLabels, catArr, typeSales) {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = "'Cairo', sans-serif";
    Chart.defaults.rtl = true;

    const ctx1 = document.getElementById('chartSales');
    if (ctx1) charts.sales = new Chart(ctx1, {
        type: 'line',
        data: { labels: dayLabels, datasets: [{ label: 'المبيعات', data: days, borderColor: '#c1272d', backgroundColor: 'rgba(193,39,45,.12)', fill: true, tension: .35, borderWidth: 3, pointBackgroundColor: '#d4af37', pointRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#eee' }, ticks: { callback: v => (v/1000)+'k' } } } }
    });

    const ctx2 = document.getElementById('chartCat');
    if (ctx2) charts.cat = new Chart(ctx2, {
        type: 'doughnut',
        data: { labels: catArr.map(c => c.name), datasets: [{ data: catArr.map(c => c.revenue), backgroundColor: catArr.map(c => c.color), borderWidth: 3, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } } } }
    });

    const ctx3 = document.getElementById('chartType');
    if (ctx3) charts.type = new Chart(ctx3, {
        type: 'bar',
        data: { labels: ['صالة', 'سفري', 'توصيل'], datasets: [{ data: [typeSales.dine, typeSales.take, typeSales.delivery], backgroundColor: ['#c1272d', '#d4af37', '#1a5d3a'], borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#eee' }, ticks: { callback: v => (v/1000)+'k' } } } }
    });
}
