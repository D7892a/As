/* ============================================
   شاشة نقطة البيع (POS)
   ============================================ */

let cart = [];
let cartCustomerId = 'cu1';
let cartOrderType = 'dine';   // dine | take | delivery
let cartTableId = null;
let cartZoneId = null;
let cartAddress = '';
let activeCat = 'all';
let posSearch = '';

const ORDER_TYPES = {
    dine: { label: 'صالة', icon: 'bi-shop' },
    take: { label: 'سفري', icon: 'bi-bag' },
    delivery: { label: 'توصيل', icon: 'bi-truck' }
};

function renderPOS() {
    renderCategoryChips();
    renderProductGrid();
    renderCart();
}

/* ----- شرائح الأقسام ----- */
function renderCategoryChips() {
    const wrap = document.getElementById('posCats');
    if (!wrap) return;
    let html = `<div class="cat-chip ${activeCat === 'all' ? 'active' : ''}" onclick="setCat('all')"><i class="bi bi-grid-fill"></i> الكل</div>`;
    const liveOffers = getOffers().filter(isOfferLive).length;
    if (getSettings().enableOffers && liveOffers) {
        html += `<div class="cat-chip offer-chip ${activeCat === 'offers' ? 'active' : ''}" onclick="setCat('offers')"><span>🔥</span> العروض <span class="chip-count">${liveOffers}</span></div>`;
    }
    getCategories().forEach(c => {
        html += `<div class="cat-chip ${activeCat === c.id ? 'active' : ''}" onclick="setCat('${c.id}')"><span>${c.icon}</span> ${c.name}</div>`;
    });
    wrap.innerHTML = html;
}
function setCat(id) { activeCat = id; renderCategoryChips(); renderProductGrid(); }

function onPosSearch(v) { posSearch = v.trim().toLowerCase(); renderProductGrid(); }

