/* ============================================
   قسم التوصيل (الدليفري) — السائقون والمناطق
   ============================================ */

const DELIVERY_STATUS = {
    pending:   { label: 'بانتظار سائق', cls: 'badge-warning', icon: 'bi-hourglass-split', color: '#d97706' },
    assigned:  { label: 'مُسند لسائق',  cls: 'badge-info',    icon: 'bi-person-check',    color: '#2563eb' },
    onway:     { label: 'في الطريق',    cls: 'badge-gold',    icon: 'bi-truck',           color: '#d4af37' },
    delivered: { label: 'تم التسليم',   cls: 'badge-success', icon: 'bi-check2-circle',   color: '#16a34a' },
    cancelled: { label: 'ملغي',         cls: 'badge-danger',  icon: 'bi-x-circle',        color: '#dc2626' }
};

let _dlFilter = 'active';
let _dlTab = 'orders'; // orders | drivers | zones

function renderDelivery() {
    const wrap = document.getElementById('deliveryContainer');
    if (!wrap) return;

    const all = getDeliveries();
    const today = new Date().setHours(0, 0, 0, 0);
    const todayList = all.filter(d => d.createdAt >= today);
    const active = all.filter(d => ['pending', 'assigned', 'onway'].includes(d.status));
    const doneToday = todayList.filter(d => d.status === 'delivered');
    const revToday = doneToday.reduce((s, d) => s + Number(d.total || 0), 0);
    const avgMin = doneToday.filter(d => d.deliveredAt).length
        ? Math.round(doneToday.filter(d => d.deliveredAt)
            .reduce((s, d) => s + (d.deliveredAt - d.createdAt) / 60000, 0) / doneToday.filter(d => d.deliveredAt).length)
        : 0;

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-truck stat-icon"></i><div class="stat-label">طلبات جارية الآن</div><div class="stat-value">${active.length}</div></div>
            <div class="stat green"><i class="bi bi-check2-circle stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">تم توصيلها اليوم</div><div class="stat-value">${doneToday.length}</div></div>
            <div class="stat gold"><i class="bi bi-cash-coin stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">إيراد التوصيل اليوم</div><div class="stat-value" style="font-size:20px">${moneyNum(revToday)}</div></div>
            <div class="stat blue"><i class="bi bi-stopwatch stat-icon" style="color:rgba(37,99,235,.1)"></i><div class="stat-label">متوسط زمن التوصيل</div><div class="stat-value">${avgMin} <small style="font-size:13px">دقيقة</small></div></div>
        </div>

        <div class="seg-tabs">
            ${[['orders', 'bi-truck', 'طلبات التوصيل'], ['drivers', 'bi-person-vcard', 'السائقون'], ['zones', 'bi-geo-alt', 'مناطق التوصيل']]
              .map(([k, i, l]) => `<button class="seg ${_dlTab === k ? 'active' : ''}" onclick="setDlTab('${k}')"><i class="bi ${i}"></i> ${l}</button>`).join('')}
        </div>

        <div id="dlBody"></div>`;
    renderDlBody();
}
function setDlTab(t) { _dlTab = t; renderDelivery(); }
function setDlFilter(f) { _dlFilter = f; renderDlBody(); }

function renderDlBody() {
    const box = document.getElementById('dlBody');
    if (!box) return;
    if (_dlTab === 'drivers') return renderDriversTab(box);
    if (_dlTab === 'zones') return renderZonesTab(box);

    let list = getDeliveries();
    if (_dlFilter === 'active') list = list.filter(d => ['pending', 'assigned', 'onway'].includes(d.status));
    else if (_dlFilter !== 'all') list = list.filter(d => d.status === _dlFilter);

    box.innerHTML = `
        <div class="toolbar">
            <div class="filter-pills">
                ${[['active', 'الجارية'], ['pending', 'بانتظار سائق'], ['onway', 'في الطريق'], ['delivered', 'مُسلّمة'], ['all', 'الكل']]
                  .map(([k, l]) => `<span class="pill ${_dlFilter === k ? 'active' : ''}" onclick="setDlFilter('${k}')">${l}</span>`).join('')}
            </div>
            <div class="spacer"></div>
            <button class="btn btn-light" onclick="printDeliveryReport()"><i class="bi bi-printer"></i> تقرير التوصيل</button>
            <button class="btn btn-primary" data-perm="delivery" onclick="guard('delivery', () => openDeliveryForm())"><i class="bi bi-plus-lg"></i> طلب توصيل يدوي</button>
        </div>

        <div class="delivery-grid">
            ${list.length ? list.map(deliveryCard).join('')
              : `<div class="empty-state" style="grid-column:1/-1"><i class="bi bi-truck"></i><p>لا توجد طلبات توصيل</p></div>`}
        </div>`;
    applyPermissions();
}

function deliveryCard(d) {
    const st = DELIVERY_STATUS[d.status] || DELIVERY_STATUS.pending;
    const dr = d.driverId ? getDriver(d.driverId) : null;
    const zone = d.zoneId ? getZone(d.zoneId) : null;
    const mins = Math.floor((Date.now() - d.createdAt) / 60000);
    const late = ['pending', 'assigned', 'onway'].includes(d.status) && mins > (zone?.minutes || 30);
    return `
    <div class="dl-card ${late ? 'late' : ''}" style="--st:${st.color}">
        <div class="dl-head">
            <span class="dl-num">#${d.orderNumber || '—'}</span>
            <span class="badge ${st.cls}"><i class="bi ${st.icon}"></i> ${st.label}</span>
        </div>
        <div class="dl-body">
            <div class="dl-row"><i class="bi bi-person"></i> <strong>${d.customerName || 'عميل'}</strong></div>
            <div class="dl-row" style="direction:ltr;justify-content:flex-end"><span>${d.phone || '-'}</span> <i class="bi bi-telephone"></i></div>
            <div class="dl-row"><i class="bi bi-geo-alt"></i> ${zone ? zone.name + ' — ' : ''}${d.address || 'بدون عنوان'}</div>
            <div class="dl-row"><i class="bi bi-person-vcard"></i> ${dr ? dr.name : '<span style="color:var(--danger)">لم يُسند بعد</span>'}</div>
            <div class="dl-row"><i class="bi bi-clock-history"></i> منذ ${mins} دقيقة ${late ? '<span class="dl-late">متأخر!</span>' : ''}</div>
        </div>
        <div class="dl-money">
            <div><span>قيمة الطلب</span><strong>${moneyNum(d.total)}</strong></div>
            <div><span>أجرة التوصيل</span><strong>${moneyNum(d.fee)}</strong></div>
        </div>
        <div class="dl-actions">
            ${d.status === 'pending' ? `<button class="btn btn-primary btn-sm" style="flex:1" data-perm="delivery" onclick="openAssignDriver('${d.id}')"><i class="bi bi-person-plus"></i> إسناد سائق</button>` : ''}
            ${d.status === 'assigned' ? `<button class="btn btn-gold btn-sm" style="flex:1" data-perm="delivery" onclick="guard('delivery',()=>{api.setDeliveryStatus('${d.id}','onway');renderDelivery();toast('انطلق السائق 🚗','info')})"><i class="bi bi-truck"></i> خرج للتوصيل</button>` : ''}
            ${d.status === 'onway' ? `<button class="btn btn-success btn-sm" style="flex:1" data-perm="delivery" onclick="guard('delivery',()=>{api.setDeliveryStatus('${d.id}','delivered');renderDelivery();toast('تم التسليم ✅','success')})"><i class="bi bi-check2-circle"></i> تم التسليم</button>` : ''}
            ${['pending', 'assigned', 'onway'].includes(d.status) ? `<button class="icon-btn" style="width:34px;height:34px;font-size:14px" data-perm="delivery" onclick="guard('delivery',()=>{if(confirmAction('إلغاء طلب التوصيل؟')){api.setDeliveryStatus('${d.id}','cancelled');renderDelivery()}})" title="إلغاء"><i class="bi bi-x-lg"></i></button>` : ''}
            ${d.orderId ? `<button class="icon-btn" style="width:34px;height:34px;font-size:14px" onclick="viewOrder('${d.orderId}')" title="عرض الطلب"><i class="bi bi-receipt"></i></button>` : ''}
        </div>
    </div>`;
}

/* ----- إسناد سائق ----- */
function openAssignDriver(deliveryId) {
    const d = getDelivery(deliveryId); if (!d) return;
    const drivers = getDrivers().filter(x => x.active !== false);
    if (!drivers.length) { toast('أضف سائقاً أولاً من تبويب السائقين', 'warning'); return; }
    const busy = (id) => getDeliveries().filter(x => x.driverId === id && ['assigned', 'onway'].includes(x.status)).length;
    openModalContent(`إسناد الطلب #${d.orderNumber || '-'} لسائق`, `
        <div class="picker-list">
            ${drivers.map(dr => `
                <div class="picker-row" onclick="doAssignDriver('${d.id}','${dr.id}')">
                    <div class="cell-thumb" style="background:var(--cream-2)"><i class="bi bi-person-vcard"></i></div>
                    <div class="cl-info">
                        <div class="cl-name">${dr.name}</div>
                        <div class="cl-price">${dr.vehicle} • ${dr.phone}</div>
                    </div>
                    <span class="badge ${busy(dr.id) ? 'badge-warning' : 'badge-success'}">${busy(dr.id) ? busy(dr.id) + ' طلب جاري' : 'متاح'}</span>
                </div>`).join('')}
        </div>`);
}
function doAssignDriver(dlId, drId) {
    api.assignDriver(dlId, drId);
    closeModal('dynModal');
    renderDelivery();
    toast('تم إسناد الطلب للسائق ✅', 'success');
}

/* ----- إنشاء / تعديل طلب توصيل يدوي ----- */
function openDeliveryForm(id) {
    const d = id ? getDelivery(id) : null;
    openModalContent(d ? 'تعديل طلب توصيل' : 'طلب توصيل يدوي', `
        <div class="row-flex">
            <div class="field" style="flex:1"><label>اسم العميل *</label><input class="input" id="dlName" value="${d ? d.customerName : ''}" placeholder="اسم المستلم"></div>
            <div class="field" style="flex:1"><label>رقم الهاتف</label><input class="input" id="dlPhone" value="${d ? d.phone : ''}" style="direction:ltr;text-align:right" placeholder="0770 000 0000"></div>
        </div>
        <div class="field"><label>المنطقة</label>
            <select class="input" id="dlZone" onchange="dlZoneChanged()">
                <option value="">— اختر منطقة —</option>
                ${getZones().map(z => `<option value="${z.id}" data-fee="${z.fee}" ${d && d.zoneId === z.id ? 'selected' : ''}>${z.name} — ${moneyNum(z.fee)} (${z.minutes} د)</option>`).join('')}
            </select>
        </div>
        <div class="field"><label>العنوان التفصيلي</label><textarea class="input" id="dlAddr" placeholder="محلة / زقاق / دار / أقرب نقطة دالة">${d ? d.address : ''}</textarea></div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>قيمة الطلب (د.ع)</label><input class="input" id="dlTotal" type="number" value="${d ? d.total : 0}"></div>
            <div class="field" style="flex:1"><label>أجرة التوصيل (د.ع)</label><input class="input" id="dlFee" type="number" value="${d ? d.fee : (getSettings().defaultDeliveryFee || 0)}"></div>
        </div>
        <div class="field"><label>ملاحظة</label><input class="input" id="dlNote" value="${d ? d.note : ''}" placeholder="ملاحظات للسائق"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" style="flex:1" onclick="saveDelivery('${id || ''}')"><i class="bi bi-check2"></i> حفظ</button>`);
}
function dlZoneChanged() {
    const sel = document.getElementById('dlZone');
    const fee = sel.selectedOptions[0]?.dataset.fee;
    if (fee !== undefined) document.getElementById('dlFee').value = fee;
}
function saveDelivery(id) {
    const name = document.getElementById('dlName').value.trim();
    if (!name) { toast('أدخل اسم العميل', 'error'); return; }
    const data = {
        customerName: name,
        phone: document.getElementById('dlPhone').value.trim(),
        zoneId: document.getElementById('dlZone').value || null,
        address: document.getElementById('dlAddr').value.trim(),
        total: Number(document.getElementById('dlTotal').value) || 0,
        fee: Number(document.getElementById('dlFee').value) || 0,
        note: document.getElementById('dlNote').value.trim()
    };
    if (id) api.updateDelivery(id, data);
    else api.addDelivery({ ...data, orderNumber: '—', status: 'pending' });
    closeModal('dynModal'); renderDelivery();
    toast('تم الحفظ ✅', 'success');
}

