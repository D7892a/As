/* ============================================
   الأقسام: الطلبات، المنتجات، الأقسام، المبيعات، العملاء
   ============================================ */

const STATUS_MAP = {
    pending: { label: 'قيد الانتظار', cls: 'badge-warning', icon: 'bi-clock' },
    preparing: { label: 'قيد التحضير', cls: 'badge-info', icon: 'bi-fire' },
    completed: { label: 'مكتمل', cls: 'badge-success', icon: 'bi-check2-circle' },
    cancelled: { label: 'ملغي', cls: 'badge-danger', icon: 'bi-x-circle' }
};

/* ============ الطلبات ============ */
let ordersFilter = 'all';

function renderOrders() {
    const wrap = document.getElementById('ordersContainer');
    if (!wrap) return;
    let list = [...getOrders()];
    if (ordersFilter !== 'all') list = list.filter(o => o.status === ordersFilter);

    const today = new Date().setHours(0, 0, 0, 0);
    const todayOrders = getOrders().filter(o => new Date(o.createdAt).setHours(0,0,0,0) === today);
    const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
    const active = getOrders().filter(o => o.status === 'pending' || o.status === 'preparing').length;

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-receipt stat-icon"></i><div class="stat-label">إجمالي الطلبات</div><div class="stat-value">${getOrders().length}</div></div>
            <div class="stat green"><i class="bi bi-clock-history stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">طلبات نشطة</div><div class="stat-value">${active}</div></div>
            <div class="stat gold"><i class="bi bi-calendar-check stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">طلبات اليوم</div><div class="stat-value">${todayOrders.length}</div></div>
            <div class="stat blue"><i class="bi bi-cash-stack stat-icon" style="color:rgba(37,99,235,.1)"></i><div class="stat-label">إيراد اليوم</div><div class="stat-value" style="font-size:20px">${moneyNum(todayRevenue)}</div></div>
        </div>

        <div class="toolbar">
            <div class="filter-pills">
                ${[['all', 'الكل'], ['preparing', 'قيد التحضير'], ['pending', 'قيد الانتظار'], ['completed', 'مكتمل'], ['cancelled', 'ملغي']].map(([k, l]) =>
                    `<span class="pill ${ordersFilter === k ? 'active' : ''}" onclick="setOrdersFilter('${k}')">${l}</span>`).join('')}
            </div>
            <div class="spacer"></div>
            <button class="btn btn-gold" onclick="exportOrdersPDF()"><i class="bi bi-filetype-pdf"></i> تقرير PDF</button>
        </div>

        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr>
                        <th>رقم الطلب</th><th>العميل</th><th>النوع</th><th>الأصناف</th>
                        <th>الإجمالي</th><th>الدفع</th><th>الكاشير</th><th>الوقت</th><th>الحالة</th><th>إجراءات</th>
                    </tr></thead>
                    <tbody>
                    ${list.length ? list.map(o => {
                        const st = STATUS_MAP[o.status] || STATUS_MAP.pending;
                        return `<tr>
                            <td><strong style="color:var(--primary-dark)">#${o.number}</strong></td>
                            <td>${o.customerName}${o.customerPhone !== '-' ? `<div style="font-size:11px;color:var(--muted)">${o.customerPhone}</div>` : ''}</td>
                            <td><span class="badge badge-dark"><i class="bi ${ORDER_TYPES[o.orderType]?.icon || 'bi-bag'}"></i> ${o.orderTypeLabel}${o.zoneName ? ' • ' + o.zoneName : ''}</span></td>
                            <td>${o.items.reduce((n, i) => n + i.qty, 0)} صنف</td>
                            <td><strong>${moneyNum(o.total)}</strong></td>
                            <td>${o.paymentMethod === 'cash' ? 'كاش' : o.paymentMethod === 'card' ? 'بطاقة' : 'إلكتروني'}</td>
                            <td>${o.cashierName || '-'}</td>
                            <td style="font-size:12px;color:var(--muted)">${fmtDateTime(o.createdAt)}</td>
                            <td><span class="badge ${st.cls}"><i class="bi ${st.icon}"></i> ${st.label}</span></td>
                            <td>
                                <div style="display:flex;gap:5px">
                                    <button class="icon-btn" style="width:32px;height:32px;font-size:14px" onclick="viewOrder('${o.id}')" title="عرض"><i class="bi bi-eye"></i></button>
                                    ${o.status === 'preparing' || o.status === 'pending' ? `
                                        <button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#dcfce7;color:#15803d;border-color:#bbf7d0" onclick="setOrderStatus('${o.id}','completed')" title="إكمال"><i class="bi bi-check2"></i></button>
                                        <button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#fee2e2;color:#b91c1c;border-color:#fecaca" onclick="setOrderStatus('${o.id}','cancelled')" title="إلغاء"><i class="bi bi-x"></i></button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>`;
                    }).join('') : `<tr><td colspan="10"><div class="empty-state"><i class="bi bi-inbox"></i><p>لا توجد طلبات</p></div></td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>`;
    updateOrderBadge();
    applyPermissions();
}
function setOrdersFilter(f) { ordersFilter = f; renderOrders(); }
function setOrderStatus(id, status) {
    if (status === 'cancelled' && !can('orders.cancel')) { denied(); return; }
    if (!can('orders.status')) { denied(); return; }
    api.updateOrderStatus(id, status);
    renderOrders();
    toast(`تم تحديث حالة الطلب إلى: ${STATUS_MAP[status].label}`, 'success');
}
function deleteOrderGuarded(id) {
    if (!can('orders.delete')) { denied(); return; }
    if (!confirmAction('حذف الطلب نهائياً؟')) return;
    api.deleteOrder(id); closeModal('dynModal'); renderOrders(); toast('تم حذف الطلب', 'success');
}
function viewOrder(id) {
    const o = getOrder(id);
    if (!o) return;
    const st = STATUS_MAP[o.status];
    const items = o.items.map(i => `
        <tr>
            <td>${i.name}</td><td>${moneyNum(i.price)}</td><td>${i.qty}</td>
            <td style="text-align:left;font-weight:800">${moneyNum(i.price * i.qty)}</td>
        </tr>`).join('');
    openModalContent(`تفاصيل الطلب #${o.number}`, `
        <div class="row-flex" style="margin-bottom:14px">
            <div class="stat" style="flex:1"><div class="stat-label">العميل</div><div class="stat-value" style="font-size:15px">${o.customerName}</div></div>
            <div class="stat gold" style="flex:1"><div class="stat-label">النوع</div><div class="stat-value" style="font-size:15px">${o.orderTypeLabel}</div></div>
            <div class="stat green" style="flex:1"><div class="stat-label">الحالة</div><div class="stat-value" style="font-size:15px">${st.label}</div></div>
        </div>
        <div class="table-wrap" style="border:1px solid var(--border);border-radius:12px">
            <table class="tbl"><thead><tr><th>الصنف</th><th>السعر</th><th>الكمية</th><th>الإجمالي</th></tr></thead>
            <tbody>${items}</tbody></table>
        </div>
            ${o.notes ? `<div style="margin-top:12px;padding:10px;background:var(--cream);border-radius:10px;font-size:13px"><strong>ملاحظات:</strong> ${o.notes}</div>` : ''}
            ${o.orderType === 'delivery' ? `<div style="margin-top:12px;padding:10px;background:var(--cream);border-radius:10px;font-size:13px">
                <strong><i class="bi bi-geo-alt"></i> التوصيل:</strong> ${o.zoneName || getZone(o.zoneId)?.name || 'بدون منطقة'}
                ${o.address ? ' — ' + o.address : ''} • أجرة ${moneyNum(o.deliveryFee || 0)}${o.express ? ' • سريع ⚡' : ''}
            </div>` : ''}
        <div style="margin-top:14px">
            <div class="totals-row"><span>المجموع الفرعي</span><span>${moneyNum(o.subtotal)}</span></div>
            ${o.tax ? `<div class="totals-row"><span>الضريبة</span><span>${moneyNum(o.tax)}</span></div>` : ''}
            ${o.service ? `<div class="totals-row"><span>رسوم خدمة</span><span>${moneyNum(o.service)}</span></div>` : ''}
            ${o.deliveryFee ? `<div class="totals-row"><span>أجرة التوصيل${o.zoneName ? ' — ' + o.zoneName : ''}</span><span>${moneyNum(o.deliveryFee)}</span></div>` : ''}
            ${o.tip ? `<div class="totals-row"><span>إكرامية</span><span>${moneyNum(o.tip)}</span></div>` : ''}
            ${o.discount ? `<div class="totals-row discount"><span>الخصم</span><span>− ${moneyNum(o.discount)}</span></div>` : ''}
            <div class="totals-row grand"><span>الإجمالي</span><span>${moneyNum(o.total)}</span></div>
        </div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إغلاق</button>
        <button class="btn btn-primary" onclick="showReceipt('${o.id}')"><i class="bi bi-printer"></i> طباعة الإيصال</button>
        <button class="btn btn-danger" data-perm="orders.delete" onclick="deleteOrderGuarded('${o.id}')"><i class="bi bi-trash"></i></button>`, 'lg');
    applyPermissions();
}

/* ============ المنتجات ============ */
function renderProductsPage() {
    const wrap = document.getElementById('productsContainer');
    if (!wrap) return;
    const list = getProducts();
    const available = list.filter(p => p.available).length;

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-box-seam stat-icon"></i><div class="stat-label">إجمالي المنتجات</div><div class="stat-value">${list.length}</div></div>
            <div class="stat green"><i class="bi bi-check2-circle stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">متوفر</div><div class="stat-value">${available}</div></div>
            <div class="stat gold"><i class="bi bi-bookmark-star stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">الأقسام</div><div class="stat-value">${getCategories().length}</div></div>
            <div class="stat blue"><i class="bi bi-currency-exchange stat-icon" style="color:rgba(37,99,235,.1)"></i><div class="stat-label">متوسط السعر</div><div class="stat-value" style="font-size:20px">${moneyNum(Math.round(list.reduce((s,p)=>s+p.price,0)/Math.max(list.length,1)))}</div></div>
        </div>

        <div class="toolbar">
            <div class="search-box"><i class="bi bi-search"></i><input class="input" placeholder="ابحث عن منتج..." oninput="searchProducts(this.value)"></div>
            <div class="filter-pills" id="prodCatFilter">
                ${renderProdCatFilter()}
            </div>
            <div class="spacer"></div>
            <button class="btn btn-gold" onclick="exportProductsPDF()"><i class="bi bi-filetype-pdf"></i> قائمة الطعام PDF</button>
            <button class="btn btn-primary" data-perm="products" onclick="guard('products', () => openProductForm())"><i class="bi bi-plus-lg"></i> وجبة جديدة</button>
        </div>

        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>المنتج</th><th>القسم</th><th>السعر</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                    <tbody id="productsTbody">${productRows(list)}</tbody>
                </table>
            </div>
        </div>`;
    applyPermissions();
}
let _prodCatFilter = 'all';
function renderProdCatFilter() {
    return `<span class="pill ${_prodCatFilter === 'all' ? 'active' : ''}" onclick="filterProdCat('all')">الكل</span>` +
        getCategories().map(c => `<span class="pill ${_prodCatFilter === c.id ? 'active' : ''}" onclick="filterProdCat('${c.id}')">${c.icon} ${c.name}</span>`).join('');
}
function filterProdCat(id) { _prodCatFilter = id; document.getElementById('prodCatFilter').innerHTML = renderProdCatFilter(); refreshProductsRows(); }
function searchProducts(v) { refreshProductsRows(v); }
function refreshProductsRows(q = '') {
    let list = getProducts();
    if (_prodCatFilter !== 'all') list = list.filter(p => p.categoryId === _prodCatFilter);
    if (q.trim()) { const s = q.trim().toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(s)); }
    document.getElementById('productsTbody').innerHTML = productRows(list);
    applyPermissions();
}
function productRows(list) {
    if (!list.length) return `<tr><td colspan="5"><div class="empty-state"><i class="bi bi-inbox"></i><p>لا توجد منتجات</p></div></td></tr>`;
    return list.map(p => {
        const cat = getCategory(p.categoryId);
        const visual = p.image ? `<img src="${p.image}">` : (p.emoji || '🍽️');
        return `<tr>
            <td><div class="cell-main"><div class="cell-thumb">${visual}</div><div><div style="font-weight:700">${p.name}</div>${p.description ? `<div style="font-size:11px;color:var(--muted);max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.description}</div>` : ''}</div></div></td>
            <td><span class="badge badge-dark">${cat ? cat.icon + ' ' + cat.name : '—'}</span></td>
            <td><strong style="color:var(--primary-dark)">${moneyNum(p.price)}</strong></td>
            <td>${p.available ? `<span class="badge badge-success">متوفر</span>` : `<span class="badge badge-danger">غير متوفر</span>`}</td>
            <td>
                <div style="display:flex;gap:5px">
                    <button class="icon-btn" style="width:32px;height:32px;font-size:14px" data-perm="products" onclick="guard('products', () => toggleAvail('${p.id}'))" title="توفر"><i class="bi bi-${p.available ? 'eye-slash' : 'eye'}"></i></button>
                    <button class="icon-btn" style="width:32px;height:32px;font-size:14px" data-perm="products" onclick="guard('products', () => openProductForm('${p.id}'))" title="تعديل"><i class="bi bi-pencil"></i></button>
                    <button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#fee2e2;color:#b91c1c;border-color:#fecaca" data-perm="products" onclick="guard('products', () => delProduct('${p.id}'))" title="حذف"><i class="bi bi-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}
function toggleAvail(id) { const p = getProduct(id); p.available = !p.available; persist(); refreshProductsRows(); toast(p.available ? 'أصبح متوفراً' : 'أصبح غير متوفر', 'info'); }
function delProduct(id) {
    if (!confirmAction('حذف هذا المنتج نهائياً؟')) return;
    api.deleteProduct(id); refreshProductsRows(); renderProductsPage(); toast('تم حذف المنتج', 'success');
}
function openProductForm(id) {
    const p = id ? getProduct(id) : null;
    const catOpts = getCategories().map(c => `<option value="${c.id}" ${p && p.categoryId === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('');
    openModalContent(p ? 'تعديل منتج' : 'إضافة منتج جديد', `
        <div class="row-flex">
            <div style="flex:1;min-width:200px">
                <div class="field">
                    <label>صورة المنتج</label>
                    <div class="img-upload" id="prodImgBox">
                        ${p && p.image ? `<img src="${p.image}"><button class="clear-img" onclick="event.stopPropagation();clearProdImg()"><i class="bi bi-x"></i></button>` : `<i class="bi bi-image"></i><span>اضغط لرفع صورة</span>`}
                        <input type="file" accept="image/*" hidden>
                    </div>
                </div>
            </div>
            <div style="flex:2;min-width:240px">
                <div class="field"><label>اسم المنتج *</label><input class="input" id="pfName" value="${p ? p.name : ''}" placeholder="مثال: كباب عراقي"></div>
                <div class="row-flex">
                    <div class="field" style="flex:1"><label>السعر *</label><input class="input" id="pfPrice" type="number" value="${p ? p.price : ''}" placeholder="بالدينار"></div>
                    <div class="field" style="flex:1"><label>القسم *</label><select class="input" id="pfCat">${catOpts}</select></div>
                </div>
                <div class="row-flex">
                    <div class="field" style="flex:1"><label>رمز تعبيري (بدون صورة)</label><input class="input" id="pfEmoji" value="${p ? p.emoji : '🍽️'}" maxlength="2"></div>
                    <div class="field" style="flex:1"><label>التوفر</label><select class="input" id="pfAvail"><option value="true" ${!p || p.available ? 'selected' : ''}>متوفر</option><option value="false" ${p && !p.available ? 'selected' : ''}>غير متوفر</option></select></div>
                </div>
                <div class="row-flex">
                    <div class="field" style="flex:1"><label>الكمية في المخزون</label><input class="input" id="pfStock" type="number" value="${p ? Number(p.stock || 0) : 50}"></div>
                    <div class="field" style="flex:1"><label>تكلفة الوحدة</label><input class="input" id="pfCost" type="number" value="${p ? Number(p.cost || 0) : 0}"></div>
                </div>
            </div>
        </div>
        <div class="field"><label>الوصف</label><textarea class="input" id="pfDesc" placeholder="وصف مختصر للمنتج">${p ? p.description || '' : ''}</textarea></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" onclick="saveProduct('${id || ''}')" style="flex:1"><i class="bi bi-check2"></i> حفظ المنتج</button>`, 'lg');
    bindImageUpload('#prodImgBox', handleProdImgPick);
}
function handleProdImgPick(box, data) {
    window._prodImgData = data;
    box.innerHTML = `<img src="${data}"><button class="clear-img" onclick="event.stopPropagation();clearProdImg()"><i class="bi bi-x"></i></button><input type="file" accept="image/*" hidden>`;
    bindImageUpload('#prodImgBox', handleProdImgPick);
}
function clearProdImg() {
    window._prodImgData = '';
    const box = document.getElementById('prodImgBox');
    box.innerHTML = `<i class="bi bi-image"></i><span>اضغط لرفع صورة</span><input type="file" accept="image/*" hidden>`;
}
function saveProduct(id) {
    const name = document.getElementById('pfName').value.trim();
    const price = Number(document.getElementById('pfPrice').value);
    if (!name || !price) { toast('أدخل الاسم والسعر', 'error'); return; }
    const data = {
        name, price,
        categoryId: document.getElementById('pfCat').value,
        emoji: document.getElementById('pfEmoji').value.trim() || '🍽️',
        available: document.getElementById('pfAvail').value === 'true',
        description: document.getElementById('pfDesc').value.trim(),
        stock: Math.max(0, Number(document.getElementById('pfStock').value) || 0),
        cost: Math.max(0, Number(document.getElementById('pfCost').value) || 0)
    };
    if (window._prodImgData !== undefined) data.image = window._prodImgData;
    if (id) api.updateProduct(id, data); else api.addProduct(data);
    window._prodImgData = undefined;
    closeModal('dynModal');
    refreshProductsRows(); renderProductsPage();
    toast(id ? 'تم تحديث المنتج' : 'تمت إضافة المنتج', 'success');
}

/* ============ الأقسام (الفئات) ============ */
function renderCategories() {
    const wrap = document.getElementById('categoriesContainer');
    if (!wrap) return;
    const cats = getCategories();
    wrap.innerHTML = `
        <div class="page-head" style="margin-bottom:18px">
            <div class="sub" style="font-size:13px">إجمالي ${cats.length} قسم — اضغط على القسم لعرض منتجاته</div>
            <button class="btn btn-primary" data-perm="categories" onclick="guard('categories', () => openCategoryForm())"><i class="bi bi-plus-lg"></i> قسم جديد</button>
        </div>
        <div class="grid grid-3" id="catGrid">
            ${cats.map(c => {
                const count = getProducts().filter(p => p.categoryId === c.id).length;
                return `<div class="cat-card" onclick="goToCatProducts('${c.id}')">
                    <div class="cc-actions" style="position:absolute;top:8px;left:8px">
                        <button class="icon-btn" style="width:28px;height:28px;font-size:12px" data-perm="categories" onclick="event.stopPropagation();guard('categories', () => openCategoryForm('${c.id}'))" title="تعديل"><i class="bi bi-pencil"></i></button>
                        <button class="icon-btn" style="width:28px;height:28px;font-size:12px;background:#fee2e2;color:#b91c1c;border-color:#fecaca" data-perm="categories" onclick="event.stopPropagation();guard('categories', () => delCategory('${c.id}'))" title="حذف"><i class="bi bi-trash"></i></button>
                    </div>
                    <div class="cc-icon" style="background:${c.color}">${c.icon}</div>
                    <h4>${c.name}</h4>
                    <div class="cc-count">${count} منتج</div>
                </div>`;
            }).join('')}
            <div class="cat-card" data-perm="categories" style="border-style:dashed;display:flex;align-items:center;justify-content:center;min-height:140px" onclick="guard('categories', () => openCategoryForm())">
                <div style="text-align:center;color:var(--muted)"><i class="bi bi-plus-circle" style="font-size:30px"></i><div style="font-weight:700;margin-top:6px">إضافة قسم</div></div>
            </div>
        </div>`;
    applyPermissions();
}
function goToCatProducts(catId) { navigate('products'); _prodCatFilter = catId; setTimeout(renderProductsPage, 50); }
function openCategoryForm(id) {
    const c = id ? getCategory(id) : null;
    openModalContent(c ? 'تعديل قسم' : 'إضافة قسم', `
        <div class="field"><label>اسم القسم *</label><input class="input" id="cfName" value="${c ? c.name : ''}" placeholder="مثال: المشاوي"></div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>الأيقونة (إيموجي)</label><input class="input" id="cfIcon" value="${c ? c.icon : '🍴'}" maxlength="2"></div>
            <div class="field" style="flex:1"><label>اللون</label><input class="input" id="cfColor" type="color" value="${c ? c.color : '#c1272d'}" style="height:46px;padding:4px"></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${['🍢','🍛','🥗','🥤','🍮','🫓','🍕','🍔','🍜','🍤','🍰','☕'].map(e => `<span class="pill" onclick="document.getElementById('cfIcon').value='${e}'">${e}</span>`).join('')}
        </div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" onclick="saveCategory('${id || ''}')" style="flex:1"><i class="bi bi-check2"></i> حفظ</button>`);
}
function saveCategory(id) {
    const name = document.getElementById('cfName').value.trim();
    if (!name) { toast('أدخل اسم القسم', 'error'); return; }
    const data = { name, icon: document.getElementById('cfIcon').value.trim() || '🍴', color: document.getElementById('cfColor').value };
    if (id) api.updateCategory(id, data); else api.addCategory(data);
    closeModal('dynModal'); renderCategories(); refreshBranding();
    toast(id ? 'تم تحديث القسم' : 'تمت إضافة القسم', 'success');
}
function delCategory(id) {
    if (!confirmAction('حذف هذا القسم؟ لا يمكن الحذف إذا كان يحتوي على منتجات.')) return;
    if (api.deleteCategory(id)) { renderCategories(); toast('تم حذف القسم', 'success'); }
}

/* ============ المبيعات ============ */
let salesRange = 'today';
function renderSales() {
    const wrap = document.getElementById('salesContainer');
    if (!wrap) return;
    const { records, totals } = computeSales(salesRange);

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat gold"><i class="bi bi-cash-coin stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">إجمالي المبيعات</div><div class="stat-value" style="font-size:22px">${moneyNum(totals.revenue)}</div></div>
            <div class="stat green"><i class="bi bi-receipt stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">عدد الفواتير</div><div class="stat-value">${totals.count}</div></div>
            <div class="stat blue"><i class="bi bi-graph-up stat-icon" style="color:rgba(37,99,235,.1)"></i><div class="stat-label">متوسط الفاتورة</div><div class="stat-value" style="font-size:20px">${moneyNum(totals.count ? Math.round(totals.revenue / totals.count) : 0)}</div></div>
            <div class="stat purple"><i class="bi bi-tag stat-icon" style="color:rgba(124,58,237,.1)"></i><div class="stat-label">إجمالي الخصومات</div><div class="stat-value" style="font-size:20px">${moneyNum(totals.discount)}</div></div>
        </div>

        <div class="toolbar">
            <div class="filter-pills">
                ${[['today', 'اليوم'], ['week', 'هذا الأسبوع'], ['month', 'هذا الشهر'], ['all', 'الكل']].map(([k, l]) =>
                    `<span class="pill ${salesRange === k ? 'active' : ''}" onclick="setSalesRange('${k}')">${l}</span>`).join('')}
            </div>
            <div class="spacer"></div>
            <button class="btn btn-gold" onclick="exportSalesPDF('${salesRange}')"><i class="bi bi-filetype-pdf"></i> تقرير مبيعات PDF</button>
        </div>

        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>الرقم</th><th>التاريخ والوقت</th><th>العميل</th><th>النوع</th><th>الدفع</th><th>الخصم</th><th>الإجمالي</th></tr></thead>
                    <tbody>
                    ${records.length ? records.map(o => `<tr>
                        <td><strong>#${o.number}</strong></td>
                        <td style="font-size:12.5px">${fmtDateTime(o.createdAt)}</td>
                        <td>${o.customerName}</td>
                        <td><span class="badge badge-dark">${o.orderTypeLabel}</span></td>
                        <td>${o.paymentMethod === 'cash' ? 'كاش' : o.paymentMethod === 'card' ? 'بطاقة' : 'إلكتروني'}</td>
                        <td>${o.discount ? '<span style="color:var(--success)">− ' + moneyNum(o.discount) + '</span>' : '—'}</td>
                        <td><strong style="color:var(--primary-dark)">${moneyNum(o.total)}</strong></td>
                    </tr>`).join('') : `<tr><td colspan="7"><div class="empty-state"><i class="bi bi-inbox"></i><p>لا توجد مبيعات في هذه الفترة</p></div></td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>`;
}
function setSalesRange(r) { salesRange = r; renderSales(); }
function computeSales(range) {
    const now = new Date();
    let from = 0;
    if (range === 'today') from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    else if (range === 'week') { const d = new Date(now); d.setDate(d.getDate() - 6); from = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
    else if (range === 'month') from = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const records = getOrders().filter(o => o.status !== 'cancelled' && o.createdAt >= from);
    const totals = {
        revenue: records.reduce((s, o) => s + (o.total || 0), 0),
        count: records.length,
        discount: records.reduce((s, o) => s + (o.discount || 0), 0),
        tax: records.reduce((s, o) => s + (o.tax || 0), 0)
    };
    return { records, totals };
}

/* ============ العملاء ============ */
function renderCustomers() {
    const wrap = document.getElementById('customersContainer');
    if (!wrap) return;
    const customers = getCustomers();
    // إحصائيات لكل عميل
    const enriched = customers.map(c => {
        const ords = getOrders().filter(o => o.customerId === c.id && o.status !== 'cancelled');
        return {
            ...c,
            ordersCount: ords.length,
            totalSpent: ords.reduce((s, o) => s + o.total, 0),
            lastVisit: ords.length ? Math.max(...ords.map(o => o.createdAt)) : null
        };
    });

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-people stat-icon"></i><div class="stat-label">إجمالي العملاء</div><div class="stat-value">${customers.length}</div></div>
            <div class="stat gold"><i class="bi bi-star stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">إجمالي النقاط</div><div class="stat-value">${enriched.reduce((s,c)=>s+(c.points||0),0)}</div></div>
            <div class="stat green"><i class="bi bi-cash-stack stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">إنفاق العملاء</div><div class="stat-value" style="font-size:20px">${moneyNum(enriched.reduce((s,c)=>s+c.totalSpent,0))}</div></div>
            <div class="stat purple"><i class="bi bi-trophy stat-icon" style="color:rgba(124,58,237,.1)"></i><div class="stat-label">أفضل عميل</div><div class="stat-value" style="font-size:15px">${enriched.length ? enriched.slice().sort((a,b)=>b.totalSpent-a.totalSpent)[0].name : '—'}</div></div>
        </div>

        <div class="toolbar">
            <div class="search-box"><i class="bi bi-search"></i><input class="input" placeholder="ابحث عن عميل..." oninput="searchCustomers(this.value)"></div>
            <div class="spacer"></div>
            <button class="btn btn-gold" onclick="exportCustomersPDF()"><i class="bi bi-filetype-pdf"></i> تقرير العملاء PDF</button>
            <button class="btn btn-primary" onclick="openCustomerForm()"><i class="bi bi-plus-lg"></i> عميل جديد</button>
        </div>

        <div class="card">
            <div class="table-wrap">
                <table class="tbl">
                    <thead><tr><th>العميل</th><th>المستوى</th><th>الهاتف</th><th>النقاط</th><th>الطلبات</th><th>إجمالي الإنفاق</th><th>آخر زيارة</th><th>إجراءات</th></tr></thead>
                    <tbody id="custTbody">${customerRows(enriched)}</tbody>
                </table>
            </div>
        </div>`;
}
function searchCustomers(v) {
    const q = v.trim().toLowerCase();
    let list = getCustomers().map(c => {
        const ords = getOrders().filter(o => o.customerId === c.id && o.status !== 'cancelled');
        return { ...c, ordersCount: ords.length, totalSpent: ords.reduce((s, o) => s + o.total, 0), lastVisit: ords.length ? Math.max(...ords.map(o => o.createdAt)) : null };
    });
    if (q) list = list.filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q));
    document.getElementById('custTbody').innerHTML = customerRows(list);
}
function customerRows(list) {
    if (!list.length) return `<tr><td colspan="8"><div class="empty-state"><i class="bi bi-inbox"></i><p>لا يوجد عملاء</p></div></td></tr>`;
    return list.map(c => {
        const ti = customerTier(c.id);
        return `<tr>
        <td><div class="cell-main"><div class="cell-thumb" style="background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#fff;font-weight:800">${c.name.charAt(0)}</div><strong>${c.name}</strong></div></td>
        <td><span class="tier-chip" style="--tc:${ti.color}">${ti.icon} ${ti.label}${ti.discount ? ` −${ti.discount}%` : ''}</span></td>
        <td style="direction:ltr;text-align:right">${c.phone}</td>
        <td>${getSettings().enablePoints ? `<span class="badge badge-gold"><i class="bi bi-star-fill"></i> ${c.points || 0}</span>` : '—'}</td>
        <td>${c.ordersCount}</td>
        <td><strong style="color:var(--primary-dark)">${moneyNum(c.totalSpent)}</strong></td>
        <td style="font-size:12.5px">${c.lastVisit ? fmtDate(c.lastVisit) : '—'}</td>
        <td>
            <div style="display:flex;gap:5px">
                <button class="icon-btn" style="width:32px;height:32px;font-size:14px" onclick="openCustomerForm('${c.id}')" title="تعديل"><i class="bi bi-pencil"></i></button>
                ${c.id !== 'cu1' ? `<button class="icon-btn" style="width:32px;height:32px;font-size:14px;background:#fee2e2;color:#b91c1c;border-color:#fecaca" onclick="delCustomer('${c.id}')" title="حذف"><i class="bi bi-trash"></i></button>` : ''}
            </div>
        </td>
    </tr>`; }).join('');
}
function openCustomerForm(id) {
    const c = id ? getCustomer(id) : null;
    openModalContent(c ? 'تعديل عميل' : 'عميل جديد', `
        <div class="field"><label>الاسم *</label><input class="input" id="cufName" value="${c ? c.name : ''}" placeholder="اسم العميل"></div>
        <div class="field"><label>رقم الهاتف</label><input class="input" id="cufPhone" type="tel" value="${c && c.phone !== '-' ? c.phone : ''}" placeholder="0770 000 0000" style="direction:ltr;text-align:right"></div>
        ${getSettings().enablePoints ? `<div class="field"><label>نقاط الولاء</label><input class="input" id="cufPoints" type="number" value="${c ? c.points : 0}"></div>` : ''}
        <div class="field"><label>عناوين التوصيل المحفوظة</label>
            <div id="cufAddrs">${(c?.addresses || []).map((a, i) => `
                <div class="row-flex" style="margin-bottom:8px">
                    <input class="input" data-ak="label" data-i="${i}" value="${a.label || ''}" placeholder="البيت / المكتب">
                    <select class="input" data-ak="zoneId" data-i="${i}">
                        <option value="">منطقة</option>
                        ${getActiveZones().map(z => `<option value="${z.id}" ${a.zoneId === z.id ? 'selected' : ''}>${z.name} — ${moneyNum(z.fee)}</option>`).join('')}
                    </select>
                    <input class="input" data-ak="address" data-i="${i}" value="${a.address || ''}" placeholder="العنوان التفصيلي" style="flex:2">
                </div>`).join('') || '<p style="font-size:12px;color:var(--muted)">لا عناوين بعد — تُحفظ تلقائياً من طلبات التوصيل</p>'}
            </div>
            ${c && c.id !== 'cu1' ? `<button type="button" class="btn btn-light btn-sm" onclick="addBlankAddr()"><i class="bi bi-plus"></i> عنوان</button>` : ''}
        </div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" onclick="saveCustomer('${id || ''}')" style="flex:1"><i class="bi bi-check2"></i> حفظ</button>`);
}
function saveCustomer(id) {
    const name = document.getElementById('cufName').value.trim();
    if (!name) { toast('أدخل اسم العميل', 'error'); return; }
    const data = { name, phone: document.getElementById('cufPhone').value.trim() || '-' };
    if (getSettings().enablePoints) data.points = Number(document.getElementById('cufPoints').value) || 0;
    if (id) api.updateCustomer(id, data); else api.addCustomer(data);
    closeModal('dynModal'); renderCustomers();
    toast(id ? 'تم تحديث العميل' : 'تمت إضافة العميل', 'success');
}
function addBlankAddr() {
    const box = document.getElementById('cufAddrs');
    if (!box) return;
    const i = box.querySelectorAll('[data-i]').length ? Math.max(...[...box.querySelectorAll('[data-i]')].map(e => Number(e.dataset.i))) + 1 : 0;
    const row = document.createElement('div');
    row.className = 'row-flex';
    row.style.marginBottom = '8px';
    row.innerHTML = `<input class="input" data-ak="label" data-i="${i}" placeholder="البيت / المكتب">
        <select class="input" data-ak="zoneId" data-i="${i}"><option value="">منطقة</option>${getActiveZones().map(z => `<option value="${z.id}">${z.name} — ${moneyNum(z.fee)}</option>`).join('')}</select>
        <input class="input" data-ak="address" data-i="${i}" placeholder="العنوان التفصيلي" style="flex:2">`;
    box.appendChild(row);
}
function delCustomer(id) {
    if (!confirmAction('حذف هذا العميل؟')) return;
    if (api.deleteCustomer(id)) { renderCustomers(); toast('تم حذف العميل', 'success'); }
}
