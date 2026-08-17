/* ============================================
   الرواتب وسجل الهدر — إدارة الموظفين والتكاليف
   ============================================ */

let _prMonth = new Date().toISOString().slice(0, 7);
let _prTab = 'payroll'; // payroll | waste

function renderPayroll() {
    const wrap = document.getElementById('payrollContainer');
    if (!wrap) return;

    const monthList = getPayroll().filter(p => p.month === _prMonth);
    const totalNet = monthList.reduce((s, p) => s + Number(p.net || 0), 0);
    const paidTotal = monthList.filter(p => p.paid).reduce((s, p) => s + Number(p.net || 0), 0);
    const wasteMonth = getWastes().filter(w => new Date(w.createdAt).toISOString().slice(0, 7) === _prMonth)
        .reduce((s, w) => s + Number(w.cost || 0), 0);

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-people stat-icon"></i><div class="stat-label">قيود الرواتب (${_prMonth})</div><div class="stat-value">${monthList.length}</div></div>
            <div class="stat gold"><i class="bi bi-cash-stack stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">إجمالي الرواتب</div><div class="stat-value" style="font-size:20px">${moneyNum(totalNet)}</div></div>
            <div class="stat green"><i class="bi bi-check2-circle stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">المصروف فعلياً</div><div class="stat-value" style="font-size:20px">${moneyNum(paidTotal)}</div></div>
            <div class="stat purple"><i class="bi bi-trash3 stat-icon" style="color:rgba(124,58,237,.1)"></i><div class="stat-label">كلفة الهدر هذا الشهر</div><div class="stat-value" style="font-size:20px">${moneyNum(wasteMonth)}</div></div>
        </div>

        <div class="seg-tabs">
            ${[['payroll', 'bi-cash-stack', 'كشف الرواتب'], ['waste', 'bi-trash3', 'سجل الهدر والتالف']]
              .map(([k, i, l]) => `<button class="seg ${_prTab === k ? 'active' : ''}" onclick="setPrTab('${k}')"><i class="bi ${i}"></i> ${l}</button>`).join('')}
        </div>
        <div id="prBody"></div>`;
    renderPrBody();
}
function setPrTab(t) { _prTab = t; renderPayroll(); }
function setPrMonth(m) { _prMonth = m; renderPayroll(); }

function renderPrBody() {
    const box = document.getElementById('prBody');
    if (!box) return;
    if (_prTab === 'waste') return renderWasteTab(box);

    const list = getPayroll().filter(p => p.month === _prMonth);
    box.innerHTML = `
        <div class="toolbar">
            <div class="field" style="margin:0;min-width:170px"><input class="input" type="month" value="${_prMonth}" onchange="setPrMonth(this.value)"></div>
            <div class="spacer"></div>
            <button class="btn btn-light" onclick="generatePayrollMonth()"><i class="bi bi-magic"></i> توليد كشف الشهر</button>
            <button class="btn btn-light" onclick="printPayroll()"><i class="bi bi-printer"></i> طباعة الكشف</button>
            <button class="btn btn-primary" data-perm="payroll" onclick="guard('payroll', () => openPayrollForm())"><i class="bi bi-plus-lg"></i> قيد راتب</button>
        </div>
        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>الموظف</th><th>الراتب الأساسي</th><th>مكافآت</th><th>استقطاعات</th><th>سلف</th><th>الصافي</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                    <tbody>${list.length ? list.map(p => `<tr>
                        <td><div class="cell-main"><div class="cell-thumb" style="background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff">${(p.userName || '؟').charAt(0)}</div><strong>${p.userName}</strong></div></td>
                        <td>${moneyNum(p.base)}</td>
                        <td style="color:var(--success)">+${moneyNum(p.bonus)}</td>
                        <td style="color:var(--danger)">−${moneyNum(p.deduction)}</td>
                        <td style="color:var(--warning)">−${moneyNum(p.advance)}</td>
                        <td><strong style="font-size:15px;color:var(--primary-dark)">${moneyNum(p.net)}</strong></td>
                        <td><span class="badge ${p.paid ? 'badge-success' : 'badge-warning'}">${p.paid ? 'مصروف' : 'معلّق'}</span></td>
                        <td><div style="display:flex;gap:5px">
                            ${!p.paid ? `<button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#dcfce7;color:#15803d;border-color:#bbf7d0" data-perm="payroll" onclick="doPayPayroll('${p.id}')" title="صرف"><i class="bi bi-cash"></i></button>` : ''}
                            <button class="icon-btn" style="width:32px;height:32px;font-size:14px" onclick="openPayrollForm('${p.id}')"><i class="bi bi-pencil"></i></button>
                            <button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#fee2e2;color:#b91c1c;border-color:#fecaca" data-perm="payroll" onclick="delPayroll('${p.id}')"><i class="bi bi-trash"></i></button>
                        </div></td>
                    </tr>`).join('') : `<tr><td colspan="8"><div class="empty-state"><i class="bi bi-cash-stack"></i><p>لا توجد قيود رواتب لهذا الشهر</p></div></td></tr>`}</tbody>
                </table>
            </div>
        </div>`;
    applyPermissions();
}

function openPayrollForm(id) {
    const p = id ? getPayroll().find(x => x.id === id) : null;
    openModalContent(p ? 'تعديل قيد راتب' : 'قيد راتب جديد', `
        <div class="row-flex">
            <div class="field" style="flex:2"><label>الموظف *</label>
                <select class="input" id="prUser">
                    ${getUsers().map(u => `<option value="${u.id}" ${p && p.userId === u.id ? 'selected' : ''}>${u.avatar || ''} ${u.name} — ${ROLE_LABEL[u.role] || u.role}</option>`).join('')}
                </select>
            </div>
            <div class="field" style="flex:1"><label>الشهر</label><input class="input" id="prM" type="month" value="${p ? p.month : _prMonth}"></div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>الراتب الأساسي</label><input class="input" id="prBase" type="number" value="${p ? p.base : 0}" oninput="calcNet()"></div>
            <div class="field" style="flex:1"><label>مكافآت / إضافي</label><input class="input" id="prBonus" type="number" value="${p ? p.bonus : 0}" oninput="calcNet()"></div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>استقطاعات (غياب/تأخير)</label><input class="input" id="prDed" type="number" value="${p ? p.deduction : 0}" oninput="calcNet()"></div>
            <div class="field" style="flex:1"><label>سلف مسحوبة</label><input class="input" id="prAdv" type="number" value="${p ? p.advance : 0}" oninput="calcNet()"></div>
        </div>
        <div class="stat green" style="margin:6px 0"><div class="stat-label">صافي الراتب</div><div class="stat-value" id="prNet">0</div></div>
        <div class="field"><label>ملاحظة</label><input class="input" id="prNote" value="${p ? p.note : ''}"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" style="flex:1" onclick="savePayroll('${id || ''}')"><i class="bi bi-check2"></i> حفظ</button>`);
    calcNet();
}
function calcNet() {
    const v = (id) => Number(document.getElementById(id)?.value || 0);
    const net = v('prBase') + v('prBonus') - v('prDed') - v('prAdv');
    const el = document.getElementById('prNet');
    if (el) el.textContent = moneyNum(net);
}
function savePayroll(id) {
    const uId = document.getElementById('prUser').value;
    const u = getUser(uId);
    const data = {
        userId: uId, userName: u ? u.name : '-',
        month: document.getElementById('prM').value,
        base: Number(document.getElementById('prBase').value) || 0,
        bonus: Number(document.getElementById('prBonus').value) || 0,
        deduction: Number(document.getElementById('prDed').value) || 0,
        advance: Number(document.getElementById('prAdv').value) || 0,
        note: document.getElementById('prNote').value.trim()
    };
    if (id) api.updatePayroll(id, data); else api.addPayroll(data);
    _prMonth = data.month;
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
/* توليد كشف تلقائي لكل الموظفين */
function generatePayrollMonth() {
    if (!can('payroll')) { denied(); return; }
    const exists = getPayroll().filter(p => p.month === _prMonth).map(p => p.userId);
    const missing = getUsers().filter(u => !exists.includes(u.id));
    if (!missing.length) { toast('كل الموظفين لديهم قيود في هذا الشهر', 'info'); return; }
    if (!confirmAction(`سيتم إنشاء ${missing.length} قيد راتب فارغ لشهر ${_prMonth}. متابعة؟`)) return;
    missing.forEach(u => api.addPayroll({ userId: u.id, userName: u.name, month: _prMonth, base: Number(u.salary || 0) }));
    renderPayroll(); toast('تم توليد كشف الشهر ✅', 'success');
}
function printPayroll() {
    const list = getPayroll().filter(p => p.month === _prMonth);
    const rows = list.map(p => `<tr>
        <td>${p.userName}</td><td>${moneyNum(p.base)}</td><td>${moneyNum(p.bonus)}</td>
        <td>${moneyNum(p.deduction)}</td><td>${moneyNum(p.advance)}</td>
        <td><strong>${moneyNum(p.net)}</strong></td><td>${p.paid ? 'مصروف' : 'معلّق'}</td></tr>`).join('')
        || `<tr><td colspan="7">لا توجد قيود</td></tr>`;
    const total = list.reduce((s, p) => s + p.net, 0);
    printElement(reportShell('كشف رواتب الموظفين', `
        <table class="rep-tbl">
            <thead><tr><th>الموظف</th><th>الأساسي</th><th>مكافآت</th><th>استقطاع</th><th>سلف</th><th>الصافي</th><th>الحالة</th></tr></thead>
            <tbody>${rows}<tr><td colspan="5" style="font-weight:900">الإجمالي</td><td style="font-weight:900">${moneyNum(total)}</td><td></td></tr></tbody>
        </table>`, `شهر: ${_prMonth}`));
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
