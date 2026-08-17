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

function setOrderType(t) { cartOrderType = t; if (t !== 'dine') cartTableId = null; renderCart(); }
function setCartZone(id) {
    cartZoneId = id || null;
    renderCart();
}
function setCartCustomer(id) { cartCustomerId = id; renderCart(); }
function setCartTable(id) { cartTableId = id || null; renderCart(); }

function cartTotals() {
    const s = getSettings();
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const tax = s.enableTax ? Math.round(subtotal * (s.taxRate / 100)) : 0;
    const service = Math.round(subtotal * ((s.serviceCharge || 0) / 100));
    // أجرة التوصيل حسب المنطقة
    const zone = (cartOrderType === 'delivery' && cartZoneId) ? getZone(cartZoneId) : null;
    const deliveryFee = zone ? Number(zone.fee || 0) : 0;
    // خصم مستوى الولاء تلقائياً
    let tierDiscount = 0, tierInfo = null;
    if (cartCustomerId && cartCustomerId !== 'cu1' && s.enablePoints) {
        tierInfo = customerTier(cartCustomerId);
        if (tierInfo.discount) tierDiscount = Math.round(subtotal * tierInfo.discount / 100);
    }
    const manual = window._cartDiscount || 0;
    const discount = manual + tierDiscount;
    const total = Math.max(0, subtotal + tax + service + deliveryFee - discount);
    return { subtotal, tax, service, deliveryFee, discount, manual, tierDiscount, tierInfo, total, items: cart.reduce((n, i) => n + i.qty, 0) };
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
                        <option value="">بدون أجرة توصيل</option>
                        ${getZones().map(z => `<option value="${z.id}" ${cartZoneId === z.id ? 'selected' : ''}>${z.name} — ${moneyNum(z.fee)}</option>`).join('')}
                    </select>
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
        ${t.deliveryFee ? `<div class="totals-row"><span><i class="bi bi-truck"></i> أجرة التوصيل</span><span>${moneyNum(t.deliveryFee)}</span></div>` : ''}
        ${t.tierDiscount ? `<div class="totals-row discount"><span>${t.tierInfo.icon} خصم عميل ${t.tierInfo.label} (${t.tierInfo.discount}%)</span><span>− ${moneyNum(t.tierDiscount)}</span></div>` : ''}
        ${t.manual ? `<div class="totals-row discount"><span>خصم يدوي</span><span>− ${moneyNum(t.manual)}</span></div>` : ''}
        <div class="totals-row grand"><span>الإجمالي</span><span>${moneyNum(t.total)}</span></div>`;

    // الأزرار
    panel.querySelector('.cart-actions').innerHTML = `
        ${cart.length ? `<button class="btn btn-ghost btn-sm" onclick="clearCart()"><i class="bi bi-trash"></i></button>` : ''}
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

/* ----- الدفع ----- */
function openPayment() {
    const t = cartTotals();
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
                ${['cash|كاش|bi-cash-coin', 'card|بطاقة|bi-credit-card', 'online|إلكتروني|bi-phone'].map(m => {
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
        ${cartOrderType === 'delivery' ? `<div class="field">
            <label><i class="bi bi-geo-alt"></i> عنوان التوصيل</label>
            <textarea class="input" id="deliveryAddress" placeholder="محلة / زقاق / دار / أقرب نقطة دالة">${cartAddress}</textarea>
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
    let paid = t.total;
    if (method === 'cash' && paidEl) {
        paid = Number(paidEl.value || 0);
        if (paid < t.total) { toast('المبلغ المدفوع أقل من الإجمالي', 'error'); return; }
    }
    const notes = (document.getElementById('orderNotes')?.value || '').trim();
    cartAddress = (document.getElementById('deliveryAddress')?.value || '').trim();
    const cust = getCustomer(cartCustomerId);

    const order = {
        items: cart.map(i => ({ ...i })),
        subtotal: t.subtotal,
        tax: t.tax,
        service: t.service,
        discount: t.discount,
        total: t.total,
        paid,
        change: Math.max(0, paid - t.total),
        orderType: cartOrderType,
        orderTypeLabel: ORDER_TYPES[cartOrderType].label,
        deliveryFee: t.deliveryFee,
        tierDiscount: t.tierDiscount,
        zoneId: cartOrderType === 'delivery' ? cartZoneId : null,
        address: cartOrderType === 'delivery' ? cartAddress : '',
        tableId: cartOrderType === 'dine' ? cartTableId : null,
        tableName: cartOrderType === 'dine' && cartTableId ? (getTable(cartTableId)?.name || '') : '',
        customerId: cartCustomerId,
        customerName: cust.name,
        customerPhone: cust.phone,
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
            fee: saved.deliveryFee || 0, total: saved.total, status: 'pending'
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
