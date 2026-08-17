/* ============================================
   قسم الحجوزات — حجز الطاولات مسبقاً
   ============================================ */

const RES_STATUS = {
    booked:    { label: 'محجوز',      cls: 'badge-info',    icon: 'bi-bookmark-star' },
    seated:    { label: 'جالس الآن',  cls: 'badge-success', icon: 'bi-people-fill' },
    done:      { label: 'مكتمل',      cls: 'badge-dark',    icon: 'bi-check2-all' },
    noshow:    { label: 'لم يحضر',    cls: 'badge-warning', icon: 'bi-person-x' },
    cancelled: { label: 'ملغي',       cls: 'badge-danger',  icon: 'bi-x-circle' }
};

let _resDate = new Date().toISOString().slice(0, 10);
let _resFilter = 'all';

function renderReservations() {
    const wrap = document.getElementById('reservationsContainer');
    if (!wrap) return;

    const all = getReservations();
    const dayList = all.filter(r => r.date === _resDate);
    let list = dayList;
    if (_resFilter !== 'all') list = list.filter(r => r.status === _resFilter);
    list = list.slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const guests = dayList.filter(r => !['cancelled', 'noshow'].includes(r.status)).reduce((s, r) => s + Number(r.guests || 0), 0);
    const upcoming = all.filter(r => r.status === 'booked' && r.date >= new Date().toISOString().slice(0, 10)).length;
    const noshowRate = all.length ? Math.round(all.filter(r => r.status === 'noshow').length / all.length * 100) : 0;

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-calendar-check stat-icon"></i><div class="stat-label">حجوزات هذا اليوم</div><div class="stat-value">${dayList.length}</div></div>
            <div class="stat green"><i class="bi bi-people stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">عدد الضيوف المتوقع</div><div class="stat-value">${guests}</div></div>
            <div class="stat gold"><i class="bi bi-bookmark-star stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">حجوزات قادمة</div><div class="stat-value">${upcoming}</div></div>
            <div class="stat purple"><i class="bi bi-person-x stat-icon" style="color:rgba(124,58,237,.1)"></i><div class="stat-label">نسبة عدم الحضور</div><div class="stat-value">${noshowRate}%</div></div>
        </div>

        <div class="toolbar">
            <div class="field" style="margin:0;min-width:180px">
                <input class="input" type="date" value="${_resDate}" onchange="setResDate(this.value)">
            </div>
            <div class="filter-pills">
                ${[['all', 'الكل'], ['booked', 'محجوز'], ['seated', 'جالس'], ['done', 'مكتمل'], ['noshow', 'لم يحضر']]
                  .map(([k, l]) => `<span class="pill ${_resFilter === k ? 'active' : ''}" onclick="setResFilter('${k}')">${l}</span>`).join('')}
            </div>
            <div class="spacer"></div>
            <button class="btn btn-light" onclick="printReservations()"><i class="bi bi-printer"></i> طباعة قائمة اليوم</button>
            <button class="btn btn-primary" data-perm="reservations" onclick="guard('reservations', () => openResForm())"><i class="bi bi-plus-lg"></i> حجز جديد</button>
        </div>

        <div class="res-timeline">
            ${list.length ? list.map(resCard).join('')
              : `<div class="empty-state"><i class="bi bi-calendar-check"></i><p>لا توجد حجوزات في هذا التاريخ</p></div>`}
        </div>`;
    applyPermissions();
}
function setResDate(d) { _resDate = d; renderReservations(); }
function setResFilter(f) { _resFilter = f; renderReservations(); }

function resCard(r) {
    const st = RES_STATUS[r.status] || RES_STATUS.booked;
    const t = r.tableId ? getTable(r.tableId) : null;
    return `
    <div class="res-card ${r.status}">
        <div class="res-time"><strong>${r.time}</strong><span>${r.guests} ضيف</span></div>
        <div class="res-info">
            <div class="res-name">${r.customerName} <span class="badge ${st.cls}"><i class="bi ${st.icon}"></i> ${st.label}</span></div>
            <div class="res-meta">
                <span><i class="bi bi-telephone"></i> <span style="direction:ltr">${r.phone || '-'}</span></span>
                <span><i class="bi bi-grid-3x3-gap"></i> ${t ? t.name + ' (' + t.zone + ')' : 'بدون طاولة'}</span>
                ${r.deposit ? `<span><i class="bi bi-cash"></i> عربون ${moneyNum(r.deposit)}</span>` : ''}
            </div>
            ${r.note ? `<div class="res-note"><i class="bi bi-sticky"></i> ${r.note}</div>` : ''}
        </div>
        <div class="res-actions">
            ${r.status === 'booked' ? `
                <button class="btn btn-success btn-sm" data-perm="reservations" onclick="guard('reservations',()=>{api.setReservationStatus('${r.id}','seated');renderReservations();toast('تم إجلاس الضيوف 🪑','success')})"><i class="bi bi-check2"></i> وصل</button>
                <button class="btn btn-light btn-sm" data-perm="reservations" onclick="guard('reservations',()=>{api.setReservationStatus('${r.id}','noshow');renderReservations()})"><i class="bi bi-person-x"></i> لم يحضر</button>` : ''}
            ${r.status === 'seated' ? `<button class="btn btn-dark btn-sm" data-perm="reservations" onclick="guard('reservations',()=>{api.setReservationStatus('${r.id}','done');renderReservations()})"><i class="bi bi-check2-all"></i> إنهاء</button>` : ''}
            <button class="icon-btn" style="width:32px;height:32px;font-size:14px" data-perm="reservations" onclick="openResForm('${r.id}')"><i class="bi bi-pencil"></i></button>
            <button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#fee2e2;color:#b91c1c;border-color:#fecaca" data-perm="reservations" onclick="delReservation('${r.id}')"><i class="bi bi-trash"></i></button>
        </div>
    </div>`;
}

function openResForm(id) {
    const r = id ? getReservation(id) : null;
    openModalContent(r ? 'تعديل الحجز' : 'حجز طاولة جديد', `
        <div class="row-flex">
            <div class="field" style="flex:1"><label>اسم صاحب الحجز *</label><input class="input" id="rsName" value="${r ? r.customerName : ''}" placeholder="اسم الضيف"></div>
            <div class="field" style="flex:1"><label>رقم الهاتف</label><input class="input" id="rsPhone" value="${r ? r.phone : ''}" style="direction:ltr;text-align:right"></div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>التاريخ</label><input class="input" id="rsDate" type="date" value="${r ? r.date : _resDate}"></div>
            <div class="field" style="flex:1"><label>الوقت</label><input class="input" id="rsTime" type="time" value="${r ? r.time : '20:00'}"></div>
            <div class="field" style="flex:1"><label>عدد الضيوف</label><input class="input" id="rsGuests" type="number" min="1" value="${r ? r.guests : 2}"></div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>الطاولة</label>
                <select class="input" id="rsTable">
                    <option value="">بدون تخصيص</option>
                    ${getTables().map(t => `<option value="${t.id}" ${r && r.tableId === t.id ? 'selected' : ''}>${t.name} — ${t.zone} (${t.seats} كراسي)</option>`).join('')}
                </select>
            </div>
            <div class="field" style="flex:1"><label>عربون (د.ع)</label><input class="input" id="rsDeposit" type="number" value="${r ? r.deposit : 0}"></div>
        </div>
        <div class="field"><label>ملاحظات</label><textarea class="input" id="rsNote" placeholder="مناسبة، طلبات خاصة، كرسي أطفال...">${r ? r.note : ''}</textarea></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" style="flex:1" onclick="saveReservation('${id || ''}')"><i class="bi bi-check2"></i> حفظ الحجز</button>`);
}
function saveReservation(id) {
    const name = document.getElementById('rsName').value.trim();
    if (!name) { toast('أدخل اسم صاحب الحجز', 'error'); return; }
    const data = {
        customerName: name,
        phone: document.getElementById('rsPhone').value.trim(),
        date: document.getElementById('rsDate').value,
        time: document.getElementById('rsTime').value,
        guests: Number(document.getElementById('rsGuests').value) || 1,
        tableId: document.getElementById('rsTable').value || null,
        deposit: Number(document.getElementById('rsDeposit').value) || 0,
        note: document.getElementById('rsNote').value.trim()
    };
    if (id) { api.updateReservation(id, data); }
    else {
        const r = api.addReservation(data);
        if (r.tableId) api.setReservationStatus(r.id, 'booked');
    }
    _resDate = data.date;
    closeModal('dynModal'); renderReservations();
    toast('تم حفظ الحجز ✅', 'success');
}
function delReservation(id) {
    if (!confirmAction('حذف هذا الحجز؟')) return;
    api.deleteReservation(id); renderReservations(); toast('تم الحذف', 'success');
}

function printReservations() {
    const list = getReservations().filter(r => r.date === _resDate).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const rows = list.map(r => `<tr>
        <td>${r.time}</td><td>${r.customerName}</td><td>${r.phone || '-'}</td>
        <td>${r.guests}</td><td>${r.tableId ? (getTable(r.tableId)?.name || '-') : '-'}</td>
        <td>${(RES_STATUS[r.status] || {}).label || '-'}</td><td>${r.note || '-'}</td></tr>`).join('')
        || `<tr><td colspan="7">لا توجد حجوزات</td></tr>`;
    printElement(reportShell('قائمة حجوزات اليوم', `
        <table class="rep-tbl">
            <thead><tr><th>الوقت</th><th>الاسم</th><th>الهاتف</th><th>الضيوف</th><th>الطاولة</th><th>الحالة</th><th>ملاحظة</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`, `تاريخ: ${_resDate}`));
}