/* ============ تبويب السائقين ============ */
function renderDriversTab(box) {
    const drivers = getDrivers();
    const stats = (id) => {
        const list = getDeliveries().filter(d => d.driverId === id && d.status === 'delivered');
        return { count: list.length, fees: list.reduce((s, d) => s + Number(d.fee || 0), 0) };
    };
    box.innerHTML = `
        <div class="toolbar">
            <div class="spacer"></div>
            <button class="btn btn-primary" data-perm="delivery" onclick="guard('delivery', () => openDriverForm())"><i class="bi bi-plus-lg"></i> سائق جديد</button>
        </div>
        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>السائق</th><th>الهاتف</th><th>المركبة</th><th>الرقم</th><th>طلبات مُسلّمة</th><th>إجمالي الأجور</th><th>العمولة/طلب</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                    <tbody>${drivers.length ? drivers.map(d => {
                        const s = stats(d.id);
                        return `<tr>
                            <td><div class="cell-main"><div class="cell-thumb" style="background:linear-gradient(135deg,var(--info),#1e40af);color:#fff"><i class="bi bi-person-vcard"></i></div><strong>${d.name}</strong></div></td>
                            <td style="direction:ltr;text-align:right">${d.phone || '-'}</td>
                            <td>${d.vehicle}</td>
                            <td>${d.plate || '-'}</td>
                            <td><strong>${s.count}</strong></td>
                            <td><strong style="color:var(--success)">${moneyNum(s.fees)}</strong></td>
                            <td>${moneyNum(d.commission)}</td>
                            <td><span class="badge ${d.active !== false ? 'badge-success' : 'badge-dark'}">${d.active !== false ? 'نشط' : 'موقوف'}</span></td>
                            <td><div style="display:flex;gap:5px">
                                <button class="icon-btn" style="width:32px;height:32px;font-size:14px" onclick="openDriverForm('${d.id}')"><i class="bi bi-pencil"></i></button>
                                <button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#fee2e2;color:#b91c1c;border-color:#fecaca" onclick="delDriver('${d.id}')"><i class="bi bi-trash"></i></button>
                            </div></td>
                        </tr>`;
                    }).join('') : `<tr><td colspan="9"><div class="empty-state"><i class="bi bi-person-vcard"></i><p>لا يوجد سائقون</p></div></td></tr>`}</tbody>
                </table>
            </div>
        </div>`;
    applyPermissions();
}
function openDriverForm(id) {
    const d = id ? getDriver(id) : null;
    openModalContent(d ? 'تعديل سائق' : 'سائق جديد', `
        <div class="row-flex">
            <div class="field" style="flex:1"><label>الاسم *</label><input class="input" id="drName" value="${d ? d.name : ''}"></div>
            <div class="field" style="flex:1"><label>الهاتف</label><input class="input" id="drPhone" value="${d ? d.phone : ''}" style="direction:ltr;text-align:right"></div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>نوع المركبة</label>
                <select class="input" id="drVehicle">
                    ${['دراجة نارية', 'سيارة', 'دراجة هوائية', 'أخرى'].map(v => `<option ${d && d.vehicle === v ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
            </div>
            <div class="field" style="flex:1"><label>رقم المركبة</label><input class="input" id="drPlate" value="${d ? d.plate : ''}"></div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>العمولة لكل طلب (د.ع)</label><input class="input" id="drComm" type="number" value="${d ? d.commission : (getSettings().driverCommission || 0)}"></div>
            <div class="field" style="flex:1"><label>الحالة</label>
                <select class="input" id="drActive"><option value="1" ${!d || d.active !== false ? 'selected' : ''}>نشط</option><option value="0" ${d && d.active === false ? 'selected' : ''}>موقوف</option></select>
            </div>
        </div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" style="flex:1" onclick="saveDriver('${id || ''}')"><i class="bi bi-check2"></i> حفظ</button>`);
}
function saveDriver(id) {
    const name = document.getElementById('drName').value.trim();
    if (!name) { toast('أدخل اسم السائق', 'error'); return; }
    const data = {
        name,
        phone: document.getElementById('drPhone').value.trim(),
        vehicle: document.getElementById('drVehicle').value,
        plate: document.getElementById('drPlate').value.trim(),
        commission: Number(document.getElementById('drComm').value) || 0,
        active: document.getElementById('drActive').value === '1'
    };
    if (id) api.updateDriver(id, data); else api.addDriver(data);
    closeModal('dynModal'); renderDelivery(); toast('تم حفظ بيانات السائق ✅', 'success');
}
function delDriver(id) {
    if (!confirmAction('حذف هذا السائق؟')) return;
    if (api.deleteDriver(id)) { renderDelivery(); toast('تم الحذف', 'success'); }
}

/* ============ تبويب المناطق ============ */
function renderZonesTab(box) {
    const zones = getZones();
    box.innerHTML = `
        <div class="toolbar">
            <div class="spacer"></div>
            <button class="btn btn-primary" data-perm="delivery" onclick="guard('delivery', () => openZoneForm())"><i class="bi bi-plus-lg"></i> منطقة جديدة</button>
        </div>
        <div class="zones-grid">
            ${zones.length ? zones.map(z => {
                const cnt = getDeliveries().filter(d => d.zoneId === z.id && d.status === 'delivered').length;
                return `<div class="zone-card">
                    <div class="zc-icon"><i class="bi bi-geo-alt-fill"></i></div>
                    <div class="zc-name">${z.name}</div>
                    <div class="zc-meta"><span><i class="bi bi-cash"></i> ${moneyNum(z.fee)}</span><span><i class="bi bi-clock"></i> ${z.minutes} د</span></div>
                    <div class="zc-count">${cnt} طلب مُسلّم</div>
                    <div style="display:flex;gap:6px;margin-top:10px">
                        <button class="btn btn-light btn-sm" style="flex:1" onclick="openZoneForm('${z.id}')"><i class="bi bi-pencil"></i> تعديل</button>
                        <button class="btn btn-ghost btn-sm" onclick="delZone('${z.id}')"><i class="bi bi-trash"></i></button>
                    </div>
                </div>`;
            }).join('') : `<div class="empty-state" style="grid-column:1/-1"><i class="bi bi-geo-alt"></i><p>لا توجد مناطق توصيل</p></div>`}
        </div>`;
    applyPermissions();
}
function openZoneForm(id) {
    const z = id ? getZone(id) : null;
    openModalContent(z ? 'تعديل منطقة' : 'منطقة توصيل جديدة', `
        <div class="field"><label>اسم المنطقة *</label><input class="input" id="znName" value="${z ? z.name : ''}" placeholder="مثال: الكرادة"></div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>أجرة التوصيل (د.ع)</label><input class="input" id="znFee" type="number" value="${z ? z.fee : 3000}"></div>
            <div class="field" style="flex:1"><label>الزمن المتوقع (دقيقة)</label><input class="input" id="znMin" type="number" value="${z ? z.minutes : 30}"></div>
        </div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" style="flex:1" onclick="saveZone('${id || ''}')"><i class="bi bi-check2"></i> حفظ</button>`);
}
function saveZone(id) {
    const name = document.getElementById('znName').value.trim();
    if (!name) { toast('أدخل اسم المنطقة', 'error'); return; }
    const data = { name, fee: Number(document.getElementById('znFee').value) || 0, minutes: Number(document.getElementById('znMin').value) || 30 };
    if (id) api.updateZone(id, data); else api.addZone(data);
    closeModal('dynModal'); renderDelivery(); toast('تم الحفظ ✅', 'success');
}
function delZone(id) {
    if (!confirmAction('حذف هذه المنطقة؟')) return;
    api.deleteZone(id); renderDelivery(); toast('تم الحذف', 'success');
}

/* ----- تقرير التوصيل ----- */
function printDeliveryReport() {
    const list = getDeliveries();
    const byDriver = {};
    list.filter(d => d.status === 'delivered').forEach(d => {
        const key = d.driverId || 'none';
        const dr = getDriver(d.driverId);
        if (!byDriver[key]) byDriver[key] = { name: dr ? dr.name : 'بدون سائق', count: 0, fees: 0, sales: 0, commission: dr ? Number(dr.commission || 0) : 0 };
        byDriver[key].count++;
        byDriver[key].fees += Number(d.fee || 0);
        byDriver[key].sales += Number(d.total || 0);
    });
    const rows = Object.values(byDriver).map(v => `<tr>
        <td>${v.name}</td><td>${v.count}</td><td>${moneyNum(v.sales)}</td>
        <td>${moneyNum(v.fees)}</td><td>${moneyNum(v.count * v.commission)}</td></tr>`).join('')
        || `<tr><td colspan="5">لا توجد بيانات</td></tr>`;
    printElement(reportShell('تقرير أداء التوصيل', `
        <table class="rep-tbl">
            <thead><tr><th>السائق</th><th>طلبات مُسلّمة</th><th>قيمة المبيعات</th><th>أجور التوصيل</th><th>مستحق العمولة</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`, 'تفصيل حسب السائق'));
}
