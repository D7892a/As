/* ============================================
   شاشة نقطة البيع (POS)
   ============================================ */

let cart = [];
let cartCustomerId = 'cu1';
let cartOrderType = 'dine';   // dine | take | delivery
let cartTableId = null;
let cartZoneId = null;
let cartAddress = '';
let cartExpress = false;
let cartFeeOverride = null;   // null = أجرة المنطقة
let cartTip = 0;
let cartCod = true;           // تحصيل عند الباب للتوصيل
let activeCat = 'all';
let posSearch = '';
let posFavOnly = false;

const ORDER_TYPES = {
    dine: { label: 'صالة', icon: 'bi-shop' },
    take: { label: 'سفري', icon: 'bi-bag' },
    delivery: { label: 'توصيل', icon: 'bi-truck' }
};

function renderPOS() {
    renderHeldBar();
    renderCategoryChips();
    renderProductGrid();
    renderCart();
}

/* ----- شرائح الأقسام ----- */
function renderCategoryChips() {
    const wrap = document.getElementById('posCats');
    if (!wrap) return;
    let html = `<div class="cat-chip ${activeCat === 'all' && !posFavOnly ? 'active' : ''}" onclick="setCat('all')"><i class="bi bi-grid-fill"></i> الكل</div>`;
    html += `<div class="cat-chip ${posFavOnly ? 'active' : ''}" onclick="toggleFavOnly()"><i class="bi bi-star-fill"></i> المفضلة</div>`;
    const liveOffers = getOffers().filter(isOfferLive).length;
    if (getSettings().enableOffers && liveOffers) {
        html += `<div class="cat-chip offer-chip ${activeCat === 'offers' ? 'active' : ''}" onclick="setCat('offers')"><span>🔥</span> العروض <span class="chip-count">${liveOffers}</span></div>`;
    }
    getCategories().forEach(c => {
        html += `<div class="cat-chip ${activeCat === c.id && !posFavOnly ? 'active' : ''}" onclick="setCat('${c.id}')"><span>${c.icon}</span> ${c.name}</div>`;
    });
    wrap.innerHTML = html;
}
function setCat(id) { activeCat = id; posFavOnly = false; renderCategoryChips(); renderProductGrid(); }
function toggleFavOnly() { posFavOnly = !posFavOnly; if (posFavOnly) activeCat = 'all'; renderCategoryChips(); renderProductGrid(); }
function onPosSearch(v) { posSearch = v.trim().toLowerCase(); renderProductGrid(); }

function getFavorites() {
    try { return JSON.parse(localStorage.getItem('iq_fav_products') || '[]'); } catch (e) { return []; }
}
function toggleFavorite(id, ev) {
    if (ev) ev.stopPropagation();
    const list = getFavorites();
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    localStorage.setItem('iq_fav_products', JSON.stringify(list));
    renderProductGrid();
}