/* ----- شبكة المنتجات ----- */
function renderProductGrid() {
    const grid = document.getElementById('posGrid');
    if (!grid) return;

    /* --- شبكة العروض --- */
    if (activeCat === 'offers') {
        const offers = getOffers().filter(isOfferLive)
            .filter(o => !posSearch || o.name.toLowerCase().includes(posSearch));
        grid.innerHTML = offers.length ? offers.map(o => {
            const saving = offerSaving(o);
            const original = offerOriginalPrice(o);
            const visual = o.image ? `<img src="${o.image}" alt="${o.name}">` : (o.emoji || '🎁');
            return `
            <div class="product-card offer-pc" onclick="addOfferToCart('${o.id}')">
                <div class="pc-img offer-img">${visual}</div>
                ${o.badge ? `<span class="pc-badge" style="background:var(--gold);color:var(--dark)">${o.badge}</span>` : ''}
                <div class="pc-body">
                    <div class="pc-name">${o.name}</div>
                    <div class="pc-cat">${(o.items || []).reduce((n, i) => n + i.qty, 0)} أصناف${saving ? ` • وفّر ${moneyNum(saving)}` : ''}</div>
                    <div class="pc-price">${moneyNum(o.price)}
                        ${saving ? `<small style="text-decoration:line-through;color:var(--muted);font-size:11px">${moneyNum(original)}</small>` : ''}
                    </div>
                </div>
            </div>`;
        }).join('') : `<div class="empty-state" style="grid-column:1/-1"><i class="bi bi-stars"></i><p>لا توجد عروض سارية حالياً</p></div>`;
        return;
    }

    let list = getProducts();
    if (activeCat !== 'all') list = list.filter(p => p.categoryId === activeCat);
    if (posSearch) list = list.filter(p => p.name.toLowerCase().includes(posSearch) || (getCategory(p.categoryId)?.name || '').toLowerCase().includes(posSearch));

    if (!list.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="bi bi-search"></i><p>لا توجد منتجات مطابقة</p></div>`;
        return;
    }
    const s = getSettings();
    grid.innerHTML = list.map(p => {
        const cat = getCategory(p.categoryId);
        const visual = p.image ? `<img src="${p.image}" alt="${p.name}">` : (p.emoji || '🍽️');
        const stock = Number(p.stock || 0);
        const out = s.trackStock && s.blockOutOfStock && stock <= 0;
        const clickable = p.available && !out;
        const low = s.trackStock && stock > 0 && stock <= (s.lowStockQty || 5);
        return `
        <div class="product-card ${clickable ? '' : 'unavailable'}" onclick="${clickable ? `addToCart('${p.id}')` : ''}">
            <div class="pc-img">${visual}</div>
            ${!p.available ? `<span class="pc-badge" style="background:#dc2626;color:#fff">غير متوفر</span>`
                : out ? `<span class="pc-badge" style="background:#dc2626;color:#fff">نفد المخزون</span>`
                : low ? `<span class="pc-badge" style="background:#fef3c7;color:#a16207">باقي ${stock}</span>` : ''}
            <div class="pc-body">
                <div class="pc-name">${p.name}</div>
                <div class="pc-cat">${cat ? cat.name : ''}</div>
                <div class="pc-price">${moneyNum(p.price)} <small style="font-size:11px;color:var(--muted)">${getSettings().currency}</small></div>
            </div>
        </div>`;
    }).join('');
}

/* ----- إضافة عرض إلى السلة ----- */
function addOfferToCart(offerId) {
    const o = getOffer(offerId);
    if (!o) return;
    if (!isOfferLive(o)) { toast('هذا العرض غير ساري حالياً', 'warning'); return; }
    const line = cart.find(i => i.productId === o.id);
    if (line) line.qty += 1;
    else cart.push({
        productId: o.id, offerId: o.id, isOffer: true,
        name: `🔥 ${o.name}`, price: Number(o.price) || 0, qty: 1
    });
    renderCart();
    toast(`أُضيف العرض: ${o.name}`, 'success', 1800);
}

/* ----- السلة ----- */
function addToCart(productId) {
    const p = getProduct(productId);
    if (!p) return;
    const line = cart.find(i => i.productId === productId);
    if (line) line.qty += 1;
    else cart.push({ productId, name: p.name, price: p.price, qty: 1 });
    renderCart();
}
function changeQty(productId, delta) {
    const line = cart.find(i => i.productId === productId);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) cart = cart.filter(i => i.productId !== productId);
    renderCart();
}
function removeLine(productId) {
    cart = cart.filter(i => i.productId !== productId);
    renderCart();
}
function clearCart() {
    if (!cart.length) return;
    if (confirmAction('هل تريد إفراغ السلة؟')) { cart = []; renderCart(); }
}

function setOrderType(t) {
    cartOrderType = t;
    if (t !== 'dine') cartTableId = null;
    if (t !== 'delivery') { cartZoneId = null; cartAddress = ''; }
    if (t === 'delivery' && !cartZoneId) {
        const preferred = getCustomer(cartCustomerId)?.zoneId;
        if (preferred && getZone(preferred)?.active !== false) cartZoneId = preferred;
    }
    renderCart();
}
function setCartZone(id) {
    cartZoneId = id || null;
    if (cartCustomerId !== 'cu1') {
        const c = getCustomer(cartCustomerId);
        if (c) { c.zoneId = cartZoneId; persist(); }
    }
    renderCart();
}
function setCartCustomer(id) {
    cartCustomerId = id;
    const c = getCustomer(id);
    if (cartOrderType === 'delivery' && c) {
        cartZoneId = c.zoneId && getZone(c.zoneId)?.active !== false ? c.zoneId : cartZoneId;
        cartAddress = c.address || cartAddress;
    }
    renderCart();
}
function setCartTable(id) { cartTableId = id || null; renderCart(); }

function cartTotals() {
    const s = getSettings();
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const tax = s.enableTax ? Math.round(subtotal * (s.taxRate / 100)) : 0;
    const service = Math.round(subtotal * ((s.serviceCharge || 0) / 100));
    // أجرة التوصيل حسب المنطقة
    const zone = (cartOrderType === 'delivery' && cartZoneId) ? getZone(cartZoneId) : null;
    const baseDeliveryFee = zone ? Number(zone.fee || 0) : 0;
    const deliveryFee = zone && Number(zone.freeAbove || 0) > 0 && subtotal >= Number(zone.freeAbove) ? 0 : baseDeliveryFee;
    // خصم مستوى الولاء تلقائياً
    let tierDiscount = 0, tierInfo = null;
    if (cartCustomerId && cartCustomerId !== 'cu1' && s.enablePoints) {
        tierInfo = customerTier(cartCustomerId);
        if (tierInfo.discount) tierDiscount = Math.round(subtotal * tierInfo.discount / 100);
    }
    const manual = window._cartDiscount || 0;
    const discount = manual + tierDiscount;
    const total = Math.max(0, subtotal + tax + service + deliveryFee - discount);
    return { subtotal, tax, service, deliveryFee, baseDeliveryFee, zone, discount, manual, tierDiscount, tierInfo, total, items: cart.reduce((n, i) => n + i.qty, 0) };
}

function renderCart() {
    const panel = document.getElementById('cartPanel');
    if (!panel) return;

    // أزرار نوع الطلب
    panel.querySelector('.cart-type-row').innerHTML = Object.entries(ORDER_TYPES).map(([k, v]) =>
        `<button class="type-btn ${cartOrderType === k ? 'active' : ''}" onclick="setOrderType('${k}')"><i class="bi ${v.icon}"></i> ${v.label}</button>`
    ).join('');

    // اختيار العميل
    const cust = getCustomer(cartCustomerId);
    panel.querySelector('.cart-customer').innerHTML = `
        <i class="bi bi-person-fill" style="color:var(--muted);font-size:18px"></i>
        <div style="flex:1;min-width:0">
            <div style="font-size:11px;color:var(--muted);font-weight:600">العميل</div>
            <div style="font-size:13.5px;font-weight:700">${cust.name}
                ${cartCustomerId !== 'cu1' && getSettings().enablePoints ? (() => { const ti = customerTier(cartCustomerId); return `<span class="tier-chip" style="--tc:${ti.color}">${ti.icon} ${ti.label}</span>`; })() : ''}
            </div>
        </div>
        <button class="btn btn-light btn-sm" onclick="openCustomerPicker()"><i class="bi bi-three-dots"></i></button>`;

    // اختيار الطاولة (للصالة فقط)
    const tableRow = panel.querySelector('.cart-table');
    if (tableRow) {
        if (cartOrderType === 'dine' && getSettings().enableTables) {
            const free = getTables().filter(t => t.status === 'free' || t.id === cartTableId);
            tableRow.style.display = 'flex';
            tableRow.innerHTML = `
                <i class="bi bi-grid-3x3-gap-fill" style="color:var(--muted);font-size:18px"></i>
                <div style="flex:1;min-width:0">
                    <div style="font-size:11px;color:var(--muted);font-weight:600">الطاولة</div>
                    <select class="input input-sm" onchange="setCartTable(this.value)" style="padding:4px 8px;font-size:13px;font-weight:700">
                        <option value="">بدون طاولة</option>
                        ${free.map(t => `<option value="${t.id}" ${cartTableId === t.id ? 'selected' : ''}>${t.name} — ${t.zone} (${t.seats} كراسي)</option>`).join('')}
                    </select>
                </div>`;
        } else if (cartOrderType === 'delivery' && getSettings().enableDelivery) {
            tableRow.style.display = 'flex';
            tableRow.innerHTML = `
                <i class="bi bi-geo-alt-fill" style="color:var(--muted);font-size:18px"></i>
                <div style="flex:1;min-width:0">
                    <div style="font-size:11px;color:var(--muted);font-weight:600">منطقة التوصيل</div>
                    <select class="input input-sm" onchange="setCartZone(this.value)" style="padding:4px 8px;font-size:13px;font-weight:700">
                        <option value="">— اختر المنطقة (إلزامي) —</option>
                        ${getZones().filter(z => z.active !== false).map(z => `<option value="${z.id}" ${cartZoneId === z.id ? 'selected' : ''}>${z.name} — ${moneyNum(z.fee)} • ${z.minutes} دقيقة</option>`).join('')}
                    </select>
                    ${cartZoneId ? (() => { const z = getZone(cartZoneId); const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0); const free = Number(z?.freeAbove || 0) > 0 && total >= Number(z.freeAbove); return `<div class="delivery-quote"><span><i class="bi bi-stopwatch"></i> ${z?.minutes || 30} دقيقة</span><span><i class="bi bi-cash-coin"></i> ${free ? '<b>مجاني</b>' : moneyNum(z?.fee || 0)}</span>${z?.minimumOrder ? `<span>حد أدنى ${moneyNum(z.minimumOrder)}</span>` : ''}</div>`; })() : '<div class="delivery-required"><i class="bi bi-exclamation-circle"></i> حدد المنطقة ليُحتسب سعر التوصيل</div>'}
                </div>`;
        } else { tableRow.style.display = 'none'; tableRow.innerHTML = ''; }
    }

    // العناصر
    const itemsEl = panel.querySelector('.cart-items');
    if (!cart.length) {
        itemsEl.innerHTML = `<div class="cart-empty"><i class="bi bi-cart3"></i><p>السلة فارغة<br>اضغط على منتج لإضافته</p></div>`;
    } else {
        itemsEl.innerHTML = cart.map(i => `
            <div class="cart-line ${i.isOffer ? 'is-offer' : ''}">
                <div class="cl-info">
                    <div class="cl-name">${i.name}</div>
                    <div class="cl-price" ${can('pos.price') ? `onclick="editLinePrice('${i.productId}')" style="cursor:pointer;text-decoration:underline dotted"` : ''}>${moneyNum(i.price)} × ${i.qty}</div>
                </div>
                <div class="qty-stepper">
                    <button onclick="changeQty('${i.productId}',-1)">−</button>
                    <span class="q">${i.qty}</span>
                    <button onclick="changeQty('${i.productId}',1)">+</button>
                </div>
                <div class="cl-total">${moneyNum(i.price * i.qty)}</div>
                <span class="cl-remove" onclick="removeLine('${i.productId}')"><i class="bi bi-x-circle"></i></span>
            </div>`).join('');
    }

    // المجاميع
    const t = cartTotals();
    const s = getSettings();
    panel.querySelector('.cart-totals').innerHTML = `
        <div class="totals-row"><span>المجموع الفرعي (${t.items} صنف)</span><span>${moneyNum(t.subtotal)}</span></div>
        ${s.enableTax ? `<div class="totals-row"><span>الضريبة (${s.taxRate}%)</span><span>${moneyNum(t.tax)}</span></div>` : ''}
        ${s.serviceCharge ? `<div class="totals-row"><span>رسوم خدمة (${s.serviceCharge}%)</span><span>${moneyNum(t.service)}</span></div>` : ''}
        ${cartOrderType === 'delivery' && t.zone ? `<div class="totals-row"><span><i class="bi bi-truck"></i> توصيل ${t.zone.name}</span><span>${t.deliveryFee ? moneyNum(t.deliveryFee) : '<b style="color:var(--success)">مجاني</b>'}</span></div>` : ''}
        ${t.tierDiscount ? `<div class="totals-row discount"><span>${t.tierInfo.icon} خصم عميل ${t.tierInfo.label} (${t.tierInfo.discount}%)</span><span>− ${moneyNum(t.tierDiscount)}</span></div>` : ''}
        ${t.manual ? `<div class="totals-row discount"><span>خصم يدوي</span><span>− ${moneyNum(t.manual)}</span></div>` : ''}
        <div class="totals-row grand"><span>الإجمالي</span><span>${moneyNum(t.total)}</span></div>`;

    // الأزرار
    const heldCount = getSuspendedCarts().length;
    panel.querySelector('.cart-actions').innerHTML = `
        ${cart.length ? `<button class="btn btn-ghost btn-sm" onclick="clearCart()" title="تفريغ"><i class="bi bi-trash"></i></button>` : ''}
        <button class="btn btn-light btn-sm hold-btn" onclick="openSuspendedCarts()" title="الطلبات المعلّقة"><i class="bi bi-inboxes"></i>${heldCount ? `<span>${heldCount}</span>` : ''}</button>
        ${cart.length ? `<button class="btn btn-gold btn-sm" onclick="suspendCurrentCart()" title="تعليق الطلب"><i class="bi bi-pause-circle"></i></button>` : ''}
        ${cart.length && can('pos.discount') ? `<button class="btn btn-dark" onclick="applyDiscount()" style="flex:1"><i class="bi bi-tag"></i> خصم</button>` : ''}
        <button class="btn btn-success btn-lg" style="flex:2" ${cart.length ? '' : 'disabled'} onclick="openPayment()"><i class="bi bi-cash-coin"></i> الدفع</button>`;

    // رقم الطلب التالي
    panel.querySelector('.order-num').textContent = '#' + (DB.orderCounter + 1);
}

/* ----- تعديل سعر صنف داخل السلة (بصلاحية) ----- */
function editLinePrice(productId) {
    if (!can('pos.price')) { denied(); return; }
    const line = cart.find(i => i.productId === productId);
    if (!line) return;
    const v = prompt(`السعر الجديد لـ ${line.name}:`, line.price);
    if (v === null) return;
    line.price = Math.max(0, Number(v) || 0);
    renderCart();
    toast('تم تعديل السعر', 'info');
}

/* ----- خصم سريع ----- */
function applyDiscount() {
    if (!can('pos.discount')) { denied(); return; }
    const t = cartTotals();
    const input = prompt('أدخل مبلغ الخصم (بالدينار):', '0');
    if (input === null) return;
    const val = Math.max(0, Math.min(Number(input) || 0, t.subtotal + t.tax + t.service));
    window._cartDiscount = val;
    renderCart();
    if (val > 0) toast(`تم تطبيق خصم ${moneyNum(val)}`, 'info');
}

/* ----- منتقي العميل ----- */
function openCustomerPicker() {
    const list = getCustomers().map(c => `
        <div class="cart-line" style="cursor:pointer" onclick="pickCustomer('${c.id}')">
            <div class="cell-thumb" style="background:var(--cream-2)">${c.name.charAt(0)}</div>
            <div class="cl-info">
                <div class="cl-name">${c.name}</div>
                <div class="cl-price">${c.phone} ${getSettings().enablePoints ? `• ${c.points} نقطة` : ''}</div>
            </div>
            <i class="bi bi-chevron-left" style="color:var(--muted)"></i>
        </div>`).join('');
    openModalContent('اختيار العميل', `
        <div style="margin-bottom:12px;display:flex;gap:8px">
            <input class="input" id="quickCustName" placeholder="اسم عميل جديد (اختياري)">
            <input class="input" id="quickCustPhone" placeholder="الهاتف">
            <button class="btn btn-primary" onclick="quickAddCustomer()"><i class="bi bi-plus-lg"></i></button>
        </div>
        <div style="max-height:340px;overflow-y:auto">${list}</div>
    `);
}
function quickAddCustomer() {
    const name = document.getElementById('quickCustName').value.trim();
    if (!name) { toast('أدخل اسم العميل', 'error'); return; }
    const phone = document.getElementById('quickCustPhone').value.trim() || '-';
    const c = api.addCustomer({ name, phone });
    pickCustomer(c.id);
    toast('تمت إضافة العميل', 'success');
}
function pickCustomer(id) {
    cartCustomerId = id;
    closeModal('dynModal');
    renderCart();
}

/* ----- نافذة ديناميكية ----- */
function openModalContent(title, bodyHtml, footerHtml = '', size = '') {
    const m = document.getElementById('dynModal');
    m.className = 'modal-overlay show' + (size ? ' ' + size : '');
    m.querySelector('.modal').className = 'modal' + (size ? ' modal-' + size : '');
    m.querySelector('.modal-head h3').innerHTML = `<i class="bi bi-cart-check"></i> ${title}`;
    m.querySelector('.modal-body').innerHTML = bodyHtml;
    m.querySelector('.modal-foot').innerHTML = footerHtml || '';
    document.body.style.overflow = 'hidden';
}

/* ----- تعليق واسترجاع السلات ----- */
function suspendCurrentCart() {
    if (!cart.length) return;
    const cust = getCustomer(cartCustomerId);
    openModalContent('تعليق الطلب مؤقتاً', `
        <div class="hold-callout"><i class="bi bi-pause-circle"></i><div><strong>لن تفقد محتويات السلة</strong><p>يمكن لكاشير آخر استرجاعها لاحقاً من زر الطلبات المعلّقة.</p></div></div>
        <div class="field"><label>اسم مختصر للطلب</label><input class="input" id="holdLabel" value="${cust?.name !== 'عميل نقدي' ? cust.name : ''}" placeholder="مثال: طاولة العائلة / أبو علي"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button><button class="btn btn-gold" style="flex:1" onclick="doSuspendCart()"><i class="bi bi-pause-circle"></i> تعليق وفتح سلة جديدة</button>`);
}
function doSuspendCart() {
    const u = currentUser();
    api.addSuspendedCart({
        label: document.getElementById('holdLabel').value.trim() || `طلب #${DB.orderCounter + 1}`,
        items: cart.map(i => ({ ...i })), customerId: cartCustomerId, orderType: cartOrderType,
        tableId: cartTableId, zoneId: cartZoneId, address: cartAddress,
        discount: window._cartDiscount || 0, userId: u?.id || '', userName: u?.name || '-'
    });
    cart = []; cartCustomerId = 'cu1'; cartOrderType = 'dine'; cartTableId = null; cartZoneId = null; cartAddress = ''; window._cartDiscount = 0;
    closeModal('dynModal'); renderCart(); toast('تم تعليق الطلب ويمكن استرجاعه لاحقاً', 'success');
}
function openSuspendedCarts() {
    const list = getSuspendedCarts();
    openModalContent(`الطلبات المعلّقة (${list.length})`, list.length ? `<div class="picker-list">${list.map(h => `
        <div class="held-order">
            <div class="held-icon"><i class="bi bi-pause-fill"></i></div>
            <div style="flex:1"><strong>${h.label}</strong><div>${(h.items || []).reduce((n,i)=>n+i.qty,0)} صنف • ${moneyNum((h.items || []).reduce((n,i)=>n+i.price*i.qty,0))}</div><small>${h.userName} • ${fmtDateTime(h.createdAt)}</small></div>
            <button class="btn btn-success btn-sm" onclick="restoreSuspendedCart('${h.id}')"><i class="bi bi-play-fill"></i> استرجاع</button>
            <button class="icon-btn" style="width:32px;height:32px;font-size:13px" onclick="deleteSuspendedCart('${h.id}')"><i class="bi bi-trash"></i></button>
        </div>`).join('')}</div>` : `<div class="empty-state"><i class="bi bi-inboxes"></i><p>لا توجد طلبات معلّقة</p></div>`);
}
function restoreSuspendedCart(id) {
    const h = getSuspendedCarts().find(x => x.id === id); if (!h) return;
    if (cart.length && !confirmAction('السلة الحالية تحتوي أصنافاً. استبدالها بالطلب المعلّق؟')) return;
    cart = (h.items || []).map(i => ({ ...i })); cartCustomerId = h.customerId || 'cu1'; cartOrderType = h.orderType || 'dine';
    cartTableId = h.tableId || null; cartZoneId = h.zoneId || null; cartAddress = h.address || ''; window._cartDiscount = Number(h.discount || 0);
    api.deleteSuspendedCart(id); closeModal('dynModal'); renderCart(); toast(`تم استرجاع «${h.label}»`, 'success');
}
function deleteSuspendedCart(id) {
    if (!confirmAction('حذف هذا الطلب المعلّق؟')) return;
    api.deleteSuspendedCart(id); openSuspendedCarts(); renderCart();
}

