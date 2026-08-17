/* ============================================
   شاشة المطبخ (KDS) — متابعة تحضير الطلبات
   ============================================ */

let _kdsTimer = null;

function renderKitchen() {
    const wrap = document.getElementById('kitchenContainer');
    if (!wrap) return;
    const cols = [
        { key: 'pending', label: 'بانتظار البدء', icon: 'bi-hourglass-split', cls: 'kds-pending' },
        { key: 'preparing', label: 'قيد التحضير', icon: 'bi-fire', cls: 'kds-preparing' },
        { key: 'completed', label: 'جاهزة اليوم', icon: 'bi-check2-circle', cls: 'kds-done' }
    ];
    const today = new Date().setHours(0, 0, 0, 0);
    const todays = getOrders().filter(o => o.createdAt >= today);

    wrap.innerHTML = `
        <div class="toolbar">
            <div class="kds-legend">
                <span><i class="bi bi-clock"></i> تحديث تلقائي كل 15 ثانية</span>
            </div>
            <div class="spacer"></div>
            <button class="btn btn-light" onclick="renderKitchen()"><i class="bi bi-arrow-clockwise"></i> تحديث الآن</button>
        </div>
        <div class="kds-board">
            ${cols.map(c => {
                const list = todays.filter(o => o.status === c.key)
                    .sort((a, b) => a.createdAt - b.createdAt);
                return `
                <div class="kds-col ${c.cls}">
                    <div class="kds-col-head"><i class="bi ${c.icon}"></i> ${c.label} <span class="kds-count">${list.length}</span></div>
                    <div class="kds-col-body">
                        ${list.length ? list.map(kdsCard).join('') : `<div class="kds-empty">لا توجد طلبات</div>`}
                    </div>
                </div>`;
            }).join('')}
        </div>`;

    clearInterval(_kdsTimer);
    _kdsTimer = setInterval(() => {
        if (document.getElementById('page-kitchen')?.classList.contains('active')) renderKitchen();
        else clearInterval(_kdsTimer);
    }, 15000);
}

function kdsCard(o) {
    const mins = Math.floor((Date.now() - o.createdAt) / 60000);
    const urgency = mins >= 20 ? 'late' : mins >= 10 ? 'warn' : '';
    return `
    <div class="kds-card ${urgency}">
        <div class="kc-head">
            <strong>#${o.number}</strong>
            <span class="badge badge-dark">${o.orderTypeLabel || ''}${o.tableName ? ' • ' + o.tableName : ''}</span>
            <span class="kc-time"><i class="bi bi-clock"></i> ${mins} د</span>
        </div>
        <ul class="kc-items">
            ${o.items.map(i => `<li><span class="kc-qty">${i.qty}×</span> ${i.name}</li>`).join('')}
        </ul>
        ${o.notes ? `<div class="kc-note"><i class="bi bi-chat-left-text"></i> ${o.notes}</div>` : ''}
        <div class="kc-actions">
            ${o.status === 'pending' ? `<button class="btn btn-primary btn-sm btn-block" onclick="kdsSet('${o.id}','preparing')"><i class="bi bi-play-fill"></i> بدء التحضير</button>` : ''}
            ${o.status === 'preparing' ? `<button class="btn btn-success btn-sm btn-block" onclick="kdsSet('${o.id}','completed')"><i class="bi bi-check2"></i> الطلب جاهز</button>` : ''}
            ${o.status === 'completed' ? `<button class="btn btn-light btn-sm btn-block" onclick="kdsSet('${o.id}','preparing')"><i class="bi bi-arrow-counterclockwise"></i> إرجاع للتحضير</button>` : ''}
        </div>
    </div>`;
}

function kdsSet(id, status) {
    if (!can('orders.status')) { denied(); return; }
    api.updateOrderStatus(id, status);
    renderKitchen();
    updateOrderBadge();
    toast(status === 'completed' ? 'الطلب جاهز للتقديم ✅' : 'تم تحديث الحالة', 'success', 1600);
}
