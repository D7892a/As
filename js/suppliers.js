/* ============================================
   الموردون والمشتريات — فواتير الشراء والذمم
   ============================================ */

let _supTab = 'purchases'; // purchases | suppliers
let _puItems = [];         // أصناف فاتورة الشراء الجارية

function renderSuppliers() {
    const wrap = document.getElementById('suppliersContainer');
    if (!wrap) return;

    const purchases = getPurchases();
    const month = new Date().toISOString().slice(0, 7);
    const monthTotal = purchases.filter(p => new Date(p.createdAt).toISOString().slice(0, 7) === month)
        .reduce((s, p) => s + Number(p.total || 0), 0);
    const debt = getSuppliers().reduce((s, x) => s + Number(x.balance || 0), 0);
    const unpaid = purchases.filter(p => p.status !== 'paid').length;

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-truck-front stat-icon"></i><div class="stat-label">الموردون</div><div class="stat-value">${getSuppliers().length}</div></div>
            <div class="stat gold"><i class="bi bi-receipt-cutoff stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">مشتريات هذا الشهر</div><div class="stat-value" style="font-size:20px">${moneyNum(monthTotal)}</div></div>
            <div class="stat" style="--x:1"><i class="bi bi-exclamation-circle stat-icon"></i><div class="stat-label">فواتير غير مسددة</div><div class="stat-value" style="color:var(--danger)">${unpaid}</div></div>
            <div class="stat purple"><i class="bi bi-wallet stat-icon" style="color:rgba(124,58,237,.1)"></i><div class="stat-label">إجمالي الذمم</div><div class="stat-value" style="font-size:20px">${moneyNum(debt)}</div></div>
        </div>

        <div class="seg-tabs">
            ${[['purchases', 'bi-receipt-cutoff', 'فواتير الشراء'], ['suppliers', 'bi-truck-front', 'الموردون والذمم']]
              .map(([k, i, l]) => `<button class="seg ${_supTab === k ? 'active' : ''}" onclick="setSupTab('${k}')"><i class="bi ${i}"></i> ${l}</button>`).join('')}
        </div>
        <div id="supBody"></div>`;
    renderSupBody();
}
function setSupTab(t) { _supTab = t; renderSuppliers(); }

function renderSupBody() {
    const box = document.getElementById('supBody');
    if (!box) return;
    if (_supTab === 'suppliers') return renderSupplierList(box);

    const list = getPurchases();
    box.innerHTML = `
        <div class="toolbar">
            <div class="spacer"></div>
            <button class="btn btn-light" onclick="printPurchases()"><i class="bi bi-printer"></i> تقرير المشتريات</button>
            <button class="btn btn-primary" data-perm="suppliers" onclick="guard('suppliers', () => openPurchaseForm())"><i class="bi bi-plus-lg"></i> فاتورة شراء جديدة</button>
        </div>
        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>رقم الفاتورة</th><th>المورد</th><th>الأصناف</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
                    <tbody>${list.length ? list.map(p => {
                        const rest = Number(p.total || 0) - Number(p.paid || 0);
                        const st = p.status === 'paid' ? ['مسددة', 'badge-success'] : p.status === 'partial' ? ['جزئية', 'badge-warning'] : ['غير مسددة', 'badge-danger'];
                        return `<tr>
                            <td><strong>${p.invoiceNo || '—'}</strong></td>
                            <td>${p.supplierName || '-'}</td>
                            <td>${(p.items || []).length} صنف</td>
                            <td><strong>${moneyNum(p.total)}</strong></td>
                            <td style="color:var(--success)">${moneyNum(p.paid)}</td>
                            <td style="color:${rest > 0 ? 'var(--danger)' : 'var(--muted)'};font-weight:800">${moneyNum(rest)}</td>
                            <td><span class="badge ${st[1]}">${st[0]}</span></td>
                            <td style="font-size:12.5px">${fmtDate(p.createdAt)}</td>
                            <td><div style="display:flex;gap:5px">
                                <button class="icon-btn" style="width:32px;height:32px;font-size:14px" onclick="viewPurchase('${p.id}')" title="عرض"><i class="bi bi-eye"></i></button>
                                ${rest > 0 ? `<button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#dcfce7;color:#15803d;border-color:#bbf7d0" data-perm="suppliers" onclick="openPayPurchase('${p.id}')" title="تسديد"><i class="bi bi-cash"></i></button>` : ''}
                                <button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#fee2e2;color:#b91c1c;border-color:#fecaca" data-perm="suppliers" onclick="delPurchase('${p.id}')"><i class="bi bi-trash"></i></button>
                            </div></td>
                        </tr>`;
                    }).join('') : `<tr><td colspan="9"><div class="empty-state"><i class="bi bi-receipt-cutoff"></i><p>لا توجد فواتير شراء</p></div></td></tr>`}</tbody>
                </table>
            </div>
        </div>`;
    applyPermissions();
}

function renderSupplierList(box) {
    const list = getSuppliers();
    box.innerHTML = `
        <div class="toolbar">
            <div class="spacer"></div>
            <button class="btn btn-primary" data-perm="suppliers" onclick="guard('suppliers', () => openSupplierForm())"><i class="bi bi-plus-lg"></i> مورد جديد</button>
        </div>
        <div class="grid grid-3">
            ${list.length ? list.map(s => {
                const inv = getPurchases().filter(p => p.supplierId === s.id);
                const total = inv.reduce((x, p) => x + Number(p.total || 0), 0);
                return `<div class="sup-card">
                    <div class="sup-head">
                        <div class="sup-avatar"><i class="bi bi-truck-front-fill"></i></div>
                        <div style="flex:1;min-width:0">
                            <div class="sup-name">${s.name}</div>
                            <div class="sup-cat">${s.category}</div>
                        </div>
                        <span class="badge ${s.active !== false ? 'badge-success' : 'badge-dark'}">${s.active !== false ? 'نشط' : 'موقوف'}</span>
                    </div>
                    <div class="sup-rows">
                        <div><i class="bi bi-person"></i> ${s.contact || '-'}</div>
                        <div style="direction:ltr;justify-content:flex-end"><span>${s.phone || '-'}</span> <i class="bi bi-telephone"></i></div>
                        <div><i class="bi bi-receipt"></i> ${inv.length} فاتورة — ${moneyNum(total)}</div>
                    </div>
                    <div class="sup-balance ${Number(s.balance) > 0 ? 'debt' : ''}">
                        <span>الرصيد المستحق عليه</span><strong>${moneyNum(s.balance || 0)}</strong>
                    </div>
                    <div style="display:flex;gap:6px;margin-top:10px">
                        <button class="btn btn-light btn-sm" style="flex:1" onclick="openSupplierForm('${s.id}')"><i class="bi bi-pencil"></i> تعديل</button>
                        <button class="btn btn-ghost btn-sm" onclick="delSupplier('${s.id}')"><i class="bi bi-trash"></i></button>
                    </div>
                </div>`;
            }).join('') : `<div class="empty-state" style="grid-column:1/-1"><i class="bi bi-truck-front"></i><p>لا يوجد موردون</p></div>`}
        </div>`;
    applyPermissions();
}

/* ----- نموذج المورد ----- */
function openSupplierForm(id) {
    const s = id ? getSupplier(id) : null;
    openModalContent(s ? 'تعديل مورد' : 'مورد جديد', `
        <div class="row-flex">
            <div class="field" style="flex:1"><label>اسم المورد *</label><input class="input" id="spName" value="${s ? s.name : ''}"></div>
            <div class="field" style="flex:1"><label>التصنيف</label>
                <select class="input" id="spCat">${['لحوم', 'خضار', 'مشروبات', 'مواد غذائية', 'مواد تنظيف', 'غاز ووقود', 'عام'].map(c => `<option ${s && s.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
            </div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>الشخص المسؤول</label><input class="input" id="spContact" value="${s ? s.contact : ''}"></div>
            <div class="field" style="flex:1"><label>الهاتف</label><input class="input" id="spPhone" value="${s ? s.phone : ''}" style="direction:ltr;text-align:right"></div>
        </div>
        <div class="field"><label>ملاحظات</label><textarea class="input" id="spNote">${s ? s.note : ''}</textarea></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" style="flex:1" onclick="saveSupplier('${id || ''}')"><i class="bi bi-check2"></i> حفظ</button>`);
}
function saveSupplier(id) {
    const name = document.getElementById('spName').value.trim();
    if (!name) { toast('أدخل اسم المورد', 'error'); return; }
    const data = {
        name, category: document.getElementById('spCat').value,
        contact: document.getElementById('spContact').value.trim(),
        phone: document.getElementById('spPhone').value.trim(),
        note: document.getElementById('spNote').value.trim()
    };
    if (id) api.updateSupplier(id, data); else api.addSupplier(data);
    closeModal('dynModal'); renderSuppliers(); toast('تم الحفظ ✅', 'success');
}
function delSupplier(id) {
    if (!confirmAction('حذف هذا المورد؟')) return;
    api.deleteSupplier(id); renderSuppliers(); toast('تم الحذف', 'success');
}

/* ----- فاتورة شراء ----- */
function openPurchaseForm() {
    _puItems = [];
    openModalContent('فاتورة شراء جديدة', `
        <div class="row-flex">
            <div class="field" style="flex:1"><label>المورد *</label>
                <select class="input" id="puSup">
                    <option value="">— اختر المورد —</option>
                    ${getSuppliers().map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                </select>
            </div>
            <div class="field" style="flex:1"><label>رقم الفاتورة</label><input class="input" id="puNo" placeholder="INV-001"></div>
        </div>

        <div class="ss-title" style="margin-top:6px"><i class="bi bi-box-seam"></i> أصناف الفاتورة</div>
        <div class="row-flex" style="align-items:flex-end">
            <div class="field" style="flex:2"><label>الصنف</label>
                <select class="input" id="puProd">${getProducts().map(p => `<option value="${p.id}">${p.emoji || ''} ${p.name}</option>`).join('')}</select>
            </div>
            <div class="field" style="flex:1"><label>الكمية</label><input class="input" id="puQty" type="number" value="10" min="1"></div>
            <div class="field" style="flex:1"><label>سعر الوحدة</label><input class="input" id="puCost" type="number" value="0"></div>
            <button class="btn btn-light" style="margin-bottom:14px" onclick="addPuItem()"><i class="bi bi-plus-lg"></i> إضافة</button>
        </div>
        <div id="puItemsBox"></div>

        <div class="row-flex" style="margin-top:8px">
            <div class="field" style="flex:1"><label>المبلغ المدفوع الآن</label><input class="input" id="puPaid" type="number" value="0"></div>
            <div class="field" style="flex:1"><label>إضافة الكميات للمخزون</label>
                <select class="input" id="puStock"><option value="1" selected>نعم — تحديث المخزون</option><option value="0">لا</option></select>
            </div>
        </div>
        <div class="field"><label>ملاحظة</label><input class="input" id="puNote"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-success" style="flex:1" onclick="savePurchase()"><i class="bi bi-check2"></i> حفظ الفاتورة</button>`, 'lg');
    renderPuItems();
}
function addPuItem() {
    const pid = document.getElementById('puProd').value;
    const qty = Number(document.getElementById('puQty').value) || 0;
    const cost = Number(document.getElementById('puCost').value) || 0;
    if (!pid || qty <= 0) { toast('أدخل كمية صحيحة', 'error'); return; }
    const p = getProduct(pid);
    const ex = _puItems.find(i => i.productId === pid);
    if (ex) { ex.qty += qty; ex.cost = cost || ex.cost; }
    else _puItems.push({ productId: pid, name: p.name, qty, cost: cost || Number(p.cost || 0) });
    renderPuItems();
}
function removePuItem(pid) { _puItems = _puItems.filter(i => i.productId !== pid); renderPuItems(); }
function renderPuItems() {
    const box = document.getElementById('puItemsBox');
    if (!box) return;
    const total = _puItems.reduce((s, i) => s + i.qty * i.cost, 0);
    box.innerHTML = _puItems.length ? `
        <div class="table-wrap" style="margin-bottom:8px">
            <table class="tbl">
                <thead><tr><th>الصنف</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th><th></th></tr></thead>
                <tbody>${_puItems.map(i => `<tr>
                    <td>${i.name}</td><td>${i.qty}</td><td>${moneyNum(i.cost)}</td>
                    <td><strong>${moneyNum(i.qty * i.cost)}</strong></td>
                    <td><button class="icon-btn" style="width:28px;height:28px;font-size:12px" onclick="removePuItem('${i.productId}')"><i class="bi bi-x-lg"></i></button></td>
                </tr>`).join('')}</tbody>
            </table>
        </div>
        <div class="totals-row grand" style="padding:8px 12px;background:var(--cream);border-radius:10px"><span>إجمالي الفاتورة</span><span>${moneyNum(total)}</span></div>`
        : `<div class="empty-state" style="padding:18px"><i class="bi bi-box-seam"></i><p>أضف أصناف الفاتورة</p></div>`;
}
function savePurchase() {
    const supId = document.getElementById('puSup').value;
    if (!supId) { toast('اختر المورد', 'error'); return; }
    if (!_puItems.length) { toast('أضف صنفاً واحداً على الأقل', 'error'); return; }
    const sup = getSupplier(supId);
    api.addPurchase({
        supplierId: supId, supplierName: sup.name,
        invoiceNo: document.getElementById('puNo').value.trim(),
        items: _puItems.map(i => ({ ...i })),
        paid: Number(document.getElementById('puPaid').value) || 0,
        addToStock: document.getElementById('puStock').value === '1',
        note: document.getElementById('puNote').value.trim()
    });
    _puItems = [];
    closeModal('dynModal'); renderSuppliers();
    toast('تم حفظ فاتورة الشراء ✅', 'success');
}

function viewPurchase(id) {
    const p = getPurchase(id); if (!p) return;
    openModalContent(`فاتورة ${p.invoiceNo || '—'}`, `
        <div class="stats-grid" style="margin-bottom:10px">
            <div class="stat gold"><div class="stat-label">الإجمالي</div><div class="stat-value" style="font-size:19px">${moneyNum(p.total)}</div></div>
            <div class="stat green"><div class="stat-label">المدفوع</div><div class="stat-value" style="font-size:19px">${moneyNum(p.paid)}</div></div>
            <div class="stat"><div class="stat-label">المتبقي</div><div class="stat-value" style="font-size:19px">${moneyNum(p.total - p.paid)}</div></div>
        </div>
        <div class="table-wrap">
            <table class="tbl"><thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
            <tbody>${(p.items || []).map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${moneyNum(i.cost)}</td><td>${moneyNum(i.qty * i.cost)}</td></tr>`).join('')}</tbody></table>
        </div>
        <p style="margin-top:10px;font-size:12.5px;color:var(--muted)">المورد: ${p.supplierName} • بواسطة: ${p.userName} • ${fmtDateTime(p.createdAt)}</p>
        ${p.note ? `<p style="font-size:13px">📝 ${p.note}</p>` : ''}
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إغلاق</button>
        <button class="btn btn-light" onclick="printPurchase('${p.id}')"><i class="bi bi-printer"></i> طباعة</button>`);
}
function openPayPurchase(id) {
    const p = getPurchase(id); if (!p) return;
    const rest = p.total - p.paid;
    openModalContent('تسديد دفعة للمورد', `
        <div class="stat gold" style="margin-bottom:12px"><div class="stat-label">المتبقي على الفاتورة</div><div class="stat-value">${moneyNum(rest)}</div></div>
        <div class="field"><label>المبلغ المدفوع</label><input class="input" id="payAmt" type="number" value="${rest}"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-success" style="flex:1" onclick="doPayPurchase('${id}')"><i class="bi bi-cash"></i> تسديد</button>`);
}
function doPayPurchase(id) {
    api.payPurchase(id, Number(document.getElementById('payAmt').value) || 0);
    closeModal('dynModal'); renderSuppliers(); toast('تم تسجيل الدفعة ✅', 'success');
}
function delPurchase(id) {
    if (!confirmAction('حذف هذه الفاتورة؟ (لن تُرجع الكميات من المخزون)')) return;
    api.deletePurchase(id); renderSuppliers(); toast('تم الحذف', 'success');
}

function printPurchase(id) {
    const p = getPurchase(id); if (!p) return;
    printElement(reportShell(`فاتورة شراء ${p.invoiceNo || ''}`, `
        <table class="rep-tbl"><thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
        <tbody>${(p.items || []).map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${moneyNum(i.cost)}</td><td>${moneyNum(i.qty * i.cost)}</td></tr>`).join('')}
        <tr><td colspan="3" style="font-weight:900">الإجمالي</td><td style="font-weight:900">${moneyNum(p.total)}</td></tr>
        <tr><td colspan="3">المدفوع</td><td>${moneyNum(p.paid)}</td></tr>
        <tr><td colspan="3">المتبقي</td><td>${moneyNum(p.total - p.paid)}</td></tr></tbody></table>`,
        `المورد: ${p.supplierName}`));
}
function printPurchases() {
    const rows = getPurchases().map(p => `<tr>
        <td>${p.invoiceNo || '—'}</td><td>${p.supplierName}</td><td>${fmtDate(p.createdAt)}</td>
        <td>${moneyNum(p.total)}</td><td>${moneyNum(p.paid)}</td><td>${moneyNum(p.total - p.paid)}</td></tr>`).join('')
        || `<tr><td colspan="6">لا توجد فواتير</td></tr>`;
    const t = getPurchases().reduce((s, p) => s + p.total, 0);
    const d = getPurchases().reduce((s, p) => s + (p.total - p.paid), 0);
    printElement(reportShell('تقرير المشتريات والذمم', `
        <table class="rep-tbl">
            <thead><tr><th>الفاتورة</th><th>المورد</th><th>التاريخ</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th></tr></thead>
            <tbody>${rows}<tr><td colspan="3" style="font-weight:900">المجموع</td><td style="font-weight:900">${moneyNum(t)}</td><td></td><td style="font-weight:900">${moneyNum(d)}</td></tr></tbody>
        </table>`));
}