/* ----- شبكة المنتجات ----- */
function renderProductGrid() {
    const grid = document.getElementById('posGrid');
    if (!grid) return;

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

    const favs = getFavorites();
    let list = getProducts();
    if (posFavOnly) list = list.filter(p => favs.includes(p.id));
    else if (activeCat !== 'all') list = list.filter(p => p.categoryId === activeCat);
    if (posSearch) list = list.filter(p => p.name.toLowerCase().includes(posSearch) || (p.sku || '').toLowerCase().includes(posSearch) || (getCategory(p.categoryId)?.name || '').toLowerCase().includes(posSearch));

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
        const isFav = favs.includes(p.id);
        return `
        <div class="product-card ${clickable ? '' : 'unavailable'}" onclick="${clickable ? `addToCart('${p.id}')` : ''}">
            <button class="fav-star ${isFav ? 'on' : ''}" onclick="toggleFavorite('${p.id}', event)" title="مفضلة"><i class="bi bi-star${isFav ? '-fill' : ''}"></i></button>
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
        name: `🔥 ${o.name}`, price: Number(o.price) || 0, qty: 1, note: ''
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
    else cart.push({ productId, name: p.name, price: p.price, qty: 1, note: '' });
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
    if (confirmAction('هل تريد إفراغ السلة؟')) { resetCartState(); renderCart(); }
}
function resetCartState() {
    cart = [];
    cartCustomerId = 'cu1';
    cartTableId = null;
    cartZoneId = null;
    cartAddress = '';
    cartExpress = false;
    cartFeeOverride = null;
    cartTip = 0;
    cartCod = true;
    window._cartDiscount = 0;
}

function setOrderType(t) {
    cartOrderType = t;
    if (t !== 'dine') cartTableId = null;
    if (t !== 'delivery') { cartExpress = false; cartFeeOverride = null; }
    renderCart();
    if (t === 'delivery' && getSettings().enableDelivery && !cartZoneId) {
        setTimeout(() => openZonePicker(), 80);
    }
}
function setCartZone(id) {
    cartZoneId = id || null;
    cartFeeOverride = null;
    const z = id ? getZone(id) : null;
    if (z && !cartAddress) cartAddress = z.name;
    renderCart();
}
function setCartCustomer(id) { cartCustomerId = id; renderCart(); }
function setCartTable(id) { cartTableId = id || null; renderCart(); }
function toggleCartExpress() { cartExpress = !cartExpress; renderCart(); }

function currentDeliveryFee() {
    if (cartOrderType !== 'delivery') return 0;
    if (cartFeeOverride !== null && cartFeeOverride !== undefined) return Number(cartFeeOverride) || 0;
    const zone = cartZoneId ? getZone(cartZoneId) : null;
    const base = zone ? Number(zone.fee || 0) : Number(getSettings().defaultDeliveryFee || 0);
    return base + (cartExpress ? Number(getSettings().expressFee || 0) : 0);
}

function cartTotals() {
    const s = getSettings();
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const tax = s.enableTax ? Math.round(subtotal * (s.taxRate / 100)) : 0;
    const service = Math.round(subtotal * ((s.serviceCharge || 0) / 100));
    const deliveryFee = currentDeliveryFee();
    let tierDiscount = 0, tierInfo = null;
    if (cartCustomerId && cartCustomerId !== 'cu1' && s.enablePoints) {
        tierInfo = customerTier(cartCustomerId);
        if (tierInfo.discount) tierDiscount = Math.round(subtotal * tierInfo.discount / 100);
    }
    const manual = window._cartDiscount || 0;
    const discount = manual + tierDiscount;
    const tip = Number(cartTip || 0);
    const total = Math.max(0, subtotal + tax + service + deliveryFee + tip - discount);
    return { subtotal, tax, service, deliveryFee, discount, manual, tierDiscount, tierInfo, tip, total, items: cart.reduce((n, i) => n + i.qty, 0) };
}

function renderCart() {
    const panel = document.getElementById('cartPanel');
    if (!panel) return;

    panel.querySelector('.cart-type-row').innerHTML = Object.entries(ORDER_TYPES).map(([k, v]) =>
        `<button class="type-btn ${cartOrderType === k ? 'active' : ''}" onclick="setOrderType('${k}')"><i class="bi ${v.icon}"></i> ${v.label}</button>`
    ).join('');

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
            const zone = cartZoneId ? getZone(cartZoneId) : null;
            const fee = currentDeliveryFee();
            tableRow.style.display = 'block';
            tableRow.innerHTML = `
                <div class="zone-pick-mini">
                    <div class="zpm-head">
                        <i class="bi bi-geo-alt-fill"></i>
                        <div style="flex:1">
                            <div class="zpm-label">منطقة التوصيل</div>
                            <div class="zpm-name">${zone ? zone.name : '<span style="color:var(--danger)">اختر المنطقة</span>'}</div>
                        </div>
                        <div class="zpm-fee">${fee ? moneyNum(fee) : '—'}</div>
                    </div>
                    <button class="btn btn-primary btn-sm btn-block" onclick="openZonePicker()"><i class="bi bi-geo"></i> ${zone ? 'تغيير المنطقة' : 'اختيار المنطقة والأجرة'}</button>
                    <div class="zpm-opts">
                        <label class="chk"><input type="checkbox" ${cartExpress ? 'checked' : ''} onchange="toggleCartExpress()"> توصيل سريع ${getSettings().expressFee ? `(+${moneyNum(getSettings().expressFee)})` : ''}</label>
                        ${getSettings().allowFeeOverride ? `<button class="btn btn-ghost btn-sm" onclick="overrideDeliveryFee()">تعديل الأجرة</button>` : ''}
                    </div>
                    ${cartAddress ? `<div class="zpm-addr"><i class="bi bi-signpost"></i> ${cartAddress}</div>` : ''}
                </div>`;
        } else { tableRow.style.display = 'none'; tableRow.innerHTML = ''; }
    }

    const itemsEl = panel.querySelector('.cart-items');
    if (!cart.length) {
        itemsEl.innerHTML = `<div class="cart-empty"><i class="bi bi-cart3"></i><p>السلة فارغة<br>اضغط على منتج لإضافته</p></div>`;
    } else {
        itemsEl.innerHTML = cart.map(i => `
            <div class="cart-line ${i.isOffer ? 'is-offer' : ''}">
                <div class="cl-info">
                    <div class="cl-name" onclick="editLineNote('${i.productId}')" title="ملاحظة على الصنف">${i.name}${i.note ? `<small class="cl-note"> • ${i.note}</small>` : ''}</div>
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

    const t = cartTotals();
    const s = getSettings();
    const zone = cartZoneId ? getZone(cartZoneId) : null;
    panel.querySelector('.cart-totals').innerHTML = `
        <div class="totals-row"><span>المجموع الفرعي (${t.items} صنف)</span><span>${moneyNum(t.subtotal)}</span></div>
        ${s.enableTax ? `<div class="totals-row"><span>الضريبة (${s.taxRate}%)</span><span>${moneyNum(t.tax)}</span></div>` : ''}
        ${s.serviceCharge ? `<div class="totals-row"><span>رسوم خدمة (${s.serviceCharge}%)</span><span>${moneyNum(t.service)}</span></div>` : ''}
        ${cartOrderType === 'delivery' ? `<div class="totals-row"><span><i class="bi bi-truck"></i> أجرة ${zone ? zone.name : 'التوصيل'}${cartExpress ? ' ⚡' : ''}</span><span>${moneyNum(t.deliveryFee)}</span></div>` : ''}
        ${t.tip ? `<div class="totals-row"><span>إكرامية</span><span>${moneyNum(t.tip)}</span></div>` : ''}
        ${t.tierDiscount ? `<div class="totals-row discount"><span>${t.tierInfo.icon} خصم عميل ${t.tierInfo.label} (${t.tierInfo.discount}%)</span><span>− ${moneyNum(t.tierDiscount)}</span></div>` : ''}
        ${t.manual ? `<div class="totals-row discount"><span>خصم يدوي</span><span>− ${moneyNum(t.manual)}</span></div>` : ''}
        <div class="totals-row grand"><span>الإجمالي</span><span>${moneyNum(t.total)}</span></div>`;

    const last = getOrders()[0];
    panel.querySelector('.cart-actions').innerHTML = `
        ${cart.length ? `<button class="btn btn-ghost btn-sm" onclick="clearCart()" title="إفراغ"><i class="bi bi-trash"></i></button>` : ''}
        ${cart.length && getSettings().enableHeldOrders !== false ? `<button class="btn btn-light btn-sm" onclick="holdCurrentOrder()" title="تعليق الطلب"><i class="bi bi-pause-circle"></i></button>` : ''}
        ${last ? `<button class="btn btn-light btn-sm" onclick="repeatLastOrder()" title="تكرار آخر طلب"><i class="bi bi-arrow-repeat"></i></button>` : ''}
        ${cart.length && can('pos.discount') ? `<button class="btn btn-dark" onclick="applyDiscount()" style="flex:1"><i class="bi bi-tag"></i> خصم</button>` : ''}
        <button class="btn btn-success btn-lg" style="flex:2" ${cart.length ? '' : 'disabled'} onclick="openPayment()"><i class="bi bi-cash-coin"></i> الدفع</button>`;

    panel.querySelector('.order-num').textContent = '#' + (DB.orderCounter + 1);
}

