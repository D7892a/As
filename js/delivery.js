/* ============================================
   قسم التوصيل (الدليفري) — السائقون والمناطق والتسويات
   ============================================ */

const DELIVERY_STATUS = {
    pending:   { label: 'بانتظار سائق', cls: 'badge-warning', icon: 'bi-hourglass-split', color: '#d97706' },
    assigned:  { label: 'مُسند لسائق',  cls: 'badge-info',    icon: 'bi-person-check',    color: '#2563eb' },
    onway:     { label: 'في الطريق',    cls: 'badge-gold',    icon: 'bi-truck',           color: '#d4af37' },
    delivered: { label: 'تم التسليم',   cls: 'badge-success', icon: 'bi-check2-circle',   color: '#16a34a' },
    failed:    { label: 'تعذّر التسليم', cls: 'badge-danger', icon: 'bi-exclamation-octagon', color: '#b45309' },
    returned:  { label: 'راجع المطعم',  cls: 'badge-dark',    icon: 'bi-arrow-return-right', color: '#57534e' },
    cancelled: { label: 'ملغي',         cls: 'badge-danger',  icon: 'bi-x-circle',        color: '#dc2626' }
};

let _dlFilter = 'active';
let _dlTab = 'orders'; // orders | drivers | zones | settle | stats

