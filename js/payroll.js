/* ============================================
   الموارد البشرية — الرواتب الدورية والحضور والسلف والهدر
   ============================================ */

let _prMonth = new Date().toISOString().slice(0, 7);
let _prTab = 'payroll'; // payroll | profiles | attendance | advances | waste

const PAY_CYCLES = {
    daily: { label: 'يومي', icon: 'bi-calendar-day', unit: 'يوم' },
    weekly: { label: 'أسبوعي', icon: 'bi-calendar-week', unit: 'أسبوع' },
    monthly: { label: 'شهري', icon: 'bi-calendar-month', unit: 'شهر' }
};
const ATTENDANCE_STATUS = {
    present: { label: 'حاضر', cls: 'badge-success' },
    late: { label: 'متأخر', cls: 'badge-warning' },
    absent: { label: 'غائب', cls: 'badge-danger' },
    leave: { label: 'إجازة', cls: 'badge-info' },
    sick: { label: 'مرضية', cls: 'badge-dark' }
};

function payrollMonthRange(month = _prMonth) {
    const [y, m] = month.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    const key = d => {
        const yy = d.getFullYear(), mm = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
        return `${yy}-${mm}-${dd}`;
    };
    return { start, end, startKey: key(start), endKey: key(end), key };
}
function attendanceHours(a) {
    if (!a?.checkIn || !a?.checkOut) return 0;
    const [ih, im] = a.checkIn.split(':').map(Number), [oh, om] = a.checkOut.split(':').map(Number);
    return Math.max(0, Math.round((((oh * 60 + om) - (ih * 60 + im)) / 60) * 10) / 10);
}
function payrollPeriodLabel(p) {
    if (p.periodLabel) return p.periodLabel;
    if (p.periodStart && p.periodEnd && p.periodStart !== p.periodEnd) return `${p.periodStart} ← ${p.periodEnd}`;
    return p.periodStart || p.month || '—';
}

function renderPayroll() {
    const wrap = document.getElementById('payrollContainer');
    if (!wrap) return;

    const monthList = getPayroll().filter(p => p.month === _prMonth);
    const totalNet = monthList.reduce((s, p) => s + Number(p.net || 0), 0);
    const paidTotal = monthList.filter(p => p.paid).reduce((s, p) => s + Number(p.net || 0), 0);
    const monthAttendance = getAttendance().filter(a => a.date?.startsWith(_prMonth));
    const outstandingAdv = getSalaryAdvances().filter(a => !a.recovered).reduce((s, a) => s + Number(a.amount || 0), 0);

    wrap.innerHTML = `
        <div class="hr-hero">
            <div class="hr-hero-icon"><i class="bi bi-people-fill"></i></div>
            <div><h2>الموارد البشرية والرواتب</h2><p>أجور يومية وأسبوعية وشهرية، حضور وانصراف، سلف، وكلفة الهدر في مركز واحد.</p></div>
            <div class="spacer"></div>
            <div class="field" style="margin:0;min-width:175px"><label style="color:#fff">شهر العمل</label><input class="input" type="month" value="${_prMonth}" onchange="setPrMonth(this.value)"></div>
        </div>
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-people stat-icon"></i><div class="stat-label">الموظفون النشطون</div><div class="stat-value">${getUsers().filter(u => u.active !== false).length}</div></div>
            <div class="stat gold"><i class="bi bi-cash-stack stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">مستحقات ${_prMonth}</div><div class="stat-value" style="font-size:20px">${moneyNum(totalNet)}</div><div class="stat-trend">${monthList.length} دفعة دورية</div></div>
            <div class="stat green"><i class="bi bi-check2-circle stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">المصروف فعلياً</div><div class="stat-value" style="font-size:20px">${moneyNum(paidTotal)}</div><div class="stat-trend">المتبقي ${moneyNum(Math.max(0, totalNet - paidTotal))}</div></div>
            <div class="stat blue"><i class="bi bi-fingerprint stat-icon" style="color:rgba(37,99,235,.1)"></i><div class="stat-label">سجلات الحضور</div><div class="stat-value">${monthAttendance.length}</div><div class="stat-trend">سلف غير مستردة ${moneyNum(outstandingAdv)}</div></div>
        </div>

        <div class="seg-tabs payroll-tabs">
            ${[
                ['payroll', 'bi-cash-stack', 'المستحقات والصرف'],
                ['profiles', 'bi-person-vcard', 'عقود وأنظمة الأجر'],
                ['attendance', 'bi-fingerprint', 'الحضور والانصراف'],
                ['advances', 'bi-wallet2', 'السلف والاسترداد'],
                ['waste', 'bi-trash3', 'الهدر والتالف']
            ].map(([k, i, l]) => `<button class="seg ${_prTab === k ? 'active' : ''}" onclick="setPrTab('${k}')"><i class="bi ${i}"></i> ${l}</button>`).join('')}
        </div>
        <div id="prBody"></div>`;
    renderPrBody();
}
function setPrTab(t) { _prTab = t; renderPayroll(); }
function setPrMonth(m) { if (m) _prMonth = m; renderPayroll(); }