/* ----- منتقي المناطق البصري ----- */
function openZonePicker() {
    const zones = getActiveZones();
    if (!zones.length) { toast('أضف مناطق التوصيل من صفحة التوصيل أولاً', 'warning'); return; }
    const cust = getCustomer(cartCustomerId);
    const saved = (cust.addresses || []);
    openModalContent('اختر منطقة التوصيل', `
        ${saved.length ? `<div class="ss-title"><i class="bi bi-bookmark-star"></i> عناوين العميل المحفوظة</div>
            <div class="addr-chips">${saved.map(a => {
                const z = a.zoneId ? getZone(a.zoneId) : null;
                return `<button class="addr-chip" onclick="applySavedAddress('${a.id}')"><strong>${a.label}</strong><span>${z ? z.name + ' — ' + moneyNum(z.fee) : a.address}</span></button>`;
            }).join('')}</div>` : ''}
        <div class="ss-title"><i class="bi bi-geo-alt"></i> مناطق بغداد — اضغط المنطقة لتحديد الأجرة</div>
        <div class="zone-picker">
            ${zones.map(z => `
                <button class="zp-card ${cartZoneId === z.id ? 'active' : ''}" onclick="pickZone('${z.id}')" style="--zc:${z.color || '#c1272d'}">
                    <div class="zp-name">${z.name}</div>
                    <div class="zp-fee">${moneyNum(z.fee)}</div>
                    <div class="zp-eta"><i class="bi bi-clock"></i> ${z.minutes} دقيقة</div>
                </button>`).join('')}
        </div>
        <div class="field" style="margin-top:14px">
            <label>العنوان التفصيلي (محلة / زقاق / دار)</label>
            <textarea class="input" id="zpAddr" placeholder="مثال: الكرادة داخل — شارع أبو نؤاس، دار 14">${cartAddress}</textarea>
        </div>
        ${getSettings().allowFeeOverride ? `<div class="field"><label>تعديل أجرة التوصيل يدوياً (اختياري)</label>
            <input class="input" id="zpFee" type="number" placeholder="اتركه فارغاً لاستخدام سعر المنطقة" value="${cartFeeOverride !== null ? cartFeeOverride : ''}">
            <p style="font-size:12px;color:var(--muted);margin-top:6px">سعر المنطقة يُطبَّق تلقائياً. غيّره فقط إذا اتفق الكاشير على مبلغ مختلف.</p></div>` : ''}
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" style="flex:1" onclick="confirmZonePick()"><i class="bi bi-check2"></i> اعتماد المنطقة</button>`, 'lg');
}
function pickZone(id) {
    cartZoneId = id;
    cartFeeOverride = null;
    const z = getZone(id);
    const addr = document.getElementById('zpAddr');
    if (z && addr && !addr.value.trim()) addr.value = z.name;
    document.querySelectorAll('.zp-card').forEach(el => el.classList.toggle('active', el.getAttribute('onclick') === `pickZone('${id}')`));
}
function applySavedAddress(addrId) {
    const cust = getCustomer(cartCustomerId);
    const a = (cust.addresses || []).find(x => x.id === addrId);
    if (!a) return;
    cartZoneId = a.zoneId || cartZoneId;
    cartAddress = a.address || '';
    cartFeeOverride = null;
    closeModal('dynModal');
    renderCart();
    toast(`تم اختيار عنوان «${a.label}» — ${getZone(cartZoneId)?.name || ''}`, 'success');
}
function confirmZonePick() {
    const addr = document.getElementById('zpAddr')?.value.trim() || '';
    const feeEl = document.getElementById('zpFee');
    if (getSettings().requireDeliveryZone && !cartZoneId) { toast('اختر المنطقة أولاً', 'error'); return; }
    cartAddress = addr;
    if (feeEl && feeEl.value !== '') cartFeeOverride = Number(feeEl.value) || 0;
    closeModal('dynModal');
    renderCart();
    const z = getZone(cartZoneId);
    toast(z ? `التوصيل إلى ${z.name} — الأجرة ${moneyNum(currentDeliveryFee())}` : 'تم حفظ بيانات التوصيل', 'success');
}
function overrideDeliveryFee() {
    if (!can('pos.price') && !can('pos.discount') && !can('delivery')) {
        /* الكاشير يحتاج يقدر يعدّل الأجرة حسب طلب المدير */
    }
    const cur = currentDeliveryFee();
    const v = prompt('أجرة التوصيل الجديدة (د.ع):', cur);
    if (v === null) return;
    cartFeeOverride = Math.max(0, Number(v) || 0);
    renderCart();
    toast(`أُعدّلت أجرة التوصيل إلى ${moneyNum(cartFeeOverride)}`, 'info');
}

