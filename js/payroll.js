/* ============================================
   الرواتب والحضور والسلف والهدر
   ============================================ */

let _prMonth = monthKey();
let _prPeriod = monthKey();
let _prCycle = 'monthly';
let _prTab = 'payroll'; // payroll | attend | advances | waste
let _attDate = todayKey();

const ATT_STATUS = {
    present: { label: 'حاضر', cls: 'badge-success' },
    late:    { label: 'متأخر', cls: 'badge-warning' },
    absent:  { label: 'غائب', cls: 'badge-danger' },
    leave:   { label: 'إجازة', cls: 'badge-info' }
};

function renderPayroll() {
    const wrap = document.getElementById('payrollContainer');
    if (!wrap) return;

    const list = getPayroll().filter(p => (p.period || p.month) === _prPeriod || (p.cycle === _prCycle && p.month === _prMonth));
    const totalNet = list.reduce((s, p) => s + Number(p.net || 0), 0);
    const paidTotal = list.filter(p => p.paid).reduce((s, p) => s + Number(p.net || 0), 0);
    const wasteMonth = getWastes().filter(w => monthKey(w.createdAt) === _prMonth)
        .reduce((s, w) => s + Number(w.cost || 0), 0);
    const todayAtt = getAttendance().filter(a => a.date === todayKey());
    const openAdv = getAdvances().filter(a => !a.settled).reduce((s, a) => s + Number(a.amount || 0), 0);

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-cash-stack stat-icon"></i><div class="stat-label">قيود الفترة</div><div class="stat-value">${list.length}</div></div>
            <div class="stat gold"><i class="bi bi-wallet2 stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">إجمالي الرواتب</div><div class="stat-value" style="font-size:20px">${moneyNum(totalNet)}</div></div>
            <div class="stat green"><i class="bi bi-check2-circle stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">المصروف فعلياً</div><div class="stat-value" style="font-size:20px">${moneyNum(paidTotal)}</div></div>
            <div class="stat blue"><i class="bi bi-person-check stat-icon" style="color:rgba(37,99,235,.1)"></i><div class="stat-label">حضور اليوم</div><div class="stat-value">${todayAtt.length}<small style="font-size:13px"> / ${getUsers().filter(u => u.active !== false).length}</small></div></div>
            <div class="stat purple"><i class="bi bi-piggy-bank stat-icon" style="color:rgba(124,58,237,.1)"></i><div class="stat-label">سلف معلّقة</div><div class="stat-value" style="font-size:20px">${moneyNum(openAdv)}</div></div>
        </div>

        <div class="seg-tabs">
            ${[['payroll', 'bi-cash-stack', 'كشف الرواتب'], ['attend', 'bi-fingerprint', 'الحضور والانصراف'], ['advances', 'bi-piggy-bank', 'السلف'], ['waste', 'bi-trash3', 'سجل الهدر']]
              .map(([k, i, l]) => `<button class="seg ${_prTab === k ? 'active' : ''}" onclick="setPrTab('${k}')"><i class="bi ${i}"></i> ${l}</button>`).join('')}
        </div>
        <div id="prBody"></div>`;
    renderPrBody();
}
function setPrTab(t) { _prTab = t; renderPayroll(); }
function setPrMonth(m) { _prMonth = m; _prPeriod = m; _prCycle = 'monthly'; renderPayroll(); }
function setPrCycleView(c) {
    _prCycle = c;
    _prPeriod = periodKey(c);
    if (c === 'monthly') _prMonth = monthKey();
    renderPayroll();
}

function renderPrBody() {
    const box = document.getElementById('prBody');
    if (!box) return;
    if (_prTab === 'waste') return renderWasteTab(box);
    if (_prTab === 'attend') return renderAttendTab(box);
    if (_prTab === 'advances') return renderAdvancesTab(box);

    const list = getPayroll().filter(p => {
        const per = p.period || p.month;
        if (_prCycle === 'monthly') return (p.cycle || 'monthly') === 'monthly' && (per === _prPeriod || p.month === _prMonth);
        return p.cycle === _prCycle && per === _prPeriod;
    });

    box.innerHTML = `
        <div class="toolbar">
            <div class="filter-pills">
                ${Object.entries(PAY_CYCLE).map(([k, v]) => `<span class="pill ${_prCycle === k ? 'active' : ''}" onclick="setPrCycleView('${k}')"><i class="bi ${v.icon}"></i> ${v.label}</span>`).join('')}
            </div>
            ${_prCycle === 'monthly' ? `<div class="field" style="margin:0;min-width:170px"><input class="input" type="month" value="${_prMonth}" onchange="setPrMonth(this.value)"></div>` : `<span class="badge badge-dark">الفترة: ${_prPeriod}</span>`}
            <div class="spacer"></div>
            <button class="btn btn-light" onclick="generatePayrollPeriod()"><i class="bi bi-magic"></i> توليد الكشف تلقائياً</button>
            <button class="btn btn-light" onclick="printPayroll()"><i class="bi bi-printer"></i> طباعة</button>
            <button class="btn btn-primary" data-perm="payroll" onclick="guard('payroll', () => openPayrollForm())"><i class="bi bi-plus-lg"></i> قيد راتب</button>
        </div>
        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>الموظف</th><th>الدورة</th><th>الأساسي</th><th>إضافي</th><th>مكافآت</th><th>استقطاع</th><th>سلف</th><th>أيام العمل</th><th>الصافي</th><th>الحالة</th><th></th></tr></thead>
                    <tbody>${list.length ? list.map(p => `<tr>
                        <td><div class="cell-main"><div class="cell-thumb" style="background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff">${(p.userName || '؟').charAt(0)}</div>
                            <div><strong>${p.userName}</strong><div style="font-size:11px;color:var(--muted)">${p.period || p.month}</div></div></div></td>
                        <td><span class="badge badge-dark">${PAY_CYCLE[p.cycle]?.label || 'شهري'}</span></td>
                        <td>${moneyNum(p.base)}</td>
                        <td style="color:var(--info)">+${moneyNum(p.overtime || 0)}</td>
                        <td style="color:var(--success)">+${moneyNum(p.bonus)}</td>
                        <td style="color:var(--danger)">−${moneyNum(p.deduction)}</td>
                        <td style="color:var(--warning)">−${moneyNum(p.advance)}</td>
                        <td>${p.daysWorked || 0}${p.daysExpected ? ' / ' + p.daysExpected : ''}</td>
                        <td><strong style="font-size:15px;color:var(--primary-dark)">${moneyNum(p.net)}</strong></td>
                        <td><span class="badge ${p.paid ? 'badge-success' : 'badge-warning'}">${p.paid ? 'مصروف' : 'معلّق'}</span></td>
                        <td><div style="display:flex;gap:5px">
                            ${!p.paid ? `<button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#dcfce7;color:#15803d;border-color:#bbf7d0" data-perm="payroll" onclick="doPayPayroll('${p.id}')" title="صرف"><i class="bi bi-cash"></i></button>` : ''}
                            <button class="icon-btn" style="width:32px;height:32px;font-size:14px" onclick="printPayslip('${p.id}')" title="قسيمة"><i class="bi bi-printer"></i></button>
                            <button class="icon-btn" style="width:32px;height:32px;font-size:14px" onclick="openPayrollForm('${p.id}')"><i class="bi bi-pencil"></i></button>
                            <button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#fee2e2;color:#b91c1c;border-color:#fecaca" data-perm="payroll" onclick="delPayroll('${p.id}')"><i class="bi bi-trash"></i></button>
                        </div></td>
                    </tr>`).join('') : `<tr><td colspan="11"><div class="empty-state"><i class="bi bi-cash-stack"></i><p>لا توجد قيود لهذه الفترة — اضغط «توليد الكشف تلقائياً»</p></div></td></tr>`}</tbody>
                </table>
            </div>
        </div>`;
    applyPermissions();
}

function openPayrollForm(id) {
    const p = id ? getPayroll().find(x => x.id === id) : null;
    const cycle = p ? (p.cycle || 'monthly') : _prCycle;
    openModalContent(p ? 'تعديل قيد راتب' : 'قيد راتب جديد', `
        <div class="row-flex">
            <div class="field" style="flex:2"><label>الموظف *</label>
                <select class="input" id="prUser" onchange="fillSalaryFromUser()">
                    ${getUsers().map(u => `<option value="${u.id}" data-sal="${u.salary || 0}" data-cyc="${u.payCycle || 'monthly'}" ${p && p.userId === u.id ? 'selected' : ''}>${u.avatar || ''} ${u.name} — ${ROLE_LABEL[u.role] || u.role} • ${PAY_CYCLE[u.payCycle || 'monthly']?.label || ''} ${moneyNum(u.salary || 0)}</option>`).join('')}
                </select>
            </div>
            <div class="field" style="flex:1"><label>دورة الراتب</label>
                <select class="input" id="prCycle">${Object.entries(PAY_CYCLE).map(([k, v]) => `<option value="${k}" ${cycle === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
            </div>
        </div>
        <div class="field"><label>الفترة (يوم / أسبوع / شهر)</label>
            <input class="input" id="prPeriod" value="${p ? (p.period || p.month) : _prPeriod}" placeholder="2026-08 أو 2026-W33 أو 2026-08-18"></div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>الراتب الأساسي</label><input class="input" id="prBase" type="number" value="${p ? p.base : 0}" oninput="calcNet()"></div>
            <div class="field" style="flex:1"><label>إضافي / أوفر تايم</label><input class="input" id="prOt" type="number" value="${p ? (p.overtime || 0) : 0}" oninput="calcNet()"></div>
            <div class="field" style="flex:1"><label>مكافآت</label><input class="input" id="prBonus" type="number" value="${p ? p.bonus : 0}" oninput="calcNet()"></div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>استقطاعات (غياب/تأخير)</label><input class="input" id="prDed" type="number" value="${p ? p.deduction : 0}" oninput="calcNet()"></div>
            <div class="field" style="flex:1"><label>سلف تُخصم</label><input class="input" id="prAdv" type="number" value="${p ? p.advance : 0}" oninput="calcNet()"></div>
            <div class="field" style="flex:1"><label>أيام العمل</label><input class="input" id="prDays" type="number" value="${p ? (p.daysWorked || 0) : 0}"></div>
        </div>
        <div class="stat green" style="margin:6px 0"><div class="stat-label">صافي الراتب</div><div class="stat-value" id="prNet">0</div></div>
        <div class="field"><label>ملاحظة</label><input class="input" id="prNote" value="${p ? p.note : ''}"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" style="flex:1" onclick="savePayroll('${id || ''}')"><i class="bi bi-check2"></i> حفظ</button>`);
    if (!p) fillSalaryFromUser();
    calcNet();
}
function fillSalaryFromUser() {
    const sel = document.getElementById('prUser');
    if (!sel) return;
    const opt = sel.selectedOptions[0];
    const base = document.getElementById('prBase');
    const cyc = document.getElementById('prCycle');
    if (base && !Number(base.value)) base.value = opt?.dataset.sal || 0;
    if (cyc && opt?.dataset.cyc) cyc.value = opt.dataset.cyc;
    calcNet();
}
function calcNet() {
    const v = (id) => Number(document.getElementById(id)?.value || 0);
    const net = v('prBase') + v('prBonus') + v('prOt') - v('prDed') - v('prAdv');
    const el = document.getElementById('prNet');
    if (el) el.textContent = moneyNum(net);
}
function savePayroll(id) {
    const uId = document.getElementById('prUser').value;
    const u = getUser(uId);
    const cycle = document.getElementById('prCycle').value;
    const period = document.getElementById('prPeriod').value.trim() || periodKey(cycle);
    const data = {
        userId: uId, userName: u ? u.name : '-',
        cycle, period, month: cycle === 'monthly' ? period : period.slice(0, 7),
        base: Number(document.getElementById('prBase').value) || 0,
        overtime: Number(document.getElementById('prOt').value) || 0,
        bonus: Number(document.getElementById('prBonus').value) || 0,
        deduction: Number(document.getElementById('prDed').value) || 0,
        advance: Number(document.getElementById('prAdv').value) || 0,
        daysWorked: Number(document.getElementById('prDays').value) || 0,
        note: document.getElementById('prNote').value.trim()
    };
    if (id) api.updatePayroll(id, data); else api.addPayroll(data);
    _prCycle = cycle; _prPeriod = period;
    if (cycle === 'monthly') _prMonth = period;
    closeModal('dynModal'); renderPayroll(); toast('تم حفظ القيد ✅', 'success');
}
function doPayPayroll(id) {
    if (!confirmAction('صرف هذا الراتب؟ سيُسجَّل تلقائياً كمصروف.')) return;
    api.payPayroll(id); renderPayroll(); toast('تم صرف الراتب وتسجيله كمصروف ✅', 'success');
}
function delPayroll(id) {
    if (!confirmAction('حذف هذا القيد؟')) return;
    api.deletePayroll(id); renderPayroll(); toast('تم الحذف', 'success');
}

/* توليد كشف حسب دورة كل موظف + الحضور */
function generatePayrollPeriod() {
    if (!can('payroll')) { denied(); return; }
    const users = getUsers().filter(u => u.active !== false);
    let created = 0;
    users.forEach(u => {
        const cycle = u.payCycle || 'monthly';
        if (cycle !== _prCycle) return;
        const period = _prPeriod;
        if (getPayroll().some(p => p.userId === u.id && (p.period || p.month) === period && (p.cycle || 'monthly') === cycle)) return;
        const calc = computePayForUser(u, cycle, period);
        api.addPayroll({
            userId: u.id, userName: u.name, cycle, period,
            month: cycle === 'monthly' ? period : period.slice(0, 7),
            base: calc.base, deduction: calc.deduction, advance: calc.advance,
            overtime: calc.overtime, daysWorked: calc.daysWorked, daysExpected: calc.daysExpected,
            note: calc.note
        });
        created++;
    });
    if (!created) { toast('كل الموظفين لهذه الدورة لديهم قيد، أو لا يوجد موظف بهذه الدورة', 'info'); return; }
    renderPayroll();
    toast(`تم توليد ${created} قيد راتب حسب الدورة والحضور ✅`, 'success');
}

function computePayForUser(u, cycle, period) {
    const salary = Number(u.salary || 0);
    const recs = getAttendance().filter(a => a.userId === u.id && attendanceInPeriod(a, cycle, period));
    const worked = recs.filter(a => a.status === 'present' || a.status === 'late').length;
    const late = recs.filter(a => a.status === 'late').length;
    const absent = recs.filter(a => a.status === 'absent').length;
    const expected = expectedWorkDays(u, cycle, period);
    const openAdv = getAdvances().filter(a => a.userId === u.id && !a.settled).reduce((s, a) => s + Number(a.amount || 0), 0);

    let base = salary;
    let deduction = 0;
    if (cycle === 'daily') {
        base = salary * Math.max(worked, 0);
    } else if (cycle === 'weekly') {
        // إذا الراتب أسبوعي ثابت، نخصم أيام الغياب بنسبة
        if (expected > 0 && worked < expected) deduction = Math.round(salary * (expected - worked) / expected);
    } else {
        if (expected > 0 && worked > 0 && worked < expected) deduction = Math.round(salary * absent / expected);
        else if (expected > 0 && worked === 0 && recs.length) deduction = salary;
    }
    deduction += late * Math.round(salary * 0.01); // 1% عن كل تأخير
    const overtimeMin = recs.reduce((s, a) => s + Math.max(0, (a.minutes || 0) - 8 * 60), 0);
    const hourly = cycle === 'daily' ? salary / 8 : salary / Math.max(expected * 8, 1);
    const overtime = Math.round((overtimeMin / 60) * hourly * 1.5);
    return {
        base, deduction, overtime, advance: openAdv,
        daysWorked: worked, daysExpected: expected,
        note: `توليد آلي — حضور ${worked}/${expected} • تأخير ${late} • غياب ${absent}`
    };
}
function attendanceInPeriod(a, cycle, period) {
    if (cycle === 'daily') return a.date === period;
    if (cycle === 'weekly') return weekKey(new Date(a.date + 'T12:00:00')) === period;
    return (a.date || '').slice(0, 7) === period;
}
function expectedWorkDays(u, cycle, period) {
    const days = Array.isArray(u.workDays) && u.workDays.length ? u.workDays : [0, 1, 2, 3, 4, 5, 6];
    if (cycle === 'daily') return 1;
    if (cycle === 'weekly') return days.length;
    // أيام الشهر التي توافق أيام دوامه
    const [y, m] = (period || monthKey()).split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    let n = 0;
    for (let d = 1; d <= last; d++) {
        const dt = new Date(y, m - 1, d);
        if (days.includes(dt.getDay())) n++;
    }
    return n;
}

function printPayroll() {
    const list = getPayroll().filter(p => (p.period || p.month) === _prPeriod || (_prCycle === 'monthly' && p.month === _prMonth));
    const rows = list.map(p => `<tr>
        <td>${p.userName}</td><td>${PAY_CYCLE[p.cycle]?.label || ''}</td>
        <td>${moneyNum(p.base)}</td><td>${moneyNum(p.overtime || 0)}</td><td>${moneyNum(p.bonus)}</td>
        <td>${moneyNum(p.deduction)}</td><td>${moneyNum(p.advance)}</td>
        <td><strong>${moneyNum(p.net)}</strong></td><td>${p.paid ? 'مصروف' : 'معلّق'}</td></tr>`).join('')
        || `<tr><td colspan="9">لا توجد قيود</td></tr>`;
    const total = list.reduce((s, p) => s + p.net, 0);
    printElement(reportShell('كشف رواتب الموظفين', `
        <table class="rep-tbl">
            <thead><tr><th>الموظف</th><th>الدورة</th><th>الأساسي</th><th>إضافي</th><th>مكافآت</th><th>استقطاع</th><th>سلف</th><th>الصافي</th><th>الحالة</th></tr></thead>
            <tbody>${rows}<tr><td colspan="7" style="font-weight:900">الإجمالي</td><td style="font-weight:900">${moneyNum(total)}</td><td></td></tr></tbody>
        </table>`, `${PAY_CYCLE[_prCycle]?.label || ''} — ${_prPeriod}`));
}
function printPayslip(id) {
    const p = getPayroll().find(x => x.id === id); if (!p) return;
    printElement(reportShell(`قسيمة راتب — ${p.userName}`, `
        <table class="rep-tbl"><tbody>
            <tr><td>الموظف</td><td>${p.userName}</td></tr>
            <tr><td>الدورة</td><td>${PAY_CYCLE[p.cycle]?.label || 'شهري'}</td></tr>
            <tr><td>الفترة</td><td>${p.period || p.month}</td></tr>
            <tr><td>الأساسي</td><td>${moneyNum(p.base)}</td></tr>
            <tr><td>إضافي</td><td>${moneyNum(p.overtime || 0)}</td></tr>
            <tr><td>مكافآت</td><td>${moneyNum(p.bonus)}</td></tr>
            <tr><td>استقطاعات</td><td>${moneyNum(p.deduction)}</td></tr>
            <tr><td>سلف</td><td>${moneyNum(p.advance)}</td></tr>
            <tr><td>أيام العمل</td><td>${p.daysWorked || 0} / ${p.daysExpected || '-'}</td></tr>
            <tr><td style="font-weight:900">الصافي</td><td style="font-weight:900">${moneyNum(p.net)}</td></tr>
            <tr><td>الحالة</td><td>${p.paid ? 'مصروف في ' + fmtDateTime(p.paidAt) : 'معلّق'}</td></tr>
            ${p.note ? `<tr><td>ملاحظة</td><td>${p.note}</td></tr>` : ''}
        </tbody></table>`, 'قسيمة راتب رسمية'));
}

/* ============ الحضور ============ */
function renderAttendTab(box) {
    const users = getUsers().filter(u => u.active !== false);
    const recs = getAttendance().filter(a => a.date === _attDate);
    const byUser = id => recs.find(a => a.userId === id);
    box.innerHTML = `
        <div class="toolbar">
            <div class="field" style="margin:0;min-width:180px"><input class="input" type="date" value="${_attDate}" onchange="_attDate=this.value;renderPayroll()"></div>
            <button class="btn btn-success" onclick="doMyClock('in')"><i class="bi bi-box-arrow-in-right"></i> تسجيل حضوري</button>
            <button class="btn btn-dark" onclick="doMyClock('out')"><i class="bi bi-box-arrow-right"></i> تسجيل انصرافي</button>
            <div class="spacer"></div>
            <button class="btn btn-light" onclick="printAttendance()"><i class="bi bi-printer"></i> كشف اليوم</button>
            <button class="btn btn-primary" data-perm="payroll" onclick="guard('payroll', () => openAttendForm())"><i class="bi bi-plus-lg"></i> قيد يدوي</button>
        </div>
        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>الموظف</th><th>الدورة / الراتب</th><th>الحضور</th><th>الانصراف</th><th>المدة</th><th>الحالة</th><th></th></tr></thead>
                    <tbody>${users.map(u => {
                        const a = byUser(u.id);
                        const st = a ? (ATT_STATUS[a.status] || ATT_STATUS.present) : { label: 'لم يسجّل', cls: 'badge-dark' };
                        return `<tr>
                            <td><strong>${u.avatar || ''} ${u.name}</strong><div style="font-size:11px;color:var(--muted)">${u.jobTitle || ROLE_LABEL[u.role] || ''}</div></td>
                            <td>${PAY_CYCLE[u.payCycle || 'monthly']?.label || 'شهري'} • ${moneyNum(u.salary || 0)}</td>
                            <td>${a?.inAt ? fmtTime(a.inAt) : '—'}</td>
                            <td>${a?.outAt ? fmtTime(a.outAt) : '—'}</td>
                            <td>${a?.minutes ? Math.floor(a.minutes / 60) + 'س ' + (a.minutes % 60) + 'د' : '—'}</td>
                            <td><span class="badge ${st.cls}">${st.label}</span></td>
                            <td>${a ? `<button class="icon-btn" style="width:30px;height:30px;font-size:13px" onclick="delAttend('${a.id}')"><i class="bi bi-trash"></i></button>` : `<button class="btn btn-light btn-sm" onclick="markAbsent('${u.id}')">غياب</button>`}</td>
                        </tr>`;
                    }).join('')}</tbody>
                </table>
            </div>
        </div>`;
    applyPermissions();
}
function doMyClock(kind) {
    const u = currentUser(); if (!u) return;
    if (kind === 'in') {
        const rec = api.clockIn(u.id);
        if (rec) { toast(rec.status === 'late' ? 'تم تسجيل الحضور — متأخر ⏰' : 'تم تسجيل الحضور ✅', rec.status === 'late' ? 'warning' : 'success'); }
    } else {
        const rec = api.clockOut(u.id);
        if (rec) toast(`تم تسجيل الانصراف — ${rec.minutes} دقيقة`, 'success');
    }
    if (typeof refreshClockBtn === 'function') refreshClockBtn();
    if (_prTab === 'attend') renderPayroll();
}
function markAbsent(userId) {
    const u = getUser(userId); if (!u) return;
    if (todayAttendance(userId)) { toast('لديه سجل اليوم', 'warning'); return; }
    api.addAttendance({ userId, userName: u.name, date: _attDate, status: 'absent' });
    renderPayroll(); toast('سُجّل غياب', 'info');
}
function openAttendForm() {
    openModalContent('قيد حضور يدوي', `
        <div class="field"><label>الموظف</label>
            <select class="input" id="atUser">${getUsers().map(u => `<option value="${u.id}">${u.name}</option>`).join('')}</select></div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>التاريخ</label><input class="input" id="atDate" type="date" value="${_attDate}"></div>
            <div class="field" style="flex:1"><label>الحالة</label>
                <select class="input" id="atSt">${Object.entries(ATT_STATUS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>وقت الحضور</label><input class="input" id="atIn" type="time" value="${getSettings().workStart || '09:00'}"></div>
            <div class="field" style="flex:1"><label>وقت الانصراف</label><input class="input" id="atOut" type="time" value="${getSettings().workEnd || '23:00'}"></div>
        </div>
        <div class="field"><label>ملاحظة</label><input class="input" id="atNote"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" style="flex:1" onclick="saveAttendManual()"><i class="bi bi-check2"></i> حفظ</button>`);
}
function saveAttendManual() {
    const u = getUser(document.getElementById('atUser').value);
    const date = document.getElementById('atDate').value;
    const st = document.getElementById('atSt').value;
    const toTs = (t) => {
        if (!t) return null;
        const [h, m] = t.split(':').map(Number);
        const d = new Date(date + 'T00:00:00'); d.setHours(h, m, 0, 0); return d.getTime();
    };
    api.addAttendance({
        userId: u.id, userName: u.name, date, status: st,
        inAt: st === 'absent' || st === 'leave' ? null : toTs(document.getElementById('atIn').value),
        outAt: st === 'absent' || st === 'leave' ? null : toTs(document.getElementById('atOut').value),
        note: document.getElementById('atNote').value.trim()
    });
    _attDate = date;
    closeModal('dynModal'); renderPayroll(); toast('تم حفظ القيد', 'success');
}
function delAttend(id) {
    if (!confirmAction('حذف قيد الحضور؟')) return;
    api.deleteAttendance(id); renderPayroll();
}
function printAttendance() {
    const recs = getAttendance().filter(a => a.date === _attDate);
    printElement(reportShell('كشف الحضور', `
        <table class="rep-tbl"><thead><tr><th>الموظف</th><th>حضور</th><th>انصراف</th><th>المدة</th><th>الحالة</th></tr></thead>
        <tbody>${recs.map(a => `<tr><td>${a.userName}</td><td>${a.inAt ? fmtTime(a.inAt) : '-'}</td><td>${a.outAt ? fmtTime(a.outAt) : '-'}</td><td>${a.minutes || 0} د</td><td>${ATT_STATUS[a.status]?.label || a.status}</td></tr>`).join('') || '<tr><td colspan="5">لا سجلات</td></tr>'}</tbody></table>`, _attDate));
}

/* ============ السلف ============ */
function renderAdvancesTab(box) {
    const list = getAdvances();
    const open = list.filter(a => !a.settled).reduce((s, a) => s + Number(a.amount || 0), 0);
    box.innerHTML = `
        <div class="toolbar">
            <span class="badge badge-warning">سلف معلّقة: ${moneyNum(open)}</span>
            <div class="spacer"></div>
            <button class="btn btn-primary" data-perm="payroll" onclick="guard('payroll', () => openAdvanceForm())"><i class="bi bi-plus-lg"></i> سلفة جديدة</button>
        </div>
        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>الموظف</th><th>المبلغ</th><th>التاريخ</th><th>ملاحظة</th><th>الحالة</th><th></th></tr></thead>
                    <tbody>${list.length ? list.map(a => `<tr>
                        <td><strong>${a.userName}</strong></td>
                        <td><strong style="color:var(--warning)">${moneyNum(a.amount)}</strong></td>
                        <td>${a.date}</td>
                        <td>${a.note || '-'}</td>
                        <td><span class="badge ${a.settled ? 'badge-success' : 'badge-warning'}">${a.settled ? 'مخصومة' : 'معلّقة'}</span></td>
                        <td><div style="display:flex;gap:5px">
                            ${!a.settled ? `<button class="btn btn-light btn-sm" onclick="api.settleAdvance('${a.id}');renderPayroll();toast('تم تعليم السلفة كمخصومة','success')">خصمها</button>` : ''}
                            <button class="icon-btn" style="width:30px;height:30px;font-size:13px" onclick="if(confirmAction('حذف؟')){api.deleteAdvance('${a.id}');renderPayroll()}"><i class="bi bi-trash"></i></button>
                        </div></td>
                    </tr>`).join('') : `<tr><td colspan="6"><div class="empty-state"><i class="bi bi-piggy-bank"></i><p>لا توجد سلف</p></div></td></tr>`}</tbody>
                </table>
            </div>
        </div>`;
    applyPermissions();
}
function openAdvanceForm() {
    openModalContent('سلفة موظف', `
        <div class="field"><label>الموظف</label>
            <select class="input" id="avUser">${getUsers().map(u => `<option value="${u.id}">${u.name}</option>`).join('')}</select></div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>المبلغ</label><input class="input" id="avAmt" type="number" value="0"></div>
            <div class="field" style="flex:1"><label>التاريخ</label><input class="input" id="avDate" type="date" value="${todayKey()}"></div>
        </div>
        <div class="field"><label>ملاحظة</label><input class="input" id="avNote" placeholder="سبب السلفة"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" style="flex:1" onclick="saveAdvance()"><i class="bi bi-check2"></i> حفظ</button>`);
}
function saveAdvance() {
    const u = getUser(document.getElementById('avUser').value);
    const amount = Number(document.getElementById('avAmt').value) || 0;
    if (!amount) { toast('أدخل المبلغ', 'error'); return; }
    api.addAdvance({ userId: u.id, userName: u.name, amount, date: document.getElementById('avDate').value, note: document.getElementById('avNote').value.trim() });
    closeModal('dynModal'); renderPayroll(); toast('تم تسجيل السلفة', 'success');
}

/* ============ سجل الهدر ============ */
const WASTE_REASONS = ['تالف', 'انتهت الصلاحية', 'خطأ تحضير', 'إرجاع عميل', 'كسر', 'ضيافة/مجاناً', 'أخرى'];

function renderWasteTab(box) {
    const list = getWastes();
    const totalCost = list.reduce((s, w) => s + Number(w.cost || 0), 0);
    const byReason = {};
    list.forEach(w => { byReason[w.reason] = (byReason[w.reason] || 0) + Number(w.cost || 0); });
    const top = Object.entries(byReason).sort((a, b) => b[1] - a[1]).slice(0, 4);

    box.innerHTML = `
        <div class="toolbar">
            <div class="filter-pills">
                ${top.map(([r, v]) => `<span class="pill">${r}: ${moneyNum(v)}</span>`).join('')}
            </div>
            <div class="spacer"></div>
            <button class="btn btn-danger" data-perm="waste" onclick="guard('waste', () => openWasteForm())"><i class="bi bi-plus-lg"></i> تسجيل هدر</button>
        </div>
        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>الصنف</th><th>الكمية</th><th>السبب</th><th>الكلفة</th><th>المستخدم</th><th>التاريخ</th><th>ملاحظة</th><th></th></tr></thead>
                    <tbody>${list.length ? list.map(w => `<tr>
                        <td><strong>${w.productName}</strong></td>
                        <td>${w.qty}</td>
                        <td><span class="badge badge-warning">${w.reason}</span></td>
                        <td style="color:var(--danger);font-weight:800">${moneyNum(w.cost)}</td>
                        <td>${w.userName}</td>
                        <td style="font-size:12.5px">${fmtDateTime(w.createdAt)}</td>
                        <td style="font-size:12.5px;color:var(--muted)">${w.note || '-'}</td>
                        <td><button class="icon-btn" style="width:30px;height:30px;font-size:13px" data-perm="waste" onclick="delWaste('${w.id}')"><i class="bi bi-trash"></i></button></td>
                    </tr>`).join('') : `<tr><td colspan="8"><div class="empty-state"><i class="bi bi-trash3"></i><p>لا يوجد هدر مسجل — ممتاز! 👌</p></div></td></tr>`}</tbody>
                    ${list.length ? `<tfoot><tr><td colspan="3" style="font-weight:900">إجمالي كلفة الهدر</td><td colspan="5" style="font-weight:900;color:var(--danger)">${moneyNum(totalCost)}</td></tr></tfoot>` : ''}
                </table>
            </div>
        </div>`;
    applyPermissions();
}
function openWasteForm() {
    openModalContent('تسجيل هدر / تالف', `
        <div class="field"><label>الصنف *</label>
            <select class="input" id="wsProd" onchange="wsCalc()">
                ${getProducts().map(p => `<option value="${p.id}" data-cost="${p.cost || 0}">${p.emoji || ''} ${p.name} (متوفر: ${Number(p.stock || 0)})</option>`).join('')}
            </select>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>الكمية</label><input class="input" id="wsQty" type="number" value="1" min="1" oninput="wsCalc()"></div>
            <div class="field" style="flex:1"><label>السبب</label>
                <select class="input" id="wsReason">${WASTE_REASONS.map(r => `<option>${r}</option>`).join('')}</select>
            </div>
            <div class="field" style="flex:1"><label>الكلفة المقدّرة</label><input class="input" id="wsCost" type="number" value="0"></div>
        </div>
        <div class="field"><label>ملاحظة</label><input class="input" id="wsNote" placeholder="تفاصيل إضافية"></div>
        <p style="font-size:12.5px;color:var(--muted)">⚠️ سيتم خصم الكمية من المخزون تلقائياً.</p>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-danger" style="flex:1" onclick="saveWaste()"><i class="bi bi-check2"></i> تسجيل الهدر</button>`);
    wsCalc();
}
function wsCalc() {
    const sel = document.getElementById('wsProd');
    const cost = Number(sel?.selectedOptions[0]?.dataset.cost || 0);
    const qty = Number(document.getElementById('wsQty')?.value || 0);
    const el = document.getElementById('wsCost');
    if (el) el.value = cost * qty;
}
function saveWaste() {
    const pid = document.getElementById('wsProd').value;
    const p = getProduct(pid);
    if (!p) { toast('اختر صنفاً', 'error'); return; }
    api.addWaste({
        productId: pid, productName: p.name,
        qty: Number(document.getElementById('wsQty').value) || 1,
        reason: document.getElementById('wsReason').value,
        cost: Number(document.getElementById('wsCost').value) || 0,
        note: document.getElementById('wsNote').value.trim()
    });
    closeModal('dynModal'); renderPayroll(); toast('تم تسجيل الهدر', 'success');
}
function delWaste(id) {
    if (!confirmAction('حذف هذا القيد؟')) return;
    api.deleteWaste(id); renderPayroll(); toast('تم الحذف', 'success');
}