function renderPrBody() {
    const box = document.getElementById('prBody');
    if (!box) return;
    if (_prTab === 'profiles') return renderPayProfiles(box);
    if (_prTab === 'attendance') return renderAttendanceTab(box);
    if (_prTab === 'advances') return renderAdvancesTab(box);
    if (_prTab === 'waste') return renderWasteTab(box);
    renderPayrollLedger(box);
}

/* ============ دفتر المستحقات ============ */
function renderPayrollLedger(box) {
    const list = getPayroll().filter(p => p.month === _prMonth).sort((a, b) => String(b.periodStart || '').localeCompare(String(a.periodStart || '')));
    box.innerHTML = `
        <div class="toolbar">
            <div class="payroll-guide"><i class="bi bi-magic"></i><span><b>التوليد الذكي:</b> الشهري مرة، الأسبوعي لكل أسبوع، واليومي بحسب أيام الحضور المسجلة.</span></div>
            <div class="spacer"></div>
            <button class="btn btn-gold" onclick="generatePayrollMonth()"><i class="bi bi-stars"></i> توليد المستحقات</button>
            <button class="btn btn-light" onclick="printPayroll()"><i class="bi bi-printer"></i> طباعة الكشف</button>
            <button class="btn btn-primary" data-perm="payroll" onclick="guard('payroll', () => openPayrollForm())"><i class="bi bi-plus-lg"></i> قيد يدوي</button>
        </div>
        <div class="card">
            <div class="table-wrap"><table class="tbl payroll-table">
                <thead><tr><th>الموظف</th><th>نظام الأجر</th><th>الفترة</th><th>الأساسي</th><th>مكافآت</th><th>استقطاعات</th><th>سلف</th><th>الصافي</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                <tbody>${list.length ? list.map(p => {
                    const cyc = PAY_CYCLES[p.cycle || 'monthly'] || PAY_CYCLES.monthly;
                    return `<tr>
                        <td><div class="cell-main"><div class="cell-thumb payroll-avatar">${(p.userName || '؟').charAt(0)}</div><div><strong>${p.userName}</strong>${p.generatedKey ? '<small>مولّد آلياً</small>' : '<small>قيد يدوي</small>'}</div></div></td>
                        <td><span class="badge badge-dark"><i class="bi ${cyc.icon}"></i> ${cyc.label}</span></td>
                        <td><strong>${payrollPeriodLabel(p)}</strong>${p.units ? `<small class="table-sub">${p.units} ${cyc.unit}</small>` : ''}</td>
                        <td>${moneyNum(p.base)}</td>
                        <td style="color:var(--success)">+${moneyNum(p.bonus)}</td>
                        <td style="color:var(--danger)">−${moneyNum(p.deduction)}</td>
                        <td style="color:var(--warning)">−${moneyNum(p.advance)}</td>
                        <td><strong style="font-size:15px;color:var(--primary-dark)">${moneyNum(p.net)}</strong></td>
                        <td><span class="badge ${p.paid ? 'badge-success' : 'badge-warning'}">${p.paid ? `مصروف ${fmtDate(p.paidAt)}` : 'بانتظار الصرف'}</span></td>
                        <td><div style="display:flex;gap:5px">
                            ${!p.paid ? `<button class="icon-btn action-success" data-perm="payroll" onclick="doPayPayroll('${p.id}')" title="صرف وتسجيل مصروف"><i class="bi bi-cash"></i></button><button class="icon-btn action-edit" onclick="openPayrollForm('${p.id}')" title="تعديل"><i class="bi bi-pencil"></i></button>` : ''}
                            <button class="icon-btn action-danger" data-perm="payroll" onclick="delPayroll('${p.id}')" title="حذف"><i class="bi bi-trash"></i></button>
                        </div></td>
                    </tr>`;
                }).join('') : `<tr><td colspan="10"><div class="empty-state"><i class="bi bi-cash-stack"></i><p>لا توجد مستحقات لهذا الشهر<br><small>اضغط «توليد المستحقات» للاحتساب حسب نظام كل موظف</small></p></div></td></tr>`}</tbody>
            </table></div>
        </div>`;
    applyPermissions();
}