/* ----- ملاحظة على صنف ----- */
function editLineNote(productId) {
    const line = cart.find(i => i.productId === productId);
    if (!line) return;
    const v = prompt(`ملاحظة على «${line.name}» (بدون بصل، حار...):`, line.note || '');
    if (v === null) return;
    line.note = v.trim();
    renderCart();
}

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

/* ----- تعليق / استرجاع الطلب ----- */
function holdCurrentOrder() {
    if (!cart.length) return;
    const cust = getCustomer(cartCustomerId);
    api.holdOrder({
        items: cart.map(i => ({ ...i })),
        customerId: cartCustomerId,
        customerName: cust.name,
        orderType: cartOrderType,
        zoneId: cartZoneId,
        address: cartAddress,
        tableId: cartTableId,
        discount: window._cartDiscount || 0,
        express: cartExpress,
        feeOverride: cartFeeOverride,
        tip: cartTip
    });
    resetCartState();
    renderPOS();
    toast('تم تعليق الطلب — يمكنك استرجاعه لاحقاً', 'success');
}
function restoreHeldOrder(id) {
    const h = getHeldOrders().find(x => x.id === id);
    if (!h) return;
    if (cart.length && !confirmAction('السلة الحالية ستُستبدل بالطلب المعلّق. متابعة؟')) return;
    cart = (h.items || []).map(i => ({ ...i }));
    cartCustomerId = h.customerId || 'cu1';
    cartOrderType = h.orderType || 'dine';
    cartZoneId = h.zoneId || null;
    cartAddress = h.address || '';
    cartTableId = h.tableId || null;
    cartExpress = !!h.express;
    cartFeeOverride = h.feeOverride ?? null;
    cartTip = Number(h.tip || 0);
    window._cartDiscount = Number(h.discount || 0);
    api.deleteHeldOrder(id);
    renderPOS();
    toast('تم استرجاع الطلب المعلّق', 'success');
}
function dropHeldOrder(id) {
    if (!confirmAction('حذف هذا الطلب المعلّق؟')) return;
    api.deleteHeldOrder(id);
    renderHeldBar();
}
function renderHeldBar() {
    let bar = document.getElementById('heldBar');
    const left = document.querySelector('.pos-left');
    if (!left) return;
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'heldBar';
        left.insertBefore(bar, left.firstChild);
    }
    const list = getHeldOrders();
    if (!list.length) { bar.innerHTML = ''; bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    bar.className = 'held-bar';
    bar.innerHTML = `<span class="held-label"><i class="bi bi-pause-circle"></i> معلّقة</span>` +
        list.map(h => `<button class="held-chip" onclick="restoreHeldOrder('${h.id}')">
            ${h.customerName || 'طلب'} • ${(h.items || []).reduce((n, i) => n + i.qty, 0)} صنف
            <i class="bi bi-x" onclick="event.stopPropagation();dropHeldOrder('${h.id}')"></i>
        </button>`).join('');
}