/* ----- الدفع ----- */
function openPayment() {
    const t = cartTotals();
    if (cartOrderType === 'delivery') {
        if (getSettings().requireDeliveryZone && !cartZoneId) { toast('حدد منطقة التوصيل أولاً ليتم احتساب الأجرة', 'error'); return; }
        if (t.zone?.active === false) { toast('منطقة التوصيل موقوفة حالياً', 'error'); return; }
        if (t.zone && t.subtotal < Number(t.zone.minimumOrder || 0)) { toast(`الحد الأدنى لمنطقة ${t.zone.name} هو ${moneyNum(t.zone.minimumOrder)}`, 'warning'); return; }
    }
    openModalContent('إتمام الدفع', `
        <div class="stats-grid" style="margin-bottom:8px">
            <div class="stat gold"><div class="stat-label">الإجمالي المطلوب</div><div class="stat-value" style="font-size:22px">${moneyNum(t.total)}</div></div>
            <div class="stat green"><div class="stat-label">عدد الأصناف</div><div class="stat-value">${t.items}</div></div>
            ${t.deliveryFee ? `<div class="stat blue"><div class="stat-label">منها أجرة توصيل</div><div class="stat-value" style="font-size:19px">${moneyNum(t.deliveryFee)}</div></div>` : ''}
            ${t.discount ? `<div class="stat purple"><div class="stat-label">إجمالي الخصم</div><div class="stat-value" style="font-size:19px">${moneyNum(t.discount)}</div></div>` : ''}
        </div>
        <div class="field">
            <label>طريقة الدفع</label>
            <div class="row-flex">
                ${[
                    'cash|كاش|bi-cash-coin', 'card|بطاقة|bi-credit-card', 'online|إلكتروني|bi-phone',
                    'split|دفع مختلط|bi-intersect',
                    ...(cartOrderType === 'delivery' && getSettings().enableCashOnDelivery ? ['cod|عند الاستلام|bi-truck'] : [])
                ].map(m => {
                    const [v, l, i] = m.split('|');
                    return `<button type="button" class="type-btn pay-method ${v === 'cash' ? 'active' : ''}" data-val="${v}" onclick="selectPay('${v}')" style="flex:1"><i class="bi ${i}"></i> ${l}</button>`;
                }).join('')}
            </div>
        </div>
        <div id="cashBlock" class="field">
            <label>المبلغ المدفوع</label>
            <div style="display:flex;gap:8px">
                <input class="input" id="paidAmount" type="number" value="${t.total}" oninput="calcChange()">
                <div style="flex:1;background:var(--cream);border-radius:11px;padding:10px 14px;border:1px solid var(--border)">
                    <div style="font-size:11px;color:var(--muted)">الباقي للعميل</div>
                    <div class="stat-value" id="changeAmount" style="font-size:18px;color:var(--success)">0</div>
                </div>
            </div>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
                ${[t.total, Math.ceil(t.total/1000)*1000, Math.ceil(t.total/5000)*5000, Math.ceil(t.total/10000)*10000, 25000, 50000].filter((v,i,a)=>a.indexOf(v)===i).slice(0,5).map(v => `<button class="pill" onclick="document.getElementById('paidAmount').value=${v};calcChange()">${moneyNum(v)}</button>`).join('')}
            </div>
        </div>
        <div id="splitBlock" class="field split-pay-box" style="display:none">
            <label>تقسيم المبلغ بين وسائل الدفع</label>
            <div class="row-flex"><div style="flex:1"><small>نقداً</small><input class="input" id="splitCash" type="number" value="0" oninput="calcSplitRemaining()"></div><div style="flex:1"><small>بطاقة / إلكتروني</small><input class="input" id="splitCard" type="number" value="${t.total}" oninput="calcSplitRemaining()"></div></div>
            <div class="split-remain" id="splitRemaining">المتبقي: 0</div>
        </div>
        ${cartOrderType === 'delivery' ? `<div class="delivery-payment-details">
            <div class="row-flex">
                <div class="field" style="flex:1"><label><i class="bi bi-person"></i> اسم المستلم</label><input class="input" id="deliveryName" value="${getCustomer(cartCustomerId)?.name === 'عميل نقدي' ? '' : getCustomer(cartCustomerId)?.name || ''}" placeholder="اسم المستلم"></div>
                <div class="field" style="flex:1"><label><i class="bi bi-telephone"></i> هاتف المستلم *</label><input class="input" id="deliveryPhone" value="${getCustomer(cartCustomerId)?.phone === '-' ? '' : getCustomer(cartCustomerId)?.phone || ''}" placeholder="07xx xxx xxxx" style="direction:ltr;text-align:right"></div>
            </div>
            <div class="field"><label><i class="bi bi-geo-alt"></i> العنوان التفصيلي *</label><textarea class="input" id="deliveryAddress" placeholder="محلة / زقاق / دار / أقرب نقطة دالة">${cartAddress || getCustomer(cartCustomerId)?.address || ''}</textarea></div>
            <div class="delivery-promise"><i class="bi bi-clock-history"></i> الوصول المتوقع لمنطقة <b>${t.zone?.name || '—'}</b>: حوالي <b>${t.zone?.minutes || 30} دقيقة</b></div>
        </div>` : ''}
        <div class="field">
            <label>ملاحظات على الطلب (اختياري)</label>
            <textarea class="input" id="orderNotes" placeholder="مثال: بدون بصل، حار..."></textarea>
        </div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-success btn-lg" onclick="completePayment()" style="flex:1"><i class="bi bi-check2-circle"></i> تأكيد الطلب والطباعة</button>`, 'lg');
    calcChange();
}
function selectPay(v) {
    document.querySelectorAll('.pay-method').forEach(b => b.classList.toggle('active', b.dataset.val === v));
    document.getElementById('cashBlock').style.display = v === 'cash' ? 'block' : 'none';
    const split = document.getElementById('splitBlock'); if (split) split.style.display = v === 'split' ? 'block' : 'none';
}
function calcSplitRemaining() {
    const t = cartTotals();
    const paid = Number(document.getElementById('splitCash')?.value || 0) + Number(document.getElementById('splitCard')?.value || 0);
    const rem = t.total - paid; const el = document.getElementById('splitRemaining');
    if (el) { el.textContent = rem > 0 ? `المتبقي: ${moneyNum(rem)}` : rem < 0 ? `زيادة: ${moneyNum(Math.abs(rem))}` : 'المبلغ موزع بالكامل ✓'; el.className = 'split-remain ' + (rem === 0 ? 'ok' : ''); }
}
function calcChange() {
    const t = cartTotals();
    const paid = Number(document.getElementById('paidAmount')?.value || 0);
    const change = Math.max(0, paid - t.total);
    document.getElementById('changeAmount').textContent = moneyNum(change);
}
function getSelectedPay() {
    const a = document.querySelector('.pay-method.active');
    return a ? a.dataset.val : 'cash';
}