function openPayrollForm(id) {
    const p = id ? getPayroll().find(x => x.id === id) : null;
    const firstUser = getUsers()[0];
    const cycle = p?.cycle || firstUser?.payCycle || 'monthly';
    const mr = payrollMonthRange(p?.month || _prMonth);
    openModalContent(p ? 'تعديل قيد مستحق' : 'إضافة مستحق يدوي', `
        <div class="row-flex">
            <div class="field" style="flex:2"><label>الموظف *</label><select class="input" id="prUser" onchange="syncPayrollRateFromUser()">${getUsers().map(u => `<option value="${u.id}" ${p?.userId === u.id ? 'selected' : ''}>${u.avatar || ''} ${u.name} — ${u.jobTitle || ROLE_LABEL[u.role]}</option>`).join('')}</select></div>
            <div class="field" style="flex:1"><label>نظام الأجر</label><select class="input" id="prCycle" onchange="updatePayrollUnitLabel()">${Object.entries(PAY_CYCLES).map(([k,v]) => `<option value="${k}" ${(p?.cycle || cycle) === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>من تاريخ</label><input class="input" id="prStart" type="date" value="${p?.periodStart || mr.startKey}"></div>
            <div class="field" style="flex:1"><label>إلى تاريخ</label><input class="input" id="prEnd" type="date" value="${p?.periodEnd || mr.endKey}"></div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>أجر الوحدة</label><input class="input" id="prRate" type="number" value="${p?.rate ?? firstUser?.salaryRate ?? 0}" oninput="calcPayrollBase()"></div>
            <div class="field" style="flex:1"><label id="prUnitsLabel">عدد الوحدات</label><input class="input" id="prUnits" type="number" step="0.5" min="0" value="${p?.units || 1}" oninput="calcPayrollBase()"></div>
            <div class="field" style="flex:1"><label>الراتب الأساسي</label><input class="input" id="prBase" type="number" value="${p?.base || 0}" oninput="calcNet()"></div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>مكافآت / إضافي</label><input class="input" id="prBonus" type="number" value="${p?.bonus || 0}" oninput="calcNet()"></div>
            <div class="field" style="flex:1"><label>استقطاعات</label><input class="input" id="prDed" type="number" value="${p?.deduction || 0}" oninput="calcNet()"></div>
            <div class="field" style="flex:1"><label>استرداد سلفة</label><input class="input" id="prAdv" type="number" value="${p?.advance || 0}" oninput="calcNet()"></div>
        </div>
        <div class="net-preview"><span>صافي المستحق</span><strong id="prNet">0</strong><small>${getSettings().currency}</small></div>
        <div class="field"><label>ملاحظة</label><input class="input" id="prNote" value="${p?.note || ''}" placeholder="تفاصيل المكافأة أو الاستقطاع"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button><button class="btn btn-primary" style="flex:1" onclick="savePayroll('${id || ''}')"><i class="bi bi-check2"></i> حفظ القيد</button>`, 'lg');
    if (!p) syncPayrollRateFromUser(); else { updatePayrollUnitLabel(); calcNet(); }
}
function syncPayrollRateFromUser() {
    const u = getUser(document.getElementById('prUser')?.value); if (!u) return;
    document.getElementById('prCycle').value = u.payCycle || 'monthly';
    document.getElementById('prRate').value = Number(u.salaryRate || 0);
    document.getElementById('prUnits').value = 1;
    updatePayrollUnitLabel(); calcPayrollBase();
}
function updatePayrollUnitLabel() {
    const c = PAY_CYCLES[document.getElementById('prCycle')?.value] || PAY_CYCLES.monthly;
    const el = document.getElementById('prUnitsLabel'); if (el) el.textContent = `عدد الوحدات (${c.unit})`;
}
function calcPayrollBase() {
    const rate = Number(document.getElementById('prRate')?.value || 0), units = Number(document.getElementById('prUnits')?.value || 0);
    const el = document.getElementById('prBase'); if (el) el.value = Math.round(rate * units);
    calcNet();
}
function calcNet() {
    const v = id => Number(document.getElementById(id)?.value || 0);
    const net = v('prBase') + v('prBonus') - v('prDed') - v('prAdv');
    const el = document.getElementById('prNet'); if (el) el.textContent = moneyNum(net);
}
function savePayroll(id) {
    const uId = document.getElementById('prUser').value, u = getUser(uId);
    const start = document.getElementById('prStart').value, end = document.getElementById('prEnd').value;
    if (!start || !end || start > end) { toast('تحقق من تاريخ بداية ونهاية الفترة', 'error'); return; }
    const data = {
        userId: uId, userName: u?.name || '-', month: start.slice(0, 7), cycle: document.getElementById('prCycle').value,
        periodStart: start, periodEnd: end, rate: Number(document.getElementById('prRate').value) || 0,
        units: Number(document.getElementById('prUnits').value) || 0, base: Number(document.getElementById('prBase').value) || 0,
        bonus: Number(document.getElementById('prBonus').value) || 0, deduction: Number(document.getElementById('prDed').value) || 0,
        advance: Number(document.getElementById('prAdv').value) || 0, note: document.getElementById('prNote').value.trim()
    };
    if (id) api.updatePayroll(id, data); else api.addPayroll(data);
    _prMonth = data.month; closeModal('dynModal'); renderPayroll(); toast('تم حفظ المستحق ✅', 'success');
}
function doPayPayroll(id) {
    const p = getPayroll().find(x => x.id === id); if (!p || p.paid) return;
    if (!confirmAction(`صرف ${money(p.net)} إلى ${p.userName}؟ سيُسجّل كمصروف تلقائياً.`)) return;
    api.payPayroll(id); renderPayroll(); toast('تم الصرف وتسجيله في المصروفات واسترداد السلف المرتبطة ✅', 'success');
}
function delPayroll(id) {
    const p = getPayroll().find(x => x.id === id); if (!p) return;
    if (p.paid && !confirmAction('هذا القيد مصروف فعلياً. حذفه لن يحذف المصروف المالي المرتبط. متابعة؟')) return;
    if (!p.paid && !confirmAction('حذف هذا القيد؟')) return;
    api.deletePayroll(id); renderPayroll(); toast('تم حذف القيد', 'success');
}

/* توليد مستحقات يومية / أسبوعية / شهرية بلا تكرار */
function generatePayrollMonth() {
    if (!can('payroll')) { denied(); return; }
    const mr = payrollMonthRange();
    const todayKey = new Date().toISOString().slice(0, 10);
    const existing = new Set(getPayroll().filter(p => p.month === _prMonth && p.generatedKey).map(p => p.generatedKey));
    const pendingAdvances = userId => getSalaryAdvances().filter(a => a.userId === userId && !a.recovered && a.date <= mr.endKey);
    const drafts = [];

    getUsers().filter(u => u.active !== false).forEach(u => {
        const cycle = u.payCycle || 'monthly', rate = Number(u.salaryRate || 0);
        if (rate <= 0) return;
        if (cycle === 'monthly') {
            const key = `${u.id}:${_prMonth}:monthly`;
            if (!existing.has(key)) drafts.push({ u, cycle, rate, units: 1, base: rate, start: mr.startKey, end: mr.endKey, key, label: `شهر ${_prMonth}` });
        } else if (cycle === 'weekly') {
            let d = new Date(mr.start);
            while (d <= mr.end) {
                const st = new Date(d), en = new Date(d); en.setDate(en.getDate() + 6); if (en > mr.end) en.setTime(mr.end.getTime());
                const start = mr.key(st), end = mr.key(en), key = `${u.id}:${start}:weekly`;
                if (!existing.has(key) && (end <= todayKey || _prMonth < todayKey.slice(0,7))) drafts.push({ u, cycle, rate, units: 1, base: rate, start, end, key, label: `${start} ← ${end}` });
                d.setDate(d.getDate() + 7);
            }
        } else {
            getAttendance().filter(a => a.userId === u.id && a.date?.startsWith(_prMonth) && ['present','late'].includes(a.status)).forEach(a => {
                const key = `${u.id}:${a.date}:daily`;
                if (!existing.has(key)) drafts.push({ u, cycle, rate, units: 1, base: rate, start: a.date, end: a.date, key, label: a.date });
            });
        }
    });
    if (!drafts.length) { toast('لا توجد مستحقات جديدة. تأكد من ضبط الأجور وتسجيل حضور الموظفين اليوميين.', 'info', 5000); return; }
    if (!confirmAction(`سيتم إنشاء ${drafts.length} دفعة مستحقة محسوبة آلياً لشهر ${_prMonth}. متابعة؟`)) return;

    const advanceAssigned = new Set();
    drafts.forEach(d => {
        const advances = advanceAssigned.has(d.u.id) ? [] : pendingAdvances(d.u.id);
        if (advances.length) advanceAssigned.add(d.u.id);
        api.addPayroll({
            userId: d.u.id, userName: d.u.name, month: _prMonth, cycle: d.cycle,
            periodStart: d.start, periodEnd: d.end, periodLabel: d.label, generatedKey: d.key,
            rate: d.rate, units: d.units, base: d.base, bonus: 0, deduction: 0,
            advance: advances.reduce((s, a) => s + Number(a.amount || 0), 0), advanceIds: advances.map(a => a.id)
        });
    });
    renderPayroll(); toast(`تم توليد ${drafts.length} مستحق بنجاح ✅`, 'success');
}
function printPayroll() {
    const list = getPayroll().filter(p => p.month === _prMonth);
    const rows = list.map(p => `<tr><td>${p.userName}</td><td>${PAY_CYCLES[p.cycle || 'monthly'].label}</td><td>${payrollPeriodLabel(p)}</td><td>${moneyNum(p.base)}</td><td>${moneyNum(p.bonus)}</td><td>${moneyNum(p.deduction)}</td><td>${moneyNum(p.advance)}</td><td><strong>${moneyNum(p.net)}</strong></td><td>${p.paid ? 'مصروف' : 'معلّق'}</td></tr>`).join('') || `<tr><td colspan="9">لا توجد قيود</td></tr>`;
    const total = list.reduce((s, p) => s + Number(p.net || 0), 0);
    printElement(reportShell('كشف مستحقات ورواتب الموظفين', `<table class="rep-tbl"><thead><tr><th>الموظف</th><th>النظام</th><th>الفترة</th><th>الأساسي</th><th>مكافآت</th><th>استقطاع</th><th>سلف</th><th>الصافي</th><th>الحالة</th></tr></thead><tbody>${rows}<tr><td colspan="7" style="font-weight:900">الإجمالي</td><td style="font-weight:900">${moneyNum(total)}</td><td></td></tr></tbody></table>`, `شهر العمل: ${_prMonth}`));
}

/* ============ ملفات الأجر والعقود ============ */
function renderPayProfiles(box) {
    const users = getUsers();
    box.innerHTML = `
        <div class="toolbar"><div class="payroll-guide"><i class="bi bi-info-circle"></i><span>حدد طريقة احتساب كل موظف. يستخدمها التوليد الذكي ولا يغيّر صلاحيات دخوله.</span></div></div>
        <div class="pay-profile-grid">${users.map(u => {
            const c = PAY_CYCLES[u.payCycle || 'monthly'];
            const att = getAttendance().filter(a => a.userId === u.id && a.date?.startsWith(_prMonth) && ['present','late'].includes(a.status));
            return `<div class="pay-profile-card">
                <div class="pp-head"><div class="uc-avatar">${u.avatar || '🧑'}</div><div><strong>${u.name}</strong><span>${u.jobTitle || ROLE_LABEL[u.role]}</span></div><span class="badge badge-gold"><i class="bi ${c.icon}"></i> ${c.label}</span></div>
                <div class="pp-rate"><span>الأجر لكل ${c.unit}</span><strong>${money(u.salaryRate || 0)}</strong></div>
                <div class="pp-meta"><span><i class="bi bi-clock"></i> ${u.shiftHours || 8} ساعات / وردية</span><span><i class="bi bi-calendar-check"></i> ${att.length} حضور هذا الشهر</span></div>
                <button class="btn btn-light btn-block" onclick="openPayProfile('${u.id}')"><i class="bi bi-pencil-square"></i> تعديل نظام الأجر</button>
            </div>`;
        }).join('')}</div>`;
}
function openPayProfile(userId) {
    const u = getUser(userId); if (!u) return;
    openModalContent(`نظام أجر — ${u.name}`, `
        <div class="profile-pay-banner"><span>${u.avatar || '🧑'}</span><div><strong>${u.name}</strong><small>${u.jobTitle || ''}</small></div></div>
        <div class="field"><label>دورية الأجر</label><div class="cycle-picker">${Object.entries(PAY_CYCLES).map(([k,c]) => `<label class="cycle-option"><input type="radio" name="profileCycle" value="${k}" ${(u.payCycle || 'monthly') === k ? 'checked' : ''}><span><i class="bi ${c.icon}"></i><b>${c.label}</b><small>أجر لكل ${c.unit}</small></span></label>`).join('')}</div></div>
        <div class="row-flex"><div class="field" style="flex:1"><label>قيمة الأجر (د.ع)</label><input class="input" id="profileRate" type="number" value="${u.salaryRate || 0}"></div><div class="field" style="flex:1"><label>ساعات الوردية القياسية</label><input class="input" id="profileHours" type="number" min="1" max="24" value="${u.shiftHours || 8}"></div></div>
        <div class="role-hint"><i class="bi bi-lightbulb"></i> اليومي يحتاج سجل حضور ليُنشأ مستحقه. الأسبوعي ينشئ دفعة لكل 7 أيام، والشهري ينشئ دفعة واحدة.</div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button><button class="btn btn-primary" style="flex:1" onclick="savePayProfile('${u.id}')"><i class="bi bi-check2"></i> حفظ النظام</button>`);
}
function savePayProfile(userId) {
    const cycle = document.querySelector('input[name="profileCycle"]:checked')?.value || 'monthly';
    const rate = Math.max(0, Number(document.getElementById('profileRate').value) || 0), hours = Math.max(1, Number(document.getElementById('profileHours').value) || 8);
    if (!rate) { toast('أدخل قيمة الأجر', 'error'); return; }
    api.updateUser(userId, { payCycle: cycle, salaryRate: rate, shiftHours: hours });
    closeModal('dynModal'); renderPayroll(); toast('تم تحديث نظام الأجر ✅', 'success');
}

/* ============ الحضور والانصراف ============ */
function renderAttendanceTab(box) {
    const list = getAttendance().filter(a => a.date?.startsWith(_prMonth)).sort((a,b) => (b.date + b.checkIn).localeCompare(a.date + a.checkIn));
    const today = new Date().toISOString().slice(0,10), me = currentUser();
    const todayMine = getAttendance().find(a => a.userId === me?.id && a.date === today);
    const present = list.filter(a => ['present','late'].includes(a.status)).length;
    const hours = list.reduce((s,a) => s + attendanceHours(a), 0);
    const late = list.reduce((s,a) => s + Number(a.lateMinutes || 0), 0);
    box.innerHTML = `
        <div class="attendance-actions">
            <div><strong>بصمة اليوم — ${today}</strong><span>${todayMine ? `دخول ${todayMine.checkIn || '—'} ${todayMine.checkOut ? '• خروج ' + todayMine.checkOut : '• لم يسجل خروج'}` : 'لم تسجل حضورك اليوم'}</span></div>
            ${!todayMine ? `<button class="btn btn-success" onclick="quickAttendanceIn()"><i class="bi bi-box-arrow-in-left"></i> تسجيل دخول الآن</button>` : !todayMine.checkOut ? `<button class="btn btn-danger" onclick="quickAttendanceOut('${todayMine.id}')"><i class="bi bi-box-arrow-right"></i> تسجيل خروج الآن</button>` : '<span class="badge badge-success"><i class="bi bi-check2-circle"></i> مكتملة</span>'}
        </div>
        <div class="stats-grid compact-stats"><div class="stat"><div class="stat-label">أيام حضور</div><div class="stat-value">${present}</div></div><div class="stat green"><div class="stat-label">ساعات مسجلة</div><div class="stat-value">${hours}</div></div><div class="stat gold"><div class="stat-label">دقائق تأخير</div><div class="stat-value">${late}</div></div><div class="stat blue"><div class="stat-label">غياب وإجازات</div><div class="stat-value">${list.filter(a=>['absent','leave','sick'].includes(a.status)).length}</div></div></div>
        <div class="toolbar"><div class="spacer"></div><button class="btn btn-primary" onclick="openAttendanceForm()"><i class="bi bi-plus-lg"></i> سجل حضور يدوي</button></div>
        <div class="card"><div class="table-wrap"><table class="tbl"><thead><tr><th>الموظف</th><th>التاريخ</th><th>الدخول</th><th>الخروج</th><th>الساعات</th><th>التأخير</th><th>الإضافي</th><th>الحالة</th><th>ملاحظة</th><th></th></tr></thead><tbody>
        ${list.length ? list.map(a => { const st = ATTENDANCE_STATUS[a.status] || ATTENDANCE_STATUS.present; return `<tr><td><strong>${a.userName}</strong></td><td>${a.date}</td><td>${a.checkIn || '—'}</td><td>${a.checkOut || '—'}</td><td><strong>${attendanceHours(a)}</strong></td><td>${a.lateMinutes || 0} د</td><td>${a.overtimeMinutes || 0} د</td><td><span class="badge ${st.cls}">${st.label}</span></td><td>${a.note || '—'}</td><td><div style="display:flex;gap:5px"><button class="icon-btn action-edit" onclick="openAttendanceForm('${a.id}')"><i class="bi bi-pencil"></i></button><button class="icon-btn action-danger" onclick="deleteAttendance('${a.id}')"><i class="bi bi-trash"></i></button></div></td></tr>`; }).join('') : '<tr><td colspan="10"><div class="empty-state"><i class="bi bi-fingerprint"></i><p>لا توجد سجلات حضور في هذا الشهر</p></div></td></tr>'}
        </tbody></table></div></div>`;
}
function quickAttendanceIn() {
    const u = currentUser(), now = new Date(); if (!u) return;
    const time = now.toTimeString().slice(0,5), date = now.toISOString().slice(0,10);
    if (getAttendance().some(a => a.userId === u.id && a.date === date)) { toast('تم تسجيل حضورك اليوم مسبقاً', 'info'); return; }
    api.addAttendance({ userId: u.id, userName: u.name, date, checkIn: time, status: 'present' }); renderPayroll(); toast(`تم تسجيل الدخول ${time} ✅`, 'success');
}
function quickAttendanceOut(id) {
    const a = getAttendance().find(x => x.id === id); if (!a) return;
    const time = new Date().toTimeString().slice(0,5); api.updateAttendance(id, { checkOut: time }); renderPayroll(); toast(`تم تسجيل الخروج ${time} ✅`, 'success');
}
function openAttendanceForm(id) {
    const a = id ? getAttendance().find(x => x.id === id) : null;
    openModalContent(a ? 'تعديل سجل الحضور' : 'إضافة حضور / غياب', `
        <div class="row-flex"><div class="field" style="flex:2"><label>الموظف</label><select class="input" id="attUser">${getUsers().map(u=>`<option value="${u.id}" ${a?.userId===u.id?'selected':''}>${u.avatar||''} ${u.name}</option>`).join('')}</select></div><div class="field" style="flex:1"><label>التاريخ</label><input class="input" id="attDate" type="date" value="${a?.date || new Date().toISOString().slice(0,10)}"></div></div>
        <div class="row-flex"><div class="field" style="flex:1"><label>وقت الدخول</label><input class="input" id="attIn" type="time" value="${a?.checkIn || '09:00'}"></div><div class="field" style="flex:1"><label>وقت الخروج</label><input class="input" id="attOut" type="time" value="${a?.checkOut || '17:00'}"></div><div class="field" style="flex:1"><label>الحالة</label><select class="input" id="attStatus">${Object.entries(ATTENDANCE_STATUS).map(([k,v])=>`<option value="${k}" ${a?.status===k?'selected':''}>${v.label}</option>`).join('')}</select></div></div>
        <div class="row-flex"><div class="field" style="flex:1"><label>دقائق التأخير</label><input class="input" id="attLate" type="number" min="0" value="${a?.lateMinutes || 0}"></div><div class="field" style="flex:1"><label>دقائق العمل الإضافي</label><input class="input" id="attOver" type="number" min="0" value="${a?.overtimeMinutes || 0}"></div></div>
        <div class="field"><label>ملاحظة</label><input class="input" id="attNote" value="${a?.note || ''}" placeholder="سبب الغياب أو التأخير"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button><button class="btn btn-primary" style="flex:1" onclick="saveAttendance('${id || ''}')"><i class="bi bi-check2"></i> حفظ</button>`);
}
function saveAttendance(id) {
    const userId = document.getElementById('attUser').value, u = getUser(userId), date = document.getElementById('attDate').value;
    if (!date) { toast('حدد التاريخ', 'error'); return; }
    if (!id && getAttendance().some(a => a.userId === userId && a.date === date)) { toast('يوجد سجل لهذا الموظف في نفس اليوم', 'warning'); return; }
    const data = { userId, userName: u?.name || '-', date, checkIn: document.getElementById('attIn').value, checkOut: document.getElementById('attOut').value, status: document.getElementById('attStatus').value, lateMinutes: Number(document.getElementById('attLate').value)||0, overtimeMinutes: Number(document.getElementById('attOver').value)||0, note: document.getElementById('attNote').value.trim() };
    if (id) api.updateAttendance(id, data); else api.addAttendance(data);
    _prMonth = date.slice(0,7); closeModal('dynModal'); renderPayroll(); toast('تم حفظ الحضور ✅', 'success');
}
function deleteAttendance(id) { if (!confirmAction('حذف سجل الحضور؟')) return; api.deleteAttendance(id); renderPayroll(); }

/* ============ السلف ============ */
function renderAdvancesTab(box) {
    const list = getSalaryAdvances().slice().sort((a,b)=>b.createdAt-a.createdAt), open = list.filter(a=>!a.recovered), recovered = list.filter(a=>a.recovered);
    box.innerHTML = `
        <div class="advance-summary"><div><span>سلف قيد الاسترداد</span><strong>${money(open.reduce((s,a)=>s+Number(a.amount||0),0))}</strong></div><div><span>عدد الموظفين المدينين</span><strong>${new Set(open.map(a=>a.userId)).size}</strong></div><div><span>تم استرداده</span><strong>${money(recovered.reduce((s,a)=>s+Number(a.amount||0),0))}</strong></div><button class="btn btn-primary" onclick="openAdvanceForm()"><i class="bi bi-plus-lg"></i> منح سلفة</button></div>
        <div class="card"><div class="table-wrap"><table class="tbl"><thead><tr><th>الموظف</th><th>المبلغ</th><th>تاريخ المنح</th><th>الحالة</th><th>قيد الراتب</th><th>ملاحظة</th><th></th></tr></thead><tbody>
        ${list.length ? list.map(a=>`<tr><td><strong>${a.userName}</strong></td><td><strong>${moneyNum(a.amount)}</strong></td><td>${a.date}</td><td><span class="badge ${a.recovered?'badge-success':'badge-warning'}">${a.recovered?'مستردة':'تُخصم من المستحق القادم'}</span></td><td>${a.payrollId ? `<button class="btn btn-light btn-sm" onclick="_prTab='payroll';renderPayroll()"><i class="bi bi-receipt"></i> مرتبط</button>` : '—'}</td><td>${a.note||'—'}</td><td>${!a.recovered?`<button class="icon-btn action-danger" onclick="deleteAdvance('${a.id}')"><i class="bi bi-trash"></i></button>`:''}</td></tr>`).join('') : '<tr><td colspan="7"><div class="empty-state"><i class="bi bi-wallet2"></i><p>لا توجد سلف مسجلة</p></div></td></tr>'}
        </tbody></table></div></div>`;
}
function openAdvanceForm() {
    openModalContent('منح سلفة موظف', `<div class="field"><label>الموظف</label><select class="input" id="advUser">${getUsers().filter(u=>u.active!==false).map(u=>`<option value="${u.id}">${u.avatar||''} ${u.name}</option>`).join('')}</select></div><div class="row-flex"><div class="field" style="flex:1"><label>المبلغ</label><input class="input" id="advAmount" type="number" min="1" placeholder="د.ع"></div><div class="field" style="flex:1"><label>التاريخ</label><input class="input" id="advDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div></div><div class="field"><label>السبب / الملاحظة</label><input class="input" id="advNote" placeholder="اختياري"></div><div class="role-hint"><i class="bi bi-info-circle"></i> ستُسجل كحركة نقدية في المصروفات، ثم تظهر تلقائياً كاستقطاع في أول مستحق قادم وتُغلق عند صرفه.</div>`, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button><button class="btn btn-primary" style="flex:1" onclick="saveAdvance()"><i class="bi bi-check2"></i> تسجيل السلفة</button>`);
}
function saveAdvance() {
    const userId=document.getElementById('advUser').value,u=getUser(userId),amount=Math.max(0,Number(document.getElementById('advAmount').value)||0);
    if (!amount) { toast('أدخل مبلغ السلفة', 'error'); return; }
    api.addSalaryAdvance({userId,userName:u?.name||'-',amount,date:document.getElementById('advDate').value,note:document.getElementById('advNote').value.trim()}); closeModal('dynModal');renderPayroll();toast('تم تسجيل السلفة وستُخصم من المستحق القادم','success');
}
function deleteAdvance(id){if(!confirmAction('حذف السلفة غير المستردة؟'))return;api.deleteSalaryAdvance(id);renderPayroll();}

/* ============ سجل الهدر ============ */
const WASTE_REASONS = ['تالف', 'انتهت الصلاحية', 'خطأ تحضير', 'إرجاع عميل', 'كسر', 'ضيافة/مجاناً', 'أخرى'];
function renderWasteTab(box) {
    const list = getWastes().filter(w => new Date(w.createdAt).toISOString().slice(0,7) === _prMonth);
    const totalCost = list.reduce((s,w)=>s+Number(w.cost||0),0), byReason={}; list.forEach(w=>byReason[w.reason]=(byReason[w.reason]||0)+Number(w.cost||0));
    box.innerHTML=`<div class="toolbar"><div class="filter-pills">${Object.entries(byReason).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([r,v])=>`<span class="pill">${r}: ${moneyNum(v)}</span>`).join('')}</div><div class="spacer"></div><button class="btn btn-danger" data-perm="waste" onclick="guard('waste',()=>openWasteForm())"><i class="bi bi-plus-lg"></i> تسجيل هدر</button></div><div class="card"><div class="table-wrap"><table class="tbl"><thead><tr><th>الصنف</th><th>الكمية</th><th>السبب</th><th>الكلفة</th><th>المستخدم</th><th>التاريخ</th><th>ملاحظة</th><th></th></tr></thead><tbody>${list.length?list.map(w=>`<tr><td><strong>${w.productName}</strong></td><td>${w.qty}</td><td><span class="badge badge-warning">${w.reason}</span></td><td style="color:var(--danger);font-weight:800">${moneyNum(w.cost)}</td><td>${w.userName}</td><td>${fmtDateTime(w.createdAt)}</td><td>${w.note||'—'}</td><td><button class="icon-btn action-danger" onclick="delWaste('${w.id}')"><i class="bi bi-trash"></i></button></td></tr>`).join(''):`<tr><td colspan="8"><div class="empty-state"><i class="bi bi-trash3"></i><p>لا يوجد هدر مسجل في هذا الشهر — ممتاز!</p></div></td></tr>`}</tbody>${list.length?`<tfoot><tr><td colspan="3"><strong>الإجمالي</strong></td><td colspan="5"><strong style="color:var(--danger)">${moneyNum(totalCost)}</strong></td></tr></tfoot>`:''}</table></div></div>`; applyPermissions();
}
function openWasteForm(){openModalContent('تسجيل هدر / تالف',`<div class="field"><label>الصنف *</label><select class="input" id="wsProd" onchange="wsCalc()">${getProducts().map(p=>`<option value="${p.id}" data-cost="${p.cost||0}">${p.emoji||''} ${p.name} (متوفر: ${Number(p.stock||0)})</option>`).join('')}</select></div><div class="row-flex"><div class="field" style="flex:1"><label>الكمية</label><input class="input" id="wsQty" type="number" value="1" min="1" oninput="wsCalc()"></div><div class="field" style="flex:1"><label>السبب</label><select class="input" id="wsReason">${WASTE_REASONS.map(r=>`<option>${r}</option>`).join('')}</select></div><div class="field" style="flex:1"><label>الكلفة المقدّرة</label><input class="input" id="wsCost" type="number" value="0"></div></div><div class="field"><label>ملاحظة</label><input class="input" id="wsNote"></div><p class="form-warning">سيتم خصم الكمية من المخزون تلقائياً.</p>`,`<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button><button class="btn btn-danger" style="flex:1" onclick="saveWaste()"><i class="bi bi-check2"></i> تسجيل الهدر</button>`);wsCalc();}
function wsCalc(){const sel=document.getElementById('wsProd'),cost=Number(sel?.selectedOptions[0]?.dataset.cost||0),qty=Number(document.getElementById('wsQty')?.value||0),el=document.getElementById('wsCost');if(el)el.value=cost*qty;}
function saveWaste(){const pid=document.getElementById('wsProd').value,p=getProduct(pid);if(!p){toast('اختر صنفاً','error');return;}api.addWaste({productId:pid,productName:p.name,qty:Number(document.getElementById('wsQty').value)||1,reason:document.getElementById('wsReason').value,cost:Number(document.getElementById('wsCost').value)||0,note:document.getElementById('wsNote').value.trim()});closeModal('dynModal');renderPayroll();toast('تم تسجيل الهدر وخصمه من المخزون','success');}
function delWaste(id){if(!confirmAction('حذف هذا القيد؟ (لن تعاد الكمية للمخزون)'))return;api.deleteWaste(id);renderPayroll();toast('تم الحذف','success');}