function repeatLastOrder() {
    const last = getOrders().find(o => o.status !== 'cancelled');
    if (!last) { toast('لا يوجد طلب سابق', 'warning'); return; }
    if (cart.length && !confirmAction('ستُستبدل السلة بآخر طلب. متابعة؟')) return;
    cart = (last.items || []).map(i => ({ ...i }));
    cartCustomerId = last.customerId || 'cu1';
    cartOrderType = last.orderType || 'dine';
    cartZoneId = last.zoneId || null;
    cartAddress = last.address || '';
    cartTableId = null;
    cartExpress = !!last.express;
    cartFeeOverride = last.deliveryFee != null && last.zoneId ? null : (last.deliveryFee ?? null);
    window._cartDiscount = Number(last.discount || 0) - Number(last.tierDiscount || 0);
    renderCart();
    toast(`تم تحميل الطلب #${last.number}`, 'success');
}

/* ----- منتقي العميل ----- */
function openCustomerPicker() {
    const list = getCustomers().map(c => `
        <div class="cart-line" style="cursor:pointer" onclick="pickCustomer('${c.id}')">
            <div class="cell-thumb" style="background:var(--cream-2)">${c.name.charAt(0)}</div>
            <div class="cl-info">
                <div class="cl-name">${c.name}</div>
                <div class="cl-price">${c.phone} ${getSettings().enablePoints ? `• ${c.points} نقطة` : ''}${(c.addresses || []).length ? ` • ${(c.addresses || []).length} عنوان` : ''}</div>
            </div>
            <i class="bi bi-chevron-left" style="color:var(--muted)"></i>
        </div>`).join('');
    openModalContent('اختيار العميل', `
        <div style="margin-bottom:12px;display:flex;gap:8px">
            <input class="input" id="quickCustName" placeholder="اسم عميل جديد (اختياري)">
            <input class="input" id="quickCustPhone" placeholder="الهاتف">
            <button class="btn btn-primary" onclick="quickAddCustomer()"><i class="bi bi-plus-lg"></i></button>
        </div>
        <div class="search-box" style="max-width:none;margin-bottom:10px"><i class="bi bi-search"></i>
            <input class="input" placeholder="بحث بالاسم أو الهاتف..." oninput="filterCustPicker(this.value)">
        </div>
        <div style="max-height:340px;overflow-y:auto" id="custPickerList">${list}</div>
    `);
}
function filterCustPicker(q) {
    q = (q || '').trim().toLowerCase();
    const box = document.getElementById('custPickerList');
    if (!box) return;
    const list = getCustomers().filter(c => !q || c.name.toLowerCase().includes(q) || (c.phone || '').includes(q));
    box.innerHTML = list.map(c => `
        <div class="cart-line" style="cursor:pointer" onclick="pickCustomer('${c.id}')">
            <div class="cell-thumb" style="background:var(--cream-2)">${c.name.charAt(0)}</div>
            <div class="cl-info"><div class="cl-name">${c.name}</div><div class="cl-price">${c.phone}</div></div>
        </div>`).join('') || `<div class="empty-state"><p>لا نتائج</p></div>`;
}
function quickAddCustomer() {
    const name = document.getElementById('quickCustName').value.trim();
    if (!name) { toast('أدخل اسم العميل', 'error'); return; }
    const phone = document.getElementById('quickCustPhone').value.trim() || '-';
    const c = api.addCustomer({ name, phone, addresses: [] });
    pickCustomer(c.id);
    toast('تمت إضافة العميل', 'success');
}
function pickCustomer(id) {
    cartCustomerId = id;
    const c = getCustomer(id);
    if (cartOrderType === 'delivery' && (c.addresses || []).length === 1) {
        const a = c.addresses[0];
        cartZoneId = a.zoneId || cartZoneId;
        cartAddress = a.address || cartAddress;
    }
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
    if (cartOrderType === 'delivery' && getSettings().requireDeliveryZone && !cartZoneId) {
        toast('اختر منطقة التوصيل أولاً', 'warning');
        openZonePicker();
        return;
    }
    const t = cartTotals();
    const zone = cartZoneId ? getZone(cartZoneId) : null;
    openModalContent('إتمام الدفع', `
        <div class="stats-grid" style="margin-bottom:8px">
            <div class="stat gold"><div class="stat-label">الإجمالي المطلوب</div><div class="stat-value" style="font-size:22px">${moneyNum(t.total)}</div></div>
            <div class="stat green"><div class="stat-label">عدد الأصناف</div><div class="stat-value">${t.items}</div></div>
            ${t.deliveryFee ? `<div class="stat blue"><div class="stat-label">أجرة ${zone ? zone.name : 'التوصيل'}</div><div class="stat-value" style="font-size:19px">${moneyNum(t.deliveryFee)}</div></div>` : ''}
            ${t.discount ? `<div class="stat purple"><div class="stat-label">إجمالي الخصم</div><div class="stat-value" style="font-size:19px">${moneyNum(t.discount)}</div></div>` : ''}
        </div>
        ${cartOrderType === 'delivery' ? `<div class="dl-pay-banner">
            <i class="bi bi-truck"></i>
            <div><strong>توصيل إلى ${zone ? zone.name : '—'}</strong>
            <div style="font-size:12.5px;color:var(--muted)">${cartAddress || 'بدون عنوان تفصيلي'} • أجرة ${moneyNum(t.deliveryFee)}${cartExpress ? ' • سريع ⚡' : ''}</div></div>
        </div>` : ''}
        <div class="field">
            <label>طريقة الدفع</label>
            <div class="row-flex">
                ${['cash|كاش|bi-cash-coin', 'card|بطاقة|bi-credit-card', 'online|إلكتروني|bi-phone', ...(getSettings().enableSplitPay !== false ? ['split|مقسّم|bi-layers'] : [])].map(m => {
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
        <div id="splitBlock" class="field" style="display:none">
            <div class="row-flex">
                <div class="field" style="flex:1;margin:0"><label>كاش</label><input class="input" id="splitCash" type="number" value="${Math.ceil(t.total/2)}" oninput="syncSplit()"></div>
                <div class="field" style="flex:1;margin:0"><label>بطاقة / إلكتروني</label><input class="input" id="splitCard" type="number" value="${t.total - Math.ceil(t.total/2)}" oninput="syncSplit()"></div>
            </div>
            <p id="splitHint" style="font-size:12.5px;margin-top:8px;font-weight:700"></p>
        </div>
        ${getSettings().enableTips !== false ? `<div class="field"><label>إكرامية (اختياري)</label>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
                ${[0, 1000, 2000, 5000].map(v => `<button class="pill ${cartTip === v ? 'active' : ''}" onclick="setCartTip(${v})">${v ? moneyNum(v) : 'بدون'}</button>`).join('')}
            </div>
            <input class="input" id="tipAmount" type="number" value="${cartTip || 0}" oninput="setCartTip(this.value)">
        </div>` : ''}
        ${cartOrderType === 'delivery' ? `<div class="field">
            <label><i class="bi bi-geo-alt"></i> عنوان التوصيل</label>
            <textarea class="input" id="deliveryAddress" placeholder="محلة / زقاق / دار / أقرب نقطة دالة">${cartAddress}</textarea>
            ${getSettings().enableCod !== false ? `<label class="chk" style="margin-top:8px"><input type="checkbox" id="payCod" ${cartCod ? 'checked' : ''}> تحصيل المبلغ عند الباب (كاش مع السائق)</label>` : ''}
        </div>` : ''}
        <div class="field">
            <label>ملاحظات على الطلب (اختياري)</label>
            <textarea class="input" id="orderNotes" placeholder="مثال: بدون بصل، حار..."></textarea>
        </div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-success btn-lg" onclick="completePayment()" style="flex:1"><i class="bi bi-check2-circle"></i> تأكيد الطلب والطباعة</button>`, 'lg');
    calcChange();
}
function setCartTip(v) {
    cartTip = Math.max(0, Number(v) || 0);
    const el = document.getElementById('tipAmount');
    if (el && document.activeElement !== el) el.value = cartTip;
    const paid = document.getElementById('paidAmount');
    if (paid) paid.value = cartTotals().total;
    calcChange();
}
function selectPay(v) {
    document.querySelectorAll('.pay-method').forEach(b => b.classList.toggle('active', b.dataset.val === v));
    const cash = document.getElementById('cashBlock');
    const split = document.getElementById('splitBlock');
    if (cash) cash.style.display = v === 'cash' ? 'block' : 'none';
    if (split) split.style.display = v === 'split' ? 'block' : 'none';
    if (v === 'split') syncSplit();
}
function syncSplit() {
    const t = cartTotals();
    const cash = Number(document.getElementById('splitCash')?.value || 0);
    const card = Number(document.getElementById('splitCard')?.value || 0);
    const hint = document.getElementById('splitHint');
    if (!hint) return;
    const sum = cash + card;
    const diff = sum - t.total;
    hint.style.color = diff === 0 ? 'var(--success)' : 'var(--danger)';
    hint.textContent = diff === 0 ? 'المبلغ مطابق للإجمالي ✓' : `المجموع ${moneyNum(sum)} — الفرق ${moneyNum(diff)}`;
}
function calcChange() {
    const t = cartTotals();
    const paid = Number(document.getElementById('paidAmount')?.value || 0);
    const change = Math.max(0, paid - t.total);
    const el = document.getElementById('changeAmount');
    if (el) el.textContent = moneyNum(change);
}
function getSelectedPay() {
    const a = document.querySelector('.pay-method.active');
    return a ? a.dataset.val : 'cash';
}