function renderDelivery() {
    const wrap = document.getElementById('deliveryContainer');
    if (!wrap) return;

    const all = getDeliveries();
    const today = new Date().setHours(0, 0, 0, 0);
    const todayList = all.filter(d => d.createdAt >= today);
    const active = all.filter(d => ['pending', 'assigned', 'onway'].includes(d.status));
    const doneToday = todayList.filter(d => d.status === 'delivered');
    const revToday = doneToday.reduce((s, d) => s + Number(d.total || 0), 0);
    const feesToday = doneToday.reduce((s, d) => s + Number(d.fee || 0), 0);
    const avgMin = doneToday.filter(d => d.deliveredAt).length
        ? Math.round(doneToday.filter(d => d.deliveredAt)
            .reduce((s, d) => s + (d.deliveredAt - d.createdAt) / 60000, 0) / doneToday.filter(d => d.deliveredAt).length)
        : 0;
    const unsettled = all.filter(d => d.status === 'delivered' && !d.settled).length;

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-truck stat-icon"></i><div class="stat-label">طلبات جارية الآن</div><div class="stat-value">${active.length}</div></div>
            <div class="stat green"><i class="bi bi-check2-circle stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">تم توصيلها اليوم</div><div class="stat-value">${doneToday.length}</div></div>
            <div class="stat gold"><i class="bi bi-cash-coin stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">إيراد التوصيل اليوم</div><div class="stat-value" style="font-size:20px">${moneyNum(revToday)}</div></div>
            <div class="stat blue"><i class="bi bi-geo-alt stat-icon" style="color:rgba(37,99,235,.1)"></i><div class="stat-label">أجور المناطق اليوم</div><div class="stat-value" style="font-size:20px">${moneyNum(feesToday)}</div></div>
            <div class="stat purple"><i class="bi bi-stopwatch stat-icon" style="color:rgba(124,58,237,.1)"></i><div class="stat-label">متوسط زمن التوصيل</div><div class="stat-value">${avgMin} <small style="font-size:13px">دقيقة</small></div></div>
        </div>

        <div class="seg-tabs">
            ${[['orders', 'bi-truck', 'طلبات التوصيل'], ['drivers', 'bi-person-vcard', 'السائقون'], ['zones', 'bi-geo-alt', 'مناطق وأسعار'], ['settle', 'bi-safe2', `تسوية الصندوق${unsettled ? ' (' + unsettled + ')' : ''}`], ['stats', 'bi-bar-chart', 'أداء المناطق']]
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
    if (_dlTab === 'settle') return renderSettleTab(box);
    if (_dlTab === 'stats') return renderZoneStatsTab(box);

    let list = getDeliveries();
    if (_dlFilter === 'active') list = list.filter(d => ['pending', 'assigned', 'onway'].includes(d.status));
    else if (_dlFilter !== 'all') list = list.filter(d => d.status === _dlFilter);

    box.innerHTML = `
        <div class="toolbar">
            <div class="filter-pills">
                ${[['active', 'الجارية'], ['pending', 'بانتظار سائق'], ['onway', 'في الطريق'], ['delivered', 'مُسلّمة'], ['failed', 'تعذّرت'], ['all', 'الكل']]
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
    const phoneClean = (d.phone || '').replace(/\s+/g, '');
    return `
    <div class="dl-card ${late ? 'late' : ''}" style="--st:${st.color}">
        <div class="dl-head">
            <span class="dl-num">#${d.orderNumber || '—'}${d.express ? ' <span class="badge badge-gold">⚡ سريع</span>' : ''}</span>
            <span class="badge ${st.cls}"><i class="bi ${st.icon}"></i> ${st.label}</span>
        </div>
        <div class="dl-body">
            <div class="dl-row"><i class="bi bi-person"></i> <strong>${d.customerName || 'عميل'}</strong></div>
            <div class="dl-row" style="direction:ltr;justify-content:flex-end"><span>${d.phone || '-'}</span> <i class="bi bi-telephone"></i></div>
            <div class="dl-row"><i class="bi bi-geo-alt-fill" style="color:${zone?.color || 'var(--primary)'}"></i>
                <strong>${zone ? zone.name : 'بدون منطقة'}</strong>
                ${d.address ? `<span style="color:var(--muted)"> — ${d.address}</span>` : ''}
            </div>
            <div class="dl-row"><i class="bi bi-person-vcard"></i> ${dr ? dr.name : '<span style="color:var(--danger)">لم يُسند بعد</span>'}</div>
            <div class="dl-row"><i class="bi bi-clock-history"></i> منذ ${mins} دقيقة ${late ? '<span class="dl-late">متأخر!</span>' : ''}</div>
        </div>
        <div class="dl-money">
            <div><span>قيمة الطلب</span><strong>${moneyNum(d.total)}</strong></div>
            <div><span>أجرة ${zone ? zone.name : 'التوصيل'}</span><strong>${moneyNum(d.fee)}</strong></div>
            ${d.collect ? `<div><span>تحصيل عند الباب</span><strong style="color:var(--warning)">${moneyNum(d.collect)}</strong></div>` : ''}
        </div>
        <div class="dl-actions">
            ${d.status === 'pending' ? `<button class="btn btn-primary btn-sm" style="flex:1" data-perm="delivery" onclick="openAssignDriver('${d.id}')"><i class="bi bi-person-plus"></i> إسناد سائق</button>` : ''}
            ${d.status === 'assigned' ? `<button class="btn btn-gold btn-sm" style="flex:1" data-perm="delivery" onclick="guard('delivery',()=>{api.setDeliveryStatus('${d.id}','onway');renderDelivery();toast('انطلق السائق 🚗','info')})"><i class="bi bi-truck"></i> خرج للتوصيل</button>` : ''}
            ${d.status === 'onway' ? `<button class="btn btn-success btn-sm" style="flex:1" data-perm="delivery" onclick="markDelivered('${d.id}')"><i class="bi bi-check2-circle"></i> تم التسليم</button>` : ''}
            ${['pending', 'assigned', 'onway'].includes(d.status) ? `<button class="icon-btn" style="width:34px;height:34px;font-size:14px" data-perm="delivery" onclick="guard('delivery',()=>{if(confirmAction('تعذّر التسليم؟')){api.setDeliveryStatus('${d.id}','failed');renderDelivery()}})" title="تعذّر"><i class="bi bi-exclamation-octagon"></i></button>` : ''}
            ${['pending', 'assigned', 'onway'].includes(d.status) ? `<button class="icon-btn" style="width:34px;height:34px;font-size:14px" data-perm="delivery" onclick="guard('delivery',()=>{if(confirmAction('إلغاء طلب التوصيل؟')){api.setDeliveryStatus('${d.id}','cancelled');renderDelivery()}})" title="إلغاء"><i class="bi bi-x-lg"></i></button>` : ''}
            <button class="icon-btn" style="width:34px;height:34px;font-size:14px" onclick="printDriverSlip('${d.id}')" title="وصل السائق"><i class="bi bi-printer"></i></button>
            ${phoneClean && phoneClean !== '-' ? `<button class="icon-btn" style="width:34px;height:34px;font-size:14px" onclick="copyDeliveryMsg('${d.id}')" title="نسخ رسالة واتساب"><i class="bi bi-whatsapp"></i></button>` : ''}
            ${d.orderId ? `<button class="icon-btn" style="width:34px;height:34px;font-size:14px" onclick="viewOrder('${d.orderId}')" title="عرض الطلب"><i class="bi bi-receipt"></i></button>` : ''}
        </div>
    </div>`;
}

function markDelivered(id) {
    const d = getDelivery(id); if (!d) return;
    openModalContent('تأكيد التسليم', `
        <div class="field"><label>استلم من؟ (اسم المستلم)</label>
            <input class="input" id="dlRecv" value="${d.customerName || ''}" placeholder="اسم من استلم الطلب"></div>
        ${d.collect ? `<div class="field"><label>المبلغ المحصّل عند الباب</label>
            <input class="input" id="dlGot" type="number" value="${d.collect}"></div>` : ''}
        <div class="field"><label>ملاحظة</label><input class="input" id="dlNote2" value="${d.note || ''}"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-success" style="flex:1" onclick="confirmDelivered('${id}')"><i class="bi bi-check2"></i> تأكيد التسليم</button>`);
}
function confirmDelivered(id) {
    const d = getDelivery(id); if (!d) return;
    d.receivedBy = document.getElementById('dlRecv')?.value.trim() || d.customerName;
    d.note = document.getElementById('dlNote2')?.value.trim() || d.note;
    const got = document.getElementById('dlGot');
    if (got) { d.collect = Number(got.value) || d.collect; d.collected = true; }
    api.setDeliveryStatus(id, 'delivered');
    closeModal('dynModal');
    renderDelivery();
    toast('تم التسليم ✅', 'success');
}

/* ----- إسناد سائق ----- */
function openAssignDriver(deliveryId) {
    const d = getDelivery(deliveryId); if (!d) return;
    const drivers = getDrivers().filter(x => x.active !== false);
    if (!drivers.length) { toast('أضف سائقاً أولاً من تبويب السائقين', 'warning'); return; }
    const busy = (id) => getDeliveries().filter(x => x.driverId === id && ['assigned', 'onway'].includes(x.status)).length;
    const sorted = [...drivers].sort((a, b) => busy(a.id) - busy(b.id));
    openModalContent(`إسناد الطلب #${d.orderNumber || '-'} لسائق`, `
        <p style="font-size:13px;color:var(--muted);margin-bottom:10px">المنطقة: <strong>${getZone(d.zoneId)?.name || '—'}</strong> • الأجرة ${moneyNum(d.fee)}</p>
        <div class="picker-list">
            ${sorted.map(dr => `
                <div class="picker-row" onclick="doAssignDriver('${d.id}','${dr.id}')">
                    <div class="cell-thumb" style="background:var(--cream-2)"><i class="bi bi-person-vcard"></i></div>
                    <div class="cl-info">
                        <div class="cl-name">${dr.name}</div>
                        <div class="cl-price">${dr.vehicle} • ${dr.phone} • عمولة ${moneyNum(dr.commission)}</div>
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
        <div class="field"><label>المنطقة — تحدد أجرة التوصيل تلقائياً</label>
            <div class="zone-picker zp-sm">
                ${getActiveZones().map(z => `<button type="button" class="zp-card ${d && d.zoneId === z.id ? 'active' : ''}" data-zid="${z.id}" data-fee="${z.fee}" onclick="dlPickZone(this)" style="--zc:${z.color || '#c1272d'}">
                    <div class="zp-name">${z.name}</div>
                    <div class="zp-fee">${moneyNum(z.fee)}</div>
                    <div class="zp-eta">${z.minutes} د</div>
                </button>`).join('')}
            </div>
            <input type="hidden" id="dlZone" value="${d ? (d.zoneId || '') : ''}">
        </div>
        <div class="field"><label>العنوان التفصيلي</label><textarea class="input" id="dlAddr" placeholder="محلة / زقاق / دار / أقرب نقطة دالة">${d ? d.address : ''}</textarea></div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>قيمة الطلب (د.ع)</label><input class="input" id="dlTotal" type="number" value="${d ? d.total : 0}"></div>
            <div class="field" style="flex:1"><label>أجرة التوصيل (د.ع)</label><input class="input" id="dlFee" type="number" value="${d ? d.fee : (getSettings().defaultDeliveryFee || 0)}"></div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>ملاحظة للسائق</label><input class="input" id="dlNote" value="${d ? d.note : ''}"></div>
            <div class="field" style="flex:1"><label>تحصيل عند الباب</label><input class="input" id="dlCollect" type="number" value="${d ? (d.collect || 0) : 0}"></div>
        </div>
        <label class="chk"><input type="checkbox" id="dlExpress" ${d && d.express ? 'checked' : ''}> توصيل سريع (+${moneyNum(getSettings().expressFee || 0)})</label>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" style="flex:1" onclick="saveDelivery('${id || ''}')"><i class="bi bi-check2"></i> حفظ</button>`, 'lg');
}
function dlPickZone(btn) {
    document.querySelectorAll('.zp-card').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('dlZone').value = btn.dataset.zid;
    const feeEl = document.getElementById('dlFee');
    const express = document.getElementById('dlExpress')?.checked;
    if (feeEl) feeEl.value = Number(btn.dataset.fee || 0) + (express ? Number(getSettings().expressFee || 0) : 0);
}
function saveDelivery(id) {
    const name = document.getElementById('dlName').value.trim();
    if (!name) { toast('أدخل اسم العميل', 'error'); return; }
    const zoneId = document.getElementById('dlZone').value || null;
    if (getSettings().requireDeliveryZone && !zoneId) { toast('اختر منطقة التوصيل', 'error'); return; }
    const express = document.getElementById('dlExpress')?.checked;
    const data = {
        customerName: name,
        phone: document.getElementById('dlPhone').value.trim(),
        zoneId,
        address: document.getElementById('dlAddr').value.trim(),
        total: Number(document.getElementById('dlTotal').value) || 0,
        fee: Number(document.getElementById('dlFee').value) || 0,
        note: document.getElementById('dlNote').value.trim(),
        collect: Number(document.getElementById('dlCollect').value) || 0,
        express: !!express
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
        const openCash = getDeliveries().filter(d => d.driverId === id && d.status === 'delivered' && !d.settled)
            .reduce((s, d) => s + Number(d.collect || d.total || 0), 0);
        return { count: list.length, fees: list.reduce((s, d) => s + Number(d.fee || 0), 0), openCash };
    };
    box.innerHTML = `
        <div class="toolbar">
            <div class="spacer"></div>
            <button class="btn btn-primary" data-perm="delivery" onclick="guard('delivery', () => openDriverForm())"><i class="bi bi-plus-lg"></i> سائق جديد</button>
        </div>
        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>السائق</th><th>الهاتف</th><th>المركبة</th><th>الرقم</th><th>طلبات مُسلّمة</th><th>إجمالي الأجور</th><th>كاش غير مسوّى</th><th>العمولة/طلب</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                    <tbody>${drivers.length ? drivers.map(d => {
                        const s = stats(d.id);
                        return `<tr>
                            <td><div class="cell-main"><div class="cell-thumb" style="background:linear-gradient(135deg,var(--info),#1e40af);color:#fff"><i class="bi bi-person-vcard"></i></div><strong>${d.name}</strong></div></td>
                            <td style="direction:ltr;text-align:right">${d.phone || '-'}</td>
                            <td>${d.vehicle}</td>
                            <td>${d.plate || '-'}</td>
                            <td><strong>${s.count}</strong></td>
                            <td><strong style="color:var(--success)">${moneyNum(s.fees)}</strong></td>
                            <td><strong style="color:${s.openCash ? 'var(--warning)' : 'var(--muted)'}">${moneyNum(s.openCash)}</strong></td>
                            <td>${moneyNum(d.commission)}</td>
                            <td><span class="badge ${d.active !== false ? 'badge-success' : 'badge-dark'}">${d.active !== false ? 'نشط' : 'موقوف'}</span></td>
                            <td><div style="display:flex;gap:5px">
                                <button class="icon-btn" style="width:32px;height:32px;font-size:14px" onclick="openDriverForm('${d.id}')"><i class="bi bi-pencil"></i></button>
                                <button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#fee2e2;color:#b91c1c;border-color:#fecaca" onclick="delDriver('${d.id}')"><i class="bi bi-trash"></i></button>
                            </div></td>
                        </tr>`;
                    }).join('') : `<tr><td colspan="10"><div class="empty-state"><i class="bi bi-person-vcard"></i><p>لا يوجد سائقون</p></div></td></tr>`}</tbody>
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
            <p style="font-size:13px;color:var(--muted);margin:0">حدّد سعر التوصيل لكل منطقة. عندما يختار الكاشير «توصيل» تظهر هذه الأسعار فوراً على الفاتورة.</p>
            <div class="spacer"></div>
            <button class="btn btn-primary" data-perm="delivery" onclick="guard('delivery', () => openZoneForm())"><i class="bi bi-plus-lg"></i> منطقة جديدة</button>
        </div>
        <div class="zones-grid">
            ${zones.length ? zones.map(z => {
                const list = getDeliveries().filter(d => d.zoneId === z.id);
                const cnt = list.filter(d => d.status === 'delivered').length;
                const rev = list.filter(d => d.status === 'delivered').reduce((s, d) => s + Number(d.fee || 0), 0);
                return `<div class="zone-card ${z.active === false ? 'off' : ''}" style="border-top:4px solid ${z.color || 'var(--primary)'}">
                    <div class="zc-icon" style="background:${z.color || 'var(--info)'}"><i class="bi bi-geo-alt-fill"></i></div>
                    <div class="zc-name">${z.name}</div>
                    <div class="zc-fee-big">${moneyNum(z.fee)}</div>
                    <div class="zc-meta"><span><i class="bi bi-clock"></i> ${z.minutes} د</span><span>${z.active === false ? 'موقوفة' : 'نشطة'}</span></div>
                    <div class="zc-count">${cnt} طلب مُسلّم • أجور ${moneyNum(rev)}</div>
                    <div style="display:flex;gap:6px;margin-top:10px">
                        <button class="btn btn-light btn-sm" style="flex:1" onclick="openZoneForm('${z.id}')"><i class="bi bi-pencil"></i> تعديل السعر</button>
                        <button class="btn btn-ghost btn-sm" onclick="delZone('${z.id}')"><i class="bi bi-trash"></i></button>
                    </div>
                </div>`;
            }).join('') : `<div class="empty-state" style="grid-column:1/-1"><i class="bi bi-geo-alt"></i><p>لا توجد مناطق توصيل</p></div>`}
        </div>`;
    applyPermissions();
}
function openZoneForm(id) {
    const z = id ? getZone(id) : null;
    openModalContent(z ? 'تعديل منطقة وسعرها' : 'منطقة توصيل جديدة', `
        <div class="field"><label>اسم المنطقة *</label><input class="input" id="znName" value="${z ? z.name : ''}" placeholder="مثال: الكرادة"></div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>أجرة التوصيل (د.ع) *</label><input class="input" id="znFee" type="number" value="${z ? z.fee : 3000}" style="font-size:18px;font-weight:800"></div>
            <div class="field" style="flex:1"><label>الزمن المتوقع (دقيقة)</label><input class="input" id="znMin" type="number" value="${z ? z.minutes : 30}"></div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>لون البطاقة</label><input class="input" id="znColor" type="color" value="${z ? (z.color || '#c1272d') : '#c1272d'}" style="height:46px;padding:4px"></div>
            <div class="field" style="flex:1"><label>الحالة</label>
                <select class="input" id="znActive"><option value="1" ${!z || z.active !== false ? 'selected' : ''}>نشطة — تظهر للكاشير</option><option value="0" ${z && z.active === false ? 'selected' : ''}>موقوفة</option></select>
            </div>
        </div>
        <p style="font-size:12.5px;color:var(--muted)">عندما يختار الكاشير هذه المنطقة تُضاف الأجرة تلقائياً على فاتورة نقطة البيع، ويمكنه تعديلها يدوياً إن سمحت الإعدادات.</p>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" style="flex:1" onclick="saveZone('${id || ''}')"><i class="bi bi-check2"></i> حفظ السعر</button>`);
}
function saveZone(id) {
    const name = document.getElementById('znName').value.trim();
    if (!name) { toast('أدخل اسم المنطقة', 'error'); return; }
    const data = {
        name,
        fee: Number(document.getElementById('znFee').value) || 0,
        minutes: Number(document.getElementById('znMin').value) || 30,
        color: document.getElementById('znColor').value,
        active: document.getElementById('znActive').value === '1'
    };
    if (id) api.updateZone(id, data); else api.addZone(data);
    closeModal('dynModal'); renderDelivery(); toast('تم حفظ سعر المنطقة ✅', 'success');
}
function delZone(id) {
    if (!confirmAction('حذف هذه المنطقة؟')) return;
    api.deleteZone(id); renderDelivery(); toast('تم الحذف', 'success');
}

/* ============ تسوية صندوق السائق ============ */
function renderSettleTab(box) {
    const drivers = getDrivers();
    const openOf = (id) => getDeliveries().filter(d => d.driverId === id && d.status === 'delivered' && !d.settled);
    box.innerHTML = `
        <p style="font-size:13px;color:var(--muted);margin-bottom:14px">يسوّي المدير كاش السائق بعد رجوعه: يحصي الطلبات المسلّمة ويخصم العمولة ويُدخل المبلغ للمطعم.</p>
        <div class="grid grid-2">
            ${drivers.map(dr => {
                const open = openOf(dr.id);
                const cash = open.reduce((s, d) => s + Number(d.collect || d.total || 0), 0);
                const comm = open.length * Number(dr.commission || 0);
                return `<div class="card card-pad">
                    <div class="sup-head"><div class="sup-avatar"><i class="bi bi-person-vcard"></i></div>
                        <div><div class="sup-name">${dr.name}</div><div class="sup-cat">${open.length} طلب غير مسوّى</div></div></div>
                    <div class="totals-row"><span>كاش محصّل</span><strong>${moneyNum(cash)}</strong></div>
                    <div class="totals-row"><span>عمولة السائق</span><strong style="color:var(--warning)">${moneyNum(comm)}</strong></div>
                    <div class="totals-row grand"><span>صافي للمطعم</span><span>${moneyNum(cash - comm)}</span></div>
                    <button class="btn btn-success btn-block" style="margin-top:12px" ${open.length ? '' : 'disabled'}
                        onclick="doSettleDriver('${dr.id}')"><i class="bi bi-safe"></i> تسوية الآن</button>
                </div>`;
            }).join('') || `<div class="empty-state"><p>لا يوجد سائقون</p></div>`}
        </div>
        <div class="card" style="margin-top:16px">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>التاريخ</th><th>السائق</th><th>الطلبات</th><th>المحصّل</th><th>العمولة</th><th>صافي المطعم</th><th>بواسطة</th></tr></thead>
                    <tbody>${getSettlements().length ? getSettlements().map(s => `<tr>
                        <td>${fmtDateTime(s.createdAt)}</td><td>${s.driverName}</td><td>${s.count}</td>
                        <td>${moneyNum(s.collected)}</td><td>${moneyNum(s.commission)}</td>
                        <td><strong>${moneyNum(s.netToRestaurant)}</strong></td><td>${s.userName}</td>
                    </tr>`).join('') : `<tr><td colspan="7"><div class="empty-state"><i class="bi bi-safe2"></i><p>لا توجد تسويات بعد</p></div></td></tr>`}</tbody>
                </table>
            </div>
        </div>`;
}
function doSettleDriver(driverId) {
    const open = getDeliveries().filter(d => d.driverId === driverId && d.status === 'delivered' && !d.settled);
    if (!open.length) { toast('لا توجد طلبات غير مسوّاة', 'info'); return; }
    if (!confirmAction(`تسوية ${open.length} طلب لهذا السائق؟`)) return;
    const rec = api.settleDriver(driverId, open.map(d => d.id));
    renderDelivery();
    toast(rec ? `تمت التسوية — صافي المطعم ${moneyNum(rec.netToRestaurant)}` : 'تعذّرت التسوية', rec ? 'success' : 'error');
}

/* ============ أداء المناطق ============ */
function renderZoneStatsTab(box) {
    const zones = getZones();
    const rows = zones.map(z => {
        const list = getDeliveries().filter(d => d.zoneId === z.id);
        const done = list.filter(d => d.status === 'delivered');
        const late = done.filter(d => d.deliveredAt && (d.deliveredAt - d.createdAt) / 60000 > (z.minutes || 30)).length;
        return {
            z, count: list.length, done: done.length,
            sales: done.reduce((s, d) => s + Number(d.total || 0), 0),
            fees: done.reduce((s, d) => s + Number(d.fee || 0), 0),
            late
        };
    }).sort((a, b) => b.sales - a.sales);
    const max = Math.max(1, ...rows.map(r => r.sales));
    box.innerHTML = `
        <div class="card card-pad">
            <div class="ss-title"><i class="bi bi-bar-chart"></i> أي المناطق تجلب أكثر؟</div>
            ${rows.map(r => `
                <div class="cb-row">
                    <span class="cb-label">${r.z.name}</span>
                    <div class="cb-track"><div class="cb-fill" style="width:${Math.round(r.sales / max * 100)}%;background:${r.z.color || 'var(--primary)'}"></div></div>
                    <span class="cb-val">${moneyNum(r.sales)}</span>
                </div>`).join('') || '<p>لا بيانات</p>'}
        </div>
        <div class="card" style="margin-top:16px">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>المنطقة</th><th>السعر</th><th>الطلبات</th><th>مُسلّمة</th><th>متأخرة</th><th>المبيعات</th><th>أجور التوصيل</th></tr></thead>
                    <tbody>${rows.map(r => `<tr>
                        <td><strong>${r.z.name}</strong></td>
                        <td>${moneyNum(r.z.fee)}</td>
                        <td>${r.count}</td><td>${r.done}</td>
                        <td>${r.late ? `<span class="badge badge-danger">${r.late}</span>` : '0'}</td>
                        <td><strong>${moneyNum(r.sales)}</strong></td>
                        <td>${moneyNum(r.fees)}</td>
                    </tr>`).join('')}</tbody>
                </table>
            </div>
        </div>`;
}

/* ----- وصل السائق + واتساب ----- */
function printDriverSlip(id) {
    const d = getDelivery(id); if (!d) return;
    const zone = d.zoneId ? getZone(d.zoneId) : null;
    const dr = d.driverId ? getDriver(d.driverId) : null;
    const o = d.orderId ? getOrder(d.orderId) : null;
    const items = (o?.items || []).map(i => `<div class="ri-row"><span class="ri-name">${i.name}${i.note ? ' — ' + i.note : ''}</span><span class="ri-qty">${i.qty}</span></div>`).join('');
    printElement(`<div class="receipt"><div class="receipt-body">
        <div class="receipt-head"><h2>وصل توصيل</h2><p>${getSettings().restaurantName}</p></div>
        <div class="receipt-meta">
            <div><span>الطلب</span><strong>#${d.orderNumber}</strong></div>
            <div><span>العميل</span><strong>${d.customerName}</strong></div>
            <div><span>الهاتف</span><strong>${d.phone || '-'}</strong></div>
            <div><span>المنطقة</span><strong>${zone ? zone.name : '-'}</strong></div>
            <div><span>العنوان</span><strong>${d.address || '-'}</strong></div>
            <div><span>السائق</span><strong>${dr ? dr.name : '—'}</strong></div>
            <div><span>أجرة التوصيل</span><strong>${moneyNum(d.fee)}</strong></div>
            <div><span>المطلوب تحصيله</span><strong>${moneyNum(d.collect || d.total)}</strong></div>
        </div>
        ${items ? `<div class="receipt-items">${items}</div>` : ''}
        ${d.note ? `<p>ملاحظة: ${d.note}</p>` : ''}
        ${d.express ? `<p>⚡ توصيل سريع</p>` : ''}
    </div></div>`, 'receipt');
}
function copyDeliveryMsg(id) {
    const d = getDelivery(id); if (!d) return;
    const zone = d.zoneId ? getZone(d.zoneId) : null;
    const s = getSettings();
    const msg = `${s.restaurantName} 🍽️
طلب توصيل #${d.orderNumber}
المنطقة: ${zone ? zone.name : '-'}
العنوان: ${d.address || '-'}
الإجمالي: ${moneyNum(d.total)} (أجرة ${moneyNum(d.fee)})
${d.express ? 'توصيل سريع ⚡' : ''}
شكراً لطلبكم 🌹`;
    navigator.clipboard?.writeText(msg).then(() => toast('تم نسخ رسالة الواتساب', 'success'))
        .catch(() => prompt('انسخ الرسالة:', msg));
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
    const byZone = {};
    list.filter(d => d.status === 'delivered').forEach(d => {
        const z = getZone(d.zoneId);
        const key = z ? z.name : 'بدون منطقة';
        if (!byZone[key]) byZone[key] = { count: 0, fees: 0, sales: 0 };
        byZone[key].count++; byZone[key].fees += Number(d.fee || 0); byZone[key].sales += Number(d.total || 0);
    });
    const zRows = Object.entries(byZone).map(([n, v]) => `<tr><td>${n}</td><td>${v.count}</td><td>${moneyNum(v.sales)}</td><td>${moneyNum(v.fees)}</td></tr>`).join('');
    printElement(reportShell('تقرير أداء التوصيل', `
        <div class="rpd-title">حسب السائق</div>
        <table class="rep-tbl">
            <thead><tr><th>السائق</th><th>طلبات مُسلّمة</th><th>قيمة المبيعات</th><th>أجور التوصيل</th><th>مستحق العمولة</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="rpd-title">حسب المنطقة</div>
        <table class="rep-tbl">
            <thead><tr><th>المنطقة</th><th>الطلبات</th><th>المبيعات</th><th>الأجور</th></tr></thead>
            <tbody>${zRows || '<tr><td colspan="4">لا بيانات</td></tr>'}</tbody>
        </table>`, 'تفصيل حسب السائق والمنطقة'));
}
