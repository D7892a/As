/* ============================================
   قسم المخزون — الجرد والكميات
   ============================================ */

let _invFilter = 'all';

function renderInventory() {
    const wrap = document.getElementById('inventoryContainer');
    if (!wrap) return;
    const s = getSettings();
    const low = s.lowStockQty || 5;
    let list = getProducts();
    if (_invFilter === 'low') list = list.filter(p => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= low);
    if (_invFilter === 'out') list = list.filter(p => Number(p.stock || 0) <= 0);

    const all = getProducts();
    const outCount = all.filter(p => Number(p.stock || 0) <= 0).length;
    const lowCount = all.filter(p => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= low).length;
    const stockValue = all.reduce((t, p) => t + (Number(p.stock || 0) * Number(p.cost || 0)), 0);

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-box-seam stat-icon"></i><div class="stat-label">أصناف في المخزون</div><div class="stat-value">${all.length}</div></div>
            <div class="stat gold"><i class="bi bi-exclamation-triangle stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">قاربت على النفاد</div><div class="stat-value">${lowCount}</div></div>
            <div class="stat"><i class="bi bi-x-octagon stat-icon"></i><div class="stat-label">نفدت الكمية</div><div class="stat-value" style="color:var(--danger)">${outCount}</div></div>
            <div class="stat green"><i class="bi bi-cash-coin stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">قيمة المخزون (تكلفة)</div><div class="stat-value" style="font-size:19px">${moneyNum(stockValue)}</div></div>
        </div>

        <div class="toolbar">
            <div class="filter-pills">
                ${[['all', 'الكل'], ['low', 'قاربت على النفاد'], ['out', 'نفدت']].map(([k, l]) =>
                    `<span class="pill ${_invFilter === k ? 'active' : ''}" onclick="setInvFilter('${k}')">${l}</span>`).join('')}
            </div>
            <div class="spacer"></div>
            <button class="btn btn-light" data-perm="inventory" onclick="guard('inventory', openBulkStock)"><i class="bi bi-boxes"></i> جرد سريع للكل</button>
            <button class="btn btn-gold" onclick="printInventory()"><i class="bi bi-printer"></i> تقرير الجرد</button>
        </div>

        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>الصنف</th><th>القسم</th><th>التكلفة</th><th>سعر البيع</th><th>الربح</th><th>الكمية</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                    <tbody>
                    ${list.length ? list.map(p => {
                        const st = Number(p.stock || 0);
                        const state = st <= 0 ? ['نفد', 'badge-danger'] : st <= low ? ['منخفض', 'badge-warning'] : ['جيد', 'badge-success'];
                        const profit = Number(p.price || 0) - Number(p.cost || 0);
                        return `<tr>
                            <td><div style="display:flex;align-items:center;gap:8px"><span style="font-size:20px">${p.emoji || '🍽️'}</span><strong>${p.name}</strong></div></td>
                            <td>${getCategory(p.categoryId)?.name || '-'}</td>
                            <td>${moneyNum(p.cost || 0)}</td>
                            <td>${moneyNum(p.price)}</td>
                            <td style="color:${profit >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:800">${moneyNum(profit)}</td>
                            <td><strong style="font-size:15px">${st}</strong></td>
                            <td><span class="badge ${state[1]}">${state[0]}</span></td>
                            <td>
                                <div style="display:flex;gap:5px">
                                    <button class="icon-btn" style="width:32px;height:32px;font-size:14px" data-perm="inventory" onclick="guard('inventory', () => quickStock('${p.id}', 10))" title="+10"><i class="bi bi-plus-lg"></i></button>
                                    <button class="icon-btn" style="width:32px;height:32px;font-size:14px" data-perm="inventory" onclick="guard('inventory', () => openStockForm('${p.id}'))" title="تعديل"><i class="bi bi-pencil"></i></button>
                                </div>
                            </td>
                        </tr>`;
                    }).join('') : `<tr><td colspan="8"><div class="empty-state"><i class="bi bi-box-seam"></i><p>لا توجد أصناف</p></div></td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>`;
    applyPermissions();
}

function setInvFilter(f) { _invFilter = f; renderInventory(); }
function quickStock(id, qty) { api.addStock(id, qty); renderInventory(); toast(`تمت إضافة ${qty} للمخزون`, 'success', 1500); }

function openStockForm(id) {
    const p = getProduct(id); if (!p) return;
    openModalContent(`مخزون: ${p.name}`, `
        <div class="row-flex">
            <div class="field" style="flex:1"><label>الكمية الحالية</label><input class="input" id="stQty" type="number" value="${Number(p.stock || 0)}"></div>
            <div class="field" style="flex:1"><label>تكلفة الوحدة (د.ع)</label><input class="input" id="stCost" type="number" value="${Number(p.cost || 0)}"></div>
        </div>
        <div class="field"><label>رمز الصنف SKU (اختياري)</label><input class="input" id="stSku" value="${p.sku || ''}"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-success" style="flex:1" onclick="saveStock('${p.id}')"><i class="bi bi-check2"></i> حفظ</button>`);
}
function saveStock(id) {
    const qty = Number(document.getElementById('stQty').value) || 0;
    const cost = Number(document.getElementById('stCost').value) || 0;
    const sku = document.getElementById('stSku').value.trim();
    api.updateProduct(id, { stock: Math.max(0, qty), cost, sku });
    closeModal('dynModal');
    renderInventory();
    toast('تم تحديث المخزون ✅', 'success');
}

function openBulkStock() {
    openModalContent('جرد سريع', `
        <p style="font-size:13px;color:var(--muted);margin-bottom:12px">اضبط كمية موحّدة لجميع الأصناف دفعة واحدة.</p>
        <div class="field"><label>الكمية لكل صنف</label><input class="input" id="bulkQty" type="number" value="50"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-danger" style="flex:1" onclick="doBulkStock()"><i class="bi bi-boxes"></i> تطبيق على الكل</button>`);
}
function doBulkStock() {
    const q = Number(document.getElementById('bulkQty').value) || 0;
    getProducts().forEach(p => p.stock = q);
    persist();
    closeModal('dynModal');
    renderInventory();
    toast('تم تحديث مخزون جميع الأصناف', 'success');
}

function printInventory() {
    const rows = getProducts().map(p => `<tr>
        <td>${p.name}</td><td>${getCategory(p.categoryId)?.name || '-'}</td>
        <td>${Number(p.stock || 0)}</td><td>${moneyNum(p.cost || 0)}</td>
        <td>${moneyNum(Number(p.stock || 0) * Number(p.cost || 0))}</td></tr>`).join('');
    const total = getProducts().reduce((t, p) => t + Number(p.stock || 0) * Number(p.cost || 0), 0);
    printElement(reportShell('تقرير الجرد والمخزون', `
        <table class="rep-tbl"><thead><tr><th>الصنف</th><th>القسم</th><th>الكمية</th><th>التكلفة</th><th>القيمة</th></tr></thead>
        <tbody>${rows}<tr><td colspan="4" style="font-weight:900">إجمالي قيمة المخزون</td><td style="font-weight:900">${moneyNum(total)}</td></tr></tbody></table>`));
}