/* ----- إتمام الطلب ----- */
function completePayment() {
    if (!cart.length) { toast('السلة فارغة', 'error'); return; }
    if (cartOrderType === 'delivery' && getSettings().requireDeliveryZone && !cartZoneId) {
        toast('يجب اختيار منطقة التوصيل', 'error'); return;
    }
    const t = cartTotals();
    const method = getSelectedPay();
    const paidEl = document.getElementById('paidAmount');
    let paid = t.total;
    let splitCash = 0, splitCard = 0;
    if (method === 'cash' && paidEl) {
        paid = Number(paidEl.value || 0);
        if (paid < t.total) { toast('المبلغ المدفوع أقل من الإجمالي', 'error'); return; }
    }
    if (method === 'split') {
        splitCash = Number(document.getElementById('splitCash')?.value || 0);
        splitCard = Number(document.getElementById('splitCard')?.value || 0);
        if (splitCash + splitCard < t.total) { toast('مجموع التقسيم أقل من الإجمالي', 'error'); return; }
        paid = splitCash + splitCard;
    }
    const notes = (document.getElementById('orderNotes')?.value || '').trim();
    cartAddress = (document.getElementById('deliveryAddress')?.value || cartAddress || '').trim();
    cartCod = document.getElementById('payCod') ? document.getElementById('payCod').checked : cartCod;
    const cust = getCustomer(cartCustomerId);
    const zone = cartZoneId ? getZone(cartZoneId) : null;

    const order = {
        items: cart.map(i => ({ ...i })),
        subtotal: t.subtotal,
        tax: t.tax,
        service: t.service,
        discount: t.discount,
        tip: t.tip,
        total: t.total,
        paid,
        change: Math.max(0, paid - t.total),
        orderType: cartOrderType,
        orderTypeLabel: ORDER_TYPES[cartOrderType].label,
        deliveryFee: t.deliveryFee,
        tierDiscount: t.tierDiscount,
        zoneId: cartOrderType === 'delivery' ? cartZoneId : null,
        zoneName: zone ? zone.name : '',
        address: cartOrderType === 'delivery' ? cartAddress : '',
        express: cartExpress,
        tableId: cartOrderType === 'dine' ? cartTableId : null,
        tableName: cartOrderType === 'dine' && cartTableId ? (getTable(cartTableId)?.name || '') : '',
        customerId: cartCustomerId,
        customerName: cust.name,
        customerPhone: cust.phone,
        paymentMethod: method === 'split' ? 'split' : method,
        splitCash, splitCard,
        notes,
        status: 'preparing'
    };
    const saved = api.addOrder(order);

    if (saved.orderType === 'delivery' && getSettings().enableDelivery) {
        api.addDelivery({
            orderId: saved.id, orderNumber: saved.number,
            customerName: saved.customerName, phone: saved.customerPhone,
            zoneId: saved.zoneId, address: saved.address || '',
            fee: saved.deliveryFee || 0, total: saved.total,
            collect: cartCod ? saved.total : 0,
            express: !!saved.express,
            status: 'pending'
        });
        if (cartCustomerId !== 'cu1' && cartAddress) {
            const c = getCustomer(cartCustomerId);
            const exists = (c.addresses || []).some(a => a.address === cartAddress);
            if (!exists) api.addCustomerAddress(cartCustomerId, { label: zone ? zone.name : 'عنوان', zoneId: cartZoneId, address: cartAddress });
        }
        toast(`أُضيف إلى التوصيل 🚚 — ${zone ? zone.name : 'بدون منطقة'}`, 'info', 2500);
    }

    resetCartState();
    closeModal('dynModal');
    renderCart();
    renderProductGrid();
    renderHeldBar();
    updateOrderBadge();

    toast(`تم إنشاء الطلب #${saved.number} بنجاح 🎉`, 'success');
    showReceipt(saved.id);
}
