/* ============================================
   قسم الطاولات — إدارة صالة المطعم
   ============================================ */

const TABLE_STATUS = {
    free: { label: 'متاحة', cls: 'free', icon: 'bi-check-circle' },
    busy: { label: 'مشغولة', cls: 'busy', icon: 'bi-people-fill' },
    reserved: { label: 'محجوزة', cls: 'reserved', icon: 'bi-bookmark-star-fill' },
    cleaning: { label: 'تنظيف', cls: 'cleaning', icon: 'bi-bucket' }
};

let _tableZone = 'all';

function renderTables() {
    const wrap = document.getElementById('tablesContainer');
    if (!wrap) return;
    const tables = getTables();
    const zones = [...new Set(tables.map(t => t.zone))];
    const list = _tableZone === 'all' ? tables : tables.filter(t => t.zone === _tableZone);
    const count = (st) => tables.filter(t => t.status === st).length;

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-grid-3x3-gap stat-icon"></i><div class="stat-label">إجمالي الطاولات</div><div class="stat-value">${tables.length}</div></div>
            <div class="stat green"><i class="bi bi-check-circle stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">متاحة</div><div class="stat-value">${count('free')}</div></div>
            <div class="stat" style="--x:1"><i class="bi bi-people stat-icon"></i><div class="stat-label">مشغولة</div><div class="stat-value">${count('busy')}</div></div>
            <div class="stat gold"><i class="bi bi-bookmark-star stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">محجوزة</div><div class="stat-value">${count('reserved')}</div></div>
        </div>

        <div class="toolbar">
            <div class="filter-pills">
                <span class="pill ${_tableZone === 'all' ? 'active' : ''}" onclick="setTableZone('all')">كل المناطق</span>
                ${zones.map(z => `<span class="pill ${_tableZone === z ? 'active' : ''}" onclick="setTableZone('${z}')">${z}</span>`).join('')}
            </div>
            <div class="spacer"></div>
            <button class="btn btn-primary" data-perm="tables" onclick="guard('tables', () => openTableForm())"><i class="bi bi-plus-lg"></i> طاولة جديدة</button>
        </div>

        <div class="tables-grid">
            ${list.length ? list.map(tableCard).join('') : `<div class="empty-state" style="grid-column:1/-1"><i class="bi bi-grid-3x3-gap"></i><p>لا توجد طاولات</p></div>`}
        </div>`;
    applyPermissions();
}

function tableCard(t) {
    const st = TABLE_STATUS[t.status] || TABLE_STATUS.free;
    const order = t.orderId ? getOrder(t.orderId) : null;
    const mins = t.openedAt ? Math.floor((Date.now() - t.openedAt) / 60000) : 0;
    return `
    <div class="table-card ${st.cls}" onclick="openTableMenu('${t.id}')">
        <div class="tc-top">
            <span class="tc-status"><i class="bi ${st.icon}"></i> ${st.label}</span>
            <span class="tc-seats"><i class="bi bi-person"></i> ${t.seats}</span>
        </div>
        <div class="tc-name">${t.name}</div>
        <div class="tc-zone">${t.zone}</div>
        ${order ? `
            <div class="tc-order">
                <div><i class="bi bi-receipt"></i> طلب #${order.number}</div>
                <div><i class="bi bi-cash"></i> ${moneyNum(order.total)}</div>
                <div><i class="bi bi-clock"></i> ${mins} دقيقة</div>
            </div>` : `<div class="tc-empty">اضغط لإدارة الطاولة</div>`}
    </div>`;
}

function setTableZone(z) { _tableZone = z; renderTables(); }

function openTableMenu(id) {
    const t = getTable(id);
    if (!t) return;
    const order = t.orderId ? getOrder(t.orderId) : null;
    openModalContent(`${t.name} — ${t.zone}`, `
        <div class="row-flex" style="margin-bottom:12px">
            <div class="stat" style="flex:1"><div class="stat-label">الحالة</div><div class="stat-value" style="font-size:16px">${(TABLE_STATUS[t.status] || {}).label}</div></div>
            <div class="stat gold" style="flex:1"><div class="stat-label">الكراسي</div><div class="stat-value" style="font-size:16px">${t.seats}</div></div>
            ${order ? `<div class="stat green" style="flex:1"><div class="stat-label">الطلب الحالي</div><div class="stat-value" style="font-size:16px">#${order.number}</div></div>` : ''}
        </div>
        <div class="field"><label>تغيير الحالة</label>
            <div class="row-flex">
                ${Object.entries(TABLE_STATUS).map(([k, v]) =>
                    `<button class="type-btn ${t.status === k ? 'active' : ''}" style="flex:1" onclick="setTableStatus('${t.id}','${k}')"><i class="bi ${v.icon}"></i> ${v.label}</button>`).join('')}
            </div>
        </div>
        ${order ? `<button class="btn btn-light btn-block" onclick="closeModal('dynModal');viewOrder('${order.id}')"><i class="bi bi-eye"></i> عرض تفاصيل الطلب</button>` : `
        <button class="btn btn-success btn-block" onclick="startOrderOnTable('${t.id}')"><i class="bi bi-cart-plus"></i> بدء طلب على هذه الطاولة</button>`}
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إغلاق</button>
        <button class="btn btn-light" data-perm="tables" onclick="openTableForm('${t.id}')"><i class="bi bi-pencil"></i> تعديل</button>
        <button class="btn btn-danger" data-perm="tables" onclick="delTable('${t.id}')"><i class="bi bi-trash"></i></button>`);
    applyPermissions();
}

function setTableStatus(id, status) {
    const t = getTable(id);
    if (status === 'free' && t.orderId) {
        const o = getOrder(t.orderId);
        if (o && o.status !== 'completed' && o.status !== 'cancelled') {
            if (!confirmAction('الطاولة مرتبطة بطلب نشط — تحرير الطاولة على أي حال؟')) return;
        }
        api.updateTable(id, { status, orderId: null, openedAt: null });
    } else {
        api.updateTable(id, { status, openedAt: status === 'busy' ? (t.openedAt || Date.now()) : t.openedAt });
    }
    closeModal('dynModal');
    renderTables();
    toast('تم تحديث حالة الطاولة', 'success');
}

function startOrderOnTable(id) {
    closeModal('dynModal');
    cartOrderType = 'dine';
    cartTableId = id;
    navigate('pos');
    renderCart();
    toast(`الطلب سيُربط بـ ${getTable(id).name}`, 'info');
}

function openTableForm(id) {
    const t = id ? getTable(id) : null;
    const zones = [...new Set(getTables().map(x => x.zone))];
    openModalContent(t ? 'تعديل الطاولة' : 'طاولة جديدة', `
        <div class="row-flex">
            <div class="field" style="flex:2"><label>اسم / رقم الطاولة</label><input class="input" id="tbName" value="${t?.name || ''}" placeholder="طاولة 9"></div>
            <div class="field" style="flex:1"><label>عدد الكراسي</label><input class="input" id="tbSeats" type="number" value="${t?.seats || 4}"></div>
        </div>
        <div class="field"><label>المنطقة</label>
            <input class="input" id="tbZone" list="zoneList" value="${t?.zone || 'الصالة'}">
            <datalist id="zoneList">${zones.map(z => `<option value="${z}">`).join('')}</datalist>
        </div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-success" style="flex:1" onclick="saveTable(${t ? `'${t.id}'` : 'null'})"><i class="bi bi-check2"></i> حفظ</button>`);
}

function saveTable(id) {
    const name = document.getElementById('tbName').value.trim();
    if (!name) { toast('أدخل اسم الطاولة', 'error'); return; }
    const data = {
        name,
        seats: Number(document.getElementById('tbSeats').value) || 4,
        zone: document.getElementById('tbZone').value.trim() || 'الصالة'
    };
    if (id) api.updateTable(id, data); else api.addTable(data);
    closeModal('dynModal');
    renderTables();
    toast('تم الحفظ ✅', 'success');
}

function delTable(id) {
    if (!confirmAction('حذف هذه الطاولة؟')) return;
    api.deleteTable(id);
    closeModal('dynModal');
    renderTables();
    toast('تم حذف الطاولة', 'success');
}