/* ----- إتمام الطلب ----- */
function completePayment() {
    if (!cart.length) { toast('السلة فارغة', 'error'); return; }
    const t = cartTotals();
    const method = getSelectedPay();
    const paidEl = document.getElementById('paidAmount');
    let paid = t.total, payments = [];
    if (method === 'cash' && paidEl) {
        paid = Number(paidEl.value || 0);
        if (paid < t.total) { toast('المبلغ المدفوع أقل من الإجمالي', 'error'); return; }
        payments = [{ method: 'cash', amount: t.total }];
    } else if (method === 'split') {
        const cashPart = Math.max(0, Number(document.getElementById('splitCash')?.value || 0));
        const cardPart = Math.max(0, Number(document.getElementById('splitCard')?.value || 0));
        if (Math.abs(cashPart + cardPart - t.total) > 0.01) { toast('يجب أن يساوي مجموع الدفعتين إجمالي الطلب', 'error'); return; }
        paid = t.total; payments = [{ method: 'cash', amount: cashPart }, { method: 'card', amount: cardPart }].filter(x => x.amount > 0);
    } else if (method === 'cod') {
        paid = 0; payments = [{ method: 'cod', amount: t.total }];
    } else payments = [{ method, amount: t.total }];
    const notes = (document.getElementById('orderNotes')?.value || '').trim();
    cartAddress = (document.getElementById('deliveryAddress')?.value || '').trim();
    const cust = getCustomer(cartCustomerId);
    const deliveryName = (document.getElementById('deliveryName')?.value || cust.name || '').trim();
    const deliveryPhone = (document.getElementById('deliveryPhone')?.value || cust.phone || '').trim();
    if (cartOrderType === 'delivery') {
        if (!deliveryPhone || deliveryPhone === '-') { toast('أدخل رقم هاتف المستلم', 'error'); return; }
        if (getSettings().requireDeliveryAddress && !cartAddress) { toast('أدخل عنوان التوصيل التفصيلي', 'error'); return; }
        if (cartCustomerId !== 'cu1' && cust) { cust.phone = deliveryPhone; cust.address = cartAddress; cust.zoneId = cartZoneId; }
    }

    const order = {
        items: cart.map(i => ({ ...i })),
        subtotal: t.subtotal,
        tax: t.tax,
        service: t.service,
        discount: t.discount,
        total: t.total,
        paid,
        payments,
        change: method === 'cash' ? Math.max(0, paid - t.total) : 0,
        orderType: cartOrderType,
        orderTypeLabel: ORDER_TYPES[cartOrderType].label,
        deliveryFee: t.deliveryFee,
        tierDiscount: t.tierDiscount,
        zoneId: cartOrderType === 'delivery' ? cartZoneId : null,
        address: cartOrderType === 'delivery' ? cartAddress : '',
        tableId: cartOrderType === 'dine' ? cartTableId : null,
        tableName: cartOrderType === 'dine' && cartTableId ? (getTable(cartTableId)?.name || '') : '',
        customerId: cartCustomerId,
        customerName: cartOrderType === 'delivery' ? (deliveryName || cust.name) : cust.name,
        customerPhone: cartOrderType === 'delivery' ? deliveryPhone : cust.phone,
        paymentMethod: method,
        notes,
        status: 'preparing'
    };
    const saved = api.addOrder(order);

    // إنشاء سجل توصيل تلقائياً
    if (saved.orderType === 'delivery' && getSettings().enableDelivery) {
        api.addDelivery({
            orderId: saved.id, orderNumber: saved.number,
            customerName: saved.customerName, phone: saved.customerPhone,
            zoneId: saved.zoneId, address: saved.address || '',
            fee: saved.deliveryFee || 0, total: saved.total, paymentMethod: saved.paymentMethod,
            cashToCollect: saved.paymentMethod === 'cod' ? saved.total : 0,
            collectionStatus: saved.paymentMethod === 'cod' ? 'due' : 'prepaid',
            promisedAt: Date.now() + Number(getZone(saved.zoneId)?.minutes || 30) * 60000,
            status: 'pending'
        });
        toast('أُضيف الطلب إلى قائمة التوصيل 🚚', 'info', 2500);
    }

    // إعادة ضبط
    cart = [];
    cartCustomerId = 'cu1';
    cartTableId = null;
    cartZoneId = null;
    cartAddress = '';
    window._cartDiscount = 0;
    closeModal('dynModal');
    renderCart();
    renderProductGrid();
    updateOrderBadge();

    toast(`تم إنشاء الطلب #${saved.number} بنجاح 🎉`, 'success');
    // فتح إيصال POS
    showReceipt(saved.id);
}
