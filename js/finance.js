/* ============================================
   المالية — المصروفات والورديات (تقفيل الصندوق)
   ============================================ */

const EXPENSE_CATS = ['مشتريات', 'رواتب', 'سلف موظفين', 'إيجار', 'كهرباء وماء', 'صيانة', 'نقل وتوصيل', 'تسويق', 'أخرى'];
const EXPENSE_ICON = {
    'مشتريات': 'bi-cart', 'رواتب': 'bi-people', 'سلف موظفين': 'bi-person-down', 'إيجار': 'bi-house', 'كهرباء وماء': 'bi-lightning',
    'صيانة': 'bi-tools', 'نقل وتوصيل': 'bi-truck', 'تسويق': 'bi-megaphone', 'أخرى': 'bi-three-dots'
};

let _expRange = 'month';

/* ============ المصروفات ============ */
function renderExpenses() {
    const wrap = document.getElementById('expensesContainer');
    if (!wrap) return;
    const { from, label } = rangeBounds(_expRange);
    const list = getExpenses().filter(e => e.createdAt >= from);
    const total = list.reduce((s, e) => s + Number(e.amount || 0), 0);
    const revenue = getOrders().filter(o => o.createdAt >= from && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    const net = revenue - total;
    const byCat = EXPENSE_CATS.map(c => ({ c, v: list.filter(e => e.category === c).reduce((s, e) => s + Number(e.amount || 0), 0) }))
        .filter(x => x.v > 0).sort((a, b) => b.v - a.v);

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-wallet2 stat-icon"></i><div class="stat-label">مصروفات ${label}</div><div class="stat-value" style="font-size:21px">${moneyNum(total)}</div></div>
            <div class="stat green"><i class="bi bi-cash-stack stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">إيرادات ${label}</div><div class="stat-value" style="font-size:21px">${moneyNum(revenue)}</div></div>
            <div class="stat ${net >= 0 ? 'gold' : ''}"><i class="bi bi-graph-up stat-icon"></i><div class="stat-label">صافي الربح</div><div class="stat-value" style="font-size:21px;color:${net >= 0 ? 'var(--success)' : 'var(--danger)'}">${moneyNum(net)}</div></div>
            <div class="stat blue"><i class="bi bi-receipt-cutoff stat-icon" style="color:rgba(37,99,235,.1)"></i><div class="stat-label">عدد القيود</div><div class="stat-value">${list.length}</div></div>
        </div>

        <div class="toolbar">
            <div class="filter-pills">
                ${[['today', 'اليوم'], ['week', 'الأسبوع'], ['month', 'الشهر'], ['all', 'الكل']].map(([k, l]) =>
                    `<span class="pill ${_expRange === k ? 'active' : ''}" onclick="setExpRange('${k}')">${l}</span>`).join('')}
            </div>
            <div class="spacer"></div>
            <button class="btn btn-gold" onclick="printExpenses()"><i class="bi bi-printer"></i> تقرير المصروفات</button>
            <button class="btn btn-primary" data-perm="expenses" onclick="guard('expenses', () => openExpenseForm())"><i class="bi bi-plus-lg"></i> تسجيل مصروف</button>
        </div>

        ${byCat.length ? `<div class="cat-bars card card-pad">
            <h3 class="ss-title"><i class="bi bi-pie-chart"></i> توزيع المصروفات</h3>
            ${byCat.map(x => `
                <div class="cb-row">
                    <span class="cb-label"><i class="bi ${EXPENSE_ICON[x.c] || 'bi-dot'}"></i> ${x.c}</span>
                    <div class="cb-track"><div class="cb-fill" style="width:${Math.round(x.v / total * 100)}%"></div></div>
                    <span class="cb-val">${moneyNum(x.v)}</span>
                </div>`).join('')}
        </div>` : ''}

        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>البيان</th><th>التصنيف</th><th>المبلغ</th><th>بواسطة</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
                    <tbody>
                    ${list.length ? list.map(e => `
                        <tr>
                            <td><strong>${e.title}</strong>${e.note ? `<div style="font-size:11px;color:var(--muted)">${e.note}</div>` : ''}</td>
                            <td><span class="badge badge-dark"><i class="bi ${EXPENSE_ICON[e.category] || 'bi-dot'}"></i> ${e.category}</span></td>
                            <td><strong style="color:var(--danger)">${moneyNum(e.amount)}</strong></td>
                            <td>${e.userName || '-'}</td>
                            <td style="font-size:12px;color:var(--muted)">${fmtDateTime(e.createdAt)}</td>
                            <td>
                                <div style="display:flex;gap:5px">
                                    <button class="icon-btn" style="width:32px;height:32px;font-size:14px" data-perm="expenses" onclick="guard('expenses', () => openExpenseForm('${e.id}'))"><i class="bi bi-pencil"></i></button>
                                    <button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#fee2e2;color:#b91c1c;border-color:#fecaca" data-perm="expenses" onclick="guard('expenses', () => delExpense('${e.id}'))"><i class="bi bi-trash"></i></button>
                                </div>
                            </td>
                        </tr>`).join('') : `<tr><td colspan="6"><div class="empty-state"><i class="bi bi-wallet2"></i><p>لا توجد مصروفات مسجلة</p></div></td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>`;
    applyPermissions();
}

function rangeBounds(r) {
    const now = new Date();
    if (r === 'today') return { from: new Date().setHours(0, 0, 0, 0), label: 'اليوم' };
    if (r === 'week') return { from: Date.now() - 7 * 86400000, label: 'الأسبوع' };
    if (r === 'month') return { from: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), label: 'الشهر' };
    return { from: 0, label: 'الكل' };
}
function setExpRange(r) { _expRange = r; renderExpenses(); }

function openExpenseForm(id) {
    const e = id ? getExpenses().find(x => x.id === id) : null;
    openModalContent(e ? 'تعديل مصروف' : 'تسجيل مصروف جديد', `
        <div class="row-flex">
            <div class="field" style="flex:2"><label>البيان</label><input class="input" id="exTitle" value="${e?.title || ''}" placeholder="مثال: شراء لحم من الجزار"></div>
            <div class="field" style="flex:1"><label>المبلغ (د.ع)</label><input class="input" id="exAmount" type="number" value="${e?.amount || ''}"></div>
        </div>
        <div class="field"><label>التصنيف</label>
            <select class="input" id="exCat">${EXPENSE_CATS.map(c => `<option ${e?.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
        </div>
        <div class="field"><label>ملاحظات</label><textarea class="input" id="exNote" placeholder="تفاصيل إضافية...">${e?.note || ''}</textarea></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-success" style="flex:1" onclick="saveExpense(${e ? `'${e.id}'` : 'null'})"><i class="bi bi-check2"></i> حفظ</button>`);
}
function saveExpense(id) {
    const title = document.getElementById('exTitle').value.trim();
    const amount = Number(document.getElementById('exAmount').value) || 0;
    if (!title) { toast('أدخل بيان المصروف', 'error'); return; }
    if (amount <= 0) { toast('أدخل مبلغاً صحيحاً', 'error'); return; }
    const data = { title, amount, category: document.getElementById('exCat').value, note: document.getElementById('exNote').value.trim() };
    if (id) api.updateExpense(id, data); else api.addExpense(data);
    closeModal('dynModal');
    renderExpenses();
    toast('تم حفظ المصروف ✅', 'success');
}
function delExpense(id) {
    if (!confirmAction('حذف هذا المصروف؟')) return;
    api.deleteExpense(id); renderExpenses(); toast('تم الحذف', 'success');
}
function printExpenses() {
    const { from, label } = rangeBounds(_expRange);
    const list = getExpenses().filter(e => e.createdAt >= from);
    const total = list.reduce((s, e) => s + Number(e.amount || 0), 0);
    printElement(reportShell(`تقرير المصروفات — ${label}`, `
        <table class="rep-tbl"><thead><tr><th>البيان</th><th>التصنيف</th><th>المبلغ</th><th>بواسطة</th><th>التاريخ</th></tr></thead>
        <tbody>${list.map(e => `<tr><td>${e.title}</td><td>${e.category}</td><td>${moneyNum(e.amount)}</td><td>${e.userName || '-'}</td><td>${fmtDateTime(e.createdAt)}</td></tr>`).join('')}
        <tr><td colspan="2" style="font-weight:900">الإجمالي</td><td colspan="3" style="font-weight:900">${moneyNum(total)}</td></tr></tbody></table>`));
}

/* ============ الورديات وتقفيل الصندوق ============ */
function renderShifts() {
    const wrap = document.getElementById('shiftsContainer');
    if (!wrap) return;
    const open = getOpenShift();
    const sum = open ? shiftSummary(open) : null;

    wrap.innerHTML = `
        ${open ? `
        <div class="card card-pad shift-open">
            <div class="row-flex" style="align-items:center;margin-bottom:14px">
                <div class="shift-pulse"></div>
                <div style="flex:1">
                    <h3 style="font-size:17px;font-weight:900">وردية مفتوحة — ${open.userName}</h3>
                    <p style="font-size:12.5px;color:var(--muted)">بدأت ${fmtDateTime(open.openedAt)} • منذ ${Math.floor((Date.now() - open.openedAt) / 60000)} دقيقة</p>
                </div>
                <button class="btn btn-danger btn-lg" data-perm="shifts" onclick="guard('shifts', openCloseShift)"><i class="bi bi-safe"></i> تقفيل الوردية</button>
            </div>
            <div class="stats-grid">
                <div class="stat"><div class="stat-label">رصيد الافتتاح</div><div class="stat-value" style="font-size:19px">${moneyNum(open.openingCash)}</div></div>
                <div class="stat green"><div class="stat-label">مبيعات الوردية</div><div class="stat-value" style="font-size:19px">${moneyNum(sum.total)}</div></div>
                <div class="stat gold"><div class="stat-label">نقداً</div><div class="stat-value" style="font-size:19px">${moneyNum(sum.cash)}</div></div>
                <div class="stat blue"><div class="stat-label">المتوقع في الصندوق</div><div class="stat-value" style="font-size:19px">${moneyNum(sum.expectedCash)}</div></div>
            </div>
            <div class="row-flex" style="margin-top:12px">
                <div class="mini-stat"><span>الطلبات</span><strong>${sum.orders}</strong></div>
                <div class="mini-stat"><span>بطاقة</span><strong>${moneyNum(sum.card)}</strong></div>
                <div class="mini-stat"><span>إلكتروني</span><strong>${moneyNum(sum.online)}</strong></div>
                <div class="mini-stat"><span>مصروفات</span><strong style="color:var(--danger)">${moneyNum(sum.expenses)}</strong></div>
                <div class="mini-stat"><span>الصافي</span><strong style="color:var(--success)">${moneyNum(sum.net)}</strong></div>
            </div>
        </div>` : `
        <div class="card card-pad" style="text-align:center;padding:36px">
            <div style="font-size:44px">🔓</div>
            <h3 style="font-size:18px;font-weight:900;margin:10px 0 6px">لا توجد وردية مفتوحة</h3>
            <p style="font-size:13px;color:var(--muted);margin-bottom:16px">افتح وردية لتسجيل مبيعاتك ومصروفاتك ثم قفّل الصندوق في نهاية الدوام.</p>
            <button class="btn btn-success btn-lg" data-perm="shifts" onclick="guard('shifts', openOpenShift)"><i class="bi bi-unlock"></i> فتح وردية جديدة</button>
        </div>`}

        <div class="card" style="margin-top:16px">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>الكاشير</th><th>الفتح</th><th>الإغلاق</th><th>المبيعات</th><th>المصروفات</th><th>المتوقع</th><th>الفعلي</th><th>الفرق</th><th></th></tr></thead>
                    <tbody>
                    ${getShifts().filter(s => s.status === 'closed').length ? getShifts().filter(s => s.status === 'closed').map(s => {
                        const d = s.difference || 0;
                        return `<tr>
                            <td><strong>${s.userName}</strong></td>
                            <td style="font-size:12px">${fmtDateTime(s.openedAt)}</td>
                            <td style="font-size:12px">${s.closedAt ? fmtDateTime(s.closedAt) : '-'}</td>
                            <td>${moneyNum(s.summary?.total || 0)}</td>
                            <td style="color:var(--danger)">${moneyNum(s.summary?.expenses || 0)}</td>
                            <td>${moneyNum(s.summary?.expectedCash || 0)}</td>
                            <td>${moneyNum(s.closingCash)}</td>
                            <td><span class="badge ${d === 0 ? 'badge-success' : d > 0 ? 'badge-info' : 'badge-danger'}">${d > 0 ? '+' : ''}${moneyNum(d)}</span></td>
                            <td><button class="icon-btn" style="width:32px;height:32px;font-size:14px" onclick="printShiftReport('${s.id}')" title="تقرير Z"><i class="bi bi-printer"></i></button></td>
                        </tr>`;
                    }).join('') : `<tr><td colspan="9"><div class="empty-state"><i class="bi bi-safe"></i><p>لا توجد ورديات مغلقة بعد</p></div></td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>`;
    applyPermissions();
}

function openOpenShift() {
    openModalContent('فتح وردية جديدة', `
        <div class="field"><label>الرصيد الافتتاحي في الصندوق (د.ع)</label>
            <input class="input" id="shOpenCash" type="number" value="0" style="font-size:18px;font-weight:800"></div>
        <div class="field"><label>ملاحظة (اختياري)</label><input class="input" id="shOpenNote" placeholder="مثال: وردية صباحية"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-success" style="flex:1" onclick="doOpenShift()"><i class="bi bi-unlock"></i> فتح الوردية</button>`);
}
function doOpenShift() {
    const cash = Number(document.getElementById('shOpenCash').value) || 0;
    api.openShift(cash, document.getElementById('shOpenNote').value.trim());
    closeModal('dynModal');
    renderShifts();
    toast('تم فتح الوردية 🔓', 'success');
}

function openCloseShift() {
    const s = getOpenShift(); if (!s) return;
    const sum = shiftSummary(s);
    openModalContent('تقفيل الوردية', `
        <div class="stats-grid" style="margin-bottom:10px">
            <div class="stat"><div class="stat-label">مبيعات نقدية</div><div class="stat-value" style="font-size:18px">${moneyNum(sum.cash)}</div></div>
            <div class="stat gold"><div class="stat-label">رصيد الافتتاح</div><div class="stat-value" style="font-size:18px">${moneyNum(s.openingCash)}</div></div>
            <div class="stat"><div class="stat-label">مصروفات</div><div class="stat-value" style="font-size:18px;color:var(--danger)">${moneyNum(sum.expenses)}</div></div>
            <div class="stat green"><div class="stat-label">المتوقع في الصندوق</div><div class="stat-value" style="font-size:18px">${moneyNum(sum.expectedCash)}</div></div>
        </div>
        <div class="field"><label>المبلغ الفعلي المعدود في الصندوق</label>
            <input class="input" id="shCloseCash" type="number" value="${sum.expectedCash}" style="font-size:20px;font-weight:800" oninput="calcShiftDiff(${sum.expectedCash})"></div>
        <div id="shDiffBox" class="totals-row grand"><span>الفرق</span><span>0</span></div>
        <div class="field"><label>ملاحظة الإقفال</label><input class="input" id="shCloseNote" placeholder="أي ملاحظات..."></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-danger" style="flex:1" onclick="doCloseShift()"><i class="bi bi-safe"></i> تقفيل وطباعة تقرير Z</button>`, 'lg');
}
function calcShiftDiff(expected) {
    const v = Number(document.getElementById('shCloseCash').value) || 0;
    const d = v - expected;
    const box = document.getElementById('shDiffBox');
    box.innerHTML = `<span>الفرق</span><span style="color:${d === 0 ? 'var(--success)' : 'var(--danger)'}">${d > 0 ? '+' : ''}${moneyNum(d)}</span>`;
}
function doCloseShift() {
    const cash = Number(document.getElementById('shCloseCash').value) || 0;
    const note = document.getElementById('shCloseNote').value.trim();
    const s = api.closeShift(cash, note);
    closeModal('dynModal');
    renderShifts();
    toast('تم تقفيل الوردية ✅', 'success');
    if (s) setTimeout(() => printShiftReport(s.id), 400);
}

function printShiftReport(id) {
    const s = getShifts().find(x => x.id === id);
    if (!s) return;
    const sum = s.summary || shiftSummary(s);
    printElement(reportShell(`تقرير تقفيل الوردية (Z)`, `
        <table class="rep-tbl">
            <tbody>
                <tr><td>الكاشير</td><td style="font-weight:800">${s.userName}</td></tr>
                <tr><td>فتح الوردية</td><td>${fmtDateTime(s.openedAt)}</td></tr>
                <tr><td>إغلاق الوردية</td><td>${s.closedAt ? fmtDateTime(s.closedAt) : '-'}</td></tr>
                <tr><td>عدد الطلبات</td><td>${sum.orders}</td></tr>
                <tr><td>عدد الأصناف المباعة</td><td>${sum.items}</td></tr>
                <tr><td>مبيعات نقدية</td><td>${moneyNum(sum.cash)}</td></tr>
                <tr><td>مبيعات بطاقة</td><td>${moneyNum(sum.card)}</td></tr>
                <tr><td>مبيعات إلكترونية</td><td>${moneyNum(sum.online)}</td></tr>
                <tr><td>إجمالي المبيعات</td><td style="font-weight:900">${moneyNum(sum.total)}</td></tr>
                <tr><td>المصروفات</td><td>${moneyNum(sum.expenses)}</td></tr>
                <tr><td>رصيد الافتتاح</td><td>${moneyNum(s.openingCash)}</td></tr>
                <tr><td>المتوقع في الصندوق</td><td>${moneyNum(sum.expectedCash)}</td></tr>
                <tr><td>المعدود فعلياً</td><td>${moneyNum(s.closingCash)}</td></tr>
                <tr><td>الفرق</td><td style="font-weight:900">${moneyNum(s.difference || 0)}</td></tr>
                ${s.note ? `<tr><td>ملاحظات</td><td>${s.note}</td></tr>` : ''}
            </tbody>
        </table>`, 'تقرير مالي مفصّل للوردية'));
}
