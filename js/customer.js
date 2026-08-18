/* ============================================
   منيو الزبون — طلب من الهاتف بدون تسجيل دخول
   يُفتح عبر: index.html?view=menu
   ============================================ */

const MENU_LAST_KEY = 'iq_menu_last_order';

let _mCart = [];
let _mCat = 'all';
let _mType = 'take'; // take | delivery
let _mZoneId = null;
let _mSearch = '';
let _mScreen = 'menu'; // menu | checkout | track | feedback
let _mDraft = { name: '', phone: '', address: '', notes: '' };

function captureMenuDraft() {
    const name = document.getElementById('cmName');
    const phone = document.getElementById('cmPhone');
    const addr = document.getElementById('cmAddr');
    const notes = document.getElementById('cmNotes');
    if (name) _mDraft.name = name.value;
    if (phone) _mDraft.phone = phone.value;
    if (addr) _mDraft.address = addr.value;
    if (notes) _mDraft.notes = notes.value;
}

function bootCustomerMenu() {
    window._portal = 'menu';
    document.body.classList.add('portal-mode', 'menu-mode');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'none';
    const el = document.getElementById('portalMenu');
    el.style.display = 'flex';
    document.title = (getSettings().restaurantName || 'المنيو') + ' — منيو الزبون';
    renderCustomerMenu();
    window.addEventListener('storage', onPortalStorage);
}

function renderCustomerMenu() {
    const el = document.getElementById('portalMenu');
    if (!el) return;
    if (_mScreen === 'checkout') return renderMenuCheckout(el);
    if (_mScreen === 'track') return renderMenuTrack(el);
    if (_mScreen === 'feedback') return renderMenuFeedback(el);
    renderMenuBrowse(el);
}

function menuTotals() {
    const s = getSettings();
    const subtotal = _mCart.reduce((n, i) => n + i.price * i.qty, 0);
    const tax = s.enableTax ? Math.round(subtotal * (s.taxRate / 100)) : 0;
    const zone = _mZoneId ? getZone(_mZoneId) : null;
    const fee = _mType === 'delivery' ? (zone ? Number(zone.fee || 0) : Number(s.defaultDeliveryFee || 0)) : 0;
    const total = Math.max(0, subtotal + tax + fee);
    const items = _mCart.reduce((n, i) => n + i.qty, 0);
    return { subtotal, tax, fee, total, items, zone };
}

function renderMenuBrowse(el) {
    const s = getSettings();
    const cats = getCategories();
    const t = menuTotals();
    const offers = getOffers().filter(isOfferLive);
    let list = getProducts().filter(p => p.available !== false);
    if (_mCat === 'offers') list = [];
    else if (_mCat !== 'all') list = list.filter(p => p.categoryId === _mCat);
    if (_mSearch) {
        const q = _mSearch.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }
    const phone = (s.phone || '').replace(/\s+/g, '');

    el.innerHTML = `
        <header class="cm-hero">
            <div class="cm-hero-bg"></div>
            <div class="cm-hero-in">
                <div class="cm-logo">${s.restaurantLogo ? `<img src="${s.restaurantLogo}" alt="">` : '🍽️'}</div>
                <div>
                    <h1>${s.restaurantName}</h1>
                    <p>${s.slogan || 'أصالة المطبخ العراقي'}</p>
                    <div class="cm-meta">
                        ${s.phone ? `<span><i class="bi bi-telephone"></i> ${s.phone}</span>` : ''}
                        ${s.address ? `<span><i class="bi bi-geo-alt"></i> ${s.address}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="cm-hero-actions">
                ${phone ? `<a class="cm-icon" href="tel:${phone}" title="اتصال"><i class="bi bi-telephone-fill"></i></a>` : ''}
                ${phone ? `<a class="cm-icon" href="https://wa.me/${phone.replace(/^0/, '964')}" target="_blank" rel="noopener" title="واتساب"><i class="bi bi-whatsapp"></i></a>` : ''}
                <button class="cm-icon" onclick="_mScreen='track';renderCustomerMenu()" title="طلبك"><i class="bi bi-receipt"></i></button>
                <button class="cm-icon" onclick="_mScreen='feedback';renderCustomerMenu()" title="تقييم"><i class="bi bi-star"></i></button>
            </div>
        </header>

        <div class="cm-search">
            <i class="bi bi-search"></i>
            <input placeholder="ابحث في المنيو..." value="${escAttr(_mSearch)}" oninput="_mSearch=this.value;renderCustomerMenu()">
        </div>

        <div class="cm-cats">
            <button class="cm-cat ${_mCat === 'all' ? 'on' : ''}" onclick="_mCat='all';renderCustomerMenu()">الكل</button>
            ${offers.length ? `<button class="cm-cat offer ${_mCat === 'offers' ? 'on' : ''}" onclick="_mCat='offers';renderCustomerMenu()">🔥 العروض</button>` : ''}
            ${cats.map(c => `<button class="cm-cat ${_mCat === c.id ? 'on' : ''}" onclick="_mCat='${c.id}';renderCustomerMenu()">${c.icon || ''} ${c.name}</button>`).join('')}
        </div>

        <main class="cm-list">
            ${_mCat === 'offers' ? (offers.length ? offers.map(menuOfferCard).join('') : `<div class="cm-empty"><i class="bi bi-stars"></i><p>لا عروض سارية الآن</p></div>`)
              : (list.length ? list.map(menuProductCard).join('') : `<div class="cm-empty"><i class="bi bi-search"></i><p>لا توجد أصناف مطابقة</p></div>`)}
        </main>

        ${t.items ? `
        <button class="cm-cartbar" onclick="_mScreen='checkout';renderCustomerMenu()">
            <span class="cm-cart-count">${t.items}</span>
            <span>عرض السلة وإتمام الطلب</span>
            <strong>${moneyNum(t.subtotal)} ${s.currency}</strong>
        </button>` : ''}
    `;
}

function menuProductCard(p) {
    const line = _mCart.find(i => i.productId === p.id);
    const visual = p.image ? `<img src="${p.image}" alt="">` : (p.emoji || '🍽️');
    return `<article class="cm-item">
        <div class="cm-thumb">${visual}</div>
        <div class="cm-info">
            <h3>${p.name}</h3>
            ${p.description ? `<p>${p.description}</p>` : ''}
            <div class="cm-price">${moneyNum(p.price)} <small>${getSettings().currency}</small></div>
        </div>
        ${line ? `<div class="cm-step">
            <button onclick="menuQty('${p.id}',-1)">−</button>
            <b>${line.qty}</b>
            <button onclick="menuQty('${p.id}',1)">+</button>
        </div>` : `<button class="cm-add" onclick="menuAdd('${p.id}')"><i class="bi bi-plus-lg"></i></button>`}
    </article>`;
}

function menuOfferCard(o) {
    const line = _mCart.find(i => i.productId === o.id);
    const visual = o.image ? `<img src="${o.image}" alt="">` : (o.emoji || '🎁');
    const saving = offerSaving(o);
    return `<article class="cm-item offer">
        <div class="cm-thumb offer">${visual}</div>
        <div class="cm-info">
            <h3>${o.name}</h3>
            <p>${o.description || ''}${saving ? ` • وفّر ${moneyNum(saving)}` : ''}</p>
            <div class="cm-price">${moneyNum(o.price)} <small>${getSettings().currency}</small></div>
        </div>
        ${line ? `<div class="cm-step">
            <button onclick="menuQty('${o.id}',-1)">−</button>
            <b>${line.qty}</b>
            <button onclick="menuQty('${o.id}',1)">+</button>
        </div>` : `<button class="cm-add" onclick="menuAddOffer('${o.id}')"><i class="bi bi-plus-lg"></i></button>`}
    </article>`;
}

function menuAdd(id) {
    const p = getProduct(id); if (!p) return;
    const line = _mCart.find(i => i.productId === id);
    if (line) line.qty += 1;
    else _mCart.push({ productId: id, name: p.name, price: Number(p.price) || 0, qty: 1, note: '' });
    renderCustomerMenu();
}
function menuAddOffer(id) {
    const o = getOffer(id); if (!o) return;
    const line = _mCart.find(i => i.productId === id);
    if (line) line.qty += 1;
    else _mCart.push({ productId: id, offerId: id, isOffer: true, name: `🔥 ${o.name}`, price: Number(o.price) || 0, qty: 1, note: '' });
    renderCustomerMenu();
}
function menuQty(id, d) {
    const line = _mCart.find(i => i.productId === id);
    if (!line) return;
    line.qty += d;
    if (line.qty <= 0) _mCart = _mCart.filter(i => i.productId !== id);
    renderCustomerMenu();
}

function renderMenuCheckout(el) {
    const s = getSettings();
    const t = menuTotals();
    const last = loadLastMenuOrder();
    const nameVal = _mDraft.name || last.name || '';
    const phoneVal = _mDraft.phone || last.phone || '';
    const addrVal = _mDraft.address || last.address || '';
    const notesVal = _mDraft.notes || '';
    const zones = getActiveZones();
    const canOrder = s.enableOnlineOrders !== false;

    el.innerHTML = `
        <header class="cm-bar">
            <button class="cm-back" onclick="_mScreen='menu';renderCustomerMenu()"><i class="bi bi-arrow-right"></i></button>
            <h2>إتمام الطلب</h2>
            <span></span>
        </header>
        <main class="cm-check">
            <div class="cm-box">
                ${_mCart.map(i => `<div class="cm-line">
                    <span>${i.name} × ${i.qty}</span>
                    <strong>${moneyNum(i.price * i.qty)}</strong>
                </div>`).join('') || '<p class="cm-muted">السلة فارغة</p>'}
                <div class="cm-line sub"><span>المجموع الفرعي</span><span>${moneyNum(t.subtotal)}</span></div>
                ${t.tax ? `<div class="cm-line sub"><span>الضريبة</span><span>${moneyNum(t.tax)}</span></div>` : ''}
                ${t.fee ? `<div class="cm-line sub"><span>أجرة ${t.zone ? t.zone.name : 'التوصيل'}</span><span>${moneyNum(t.fee)}</span></div>` : ''}
                <div class="cm-line grand"><span>الإجمالي</span><strong>${moneyNum(t.total)} ${s.currency}</strong></div>
            </div>

            ${canOrder ? `
            <div class="cm-types">
                <button class="${_mType === 'take' ? 'on' : ''}" onclick="captureMenuDraft();_mType='take';renderCustomerMenu()"><i class="bi bi-bag"></i> استلام من المطعم</button>
                ${s.enableDelivery !== false ? `<button class="${_mType === 'delivery' ? 'on' : ''}" onclick="captureMenuDraft();_mType='delivery';renderCustomerMenu()"><i class="bi bi-truck"></i> توصيل</button>` : ''}
            </div>

            <div class="field"><label>اسمك</label><input class="input" id="cmName" value="${escAttr(nameVal)}" placeholder="مثال: علي كاظم"></div>
            <div class="field"><label>رقم الهاتف</label><input class="input" id="cmPhone" value="${escAttr(phoneVal)}" style="direction:ltr;text-align:right" placeholder="0770 000 0000"></div>

            ${_mType === 'delivery' ? `
                <div class="field"><label>منطقة التوصيل</label>
                    <div class="zone-picker zp-sm">
                        ${zones.map(z => `<button type="button" class="zp-card ${_mZoneId === z.id ? 'active' : ''}" style="--zc:${z.color || '#c1272d'}" onclick="captureMenuDraft();_mZoneId='${z.id}';renderCustomerMenu()">
                            <div class="zp-name">${z.name}</div>
                            <div class="zp-fee">${moneyNum(z.fee)}</div>
                            <div class="zp-eta">${z.minutes} د</div>
                        </button>`).join('')}
                    </div>
                </div>
                <div class="field"><label>العنوان التفصيلي</label>
                    <textarea class="input" id="cmAddr" placeholder="محلة / زقاق / دار / أقرب نقطة دالة">${escAttr(addrVal)}</textarea>
                </div>
                <p class="cm-note"><i class="bi bi-cash-coin"></i> الدفع كاش عند الاستلام مع السائق</p>
            ` : `<p class="cm-note"><i class="bi bi-shop"></i> ادفع عند الاستلام من الكاشير</p>`}

            <div class="field"><label>ملاحظات (اختياري)</label>
                <textarea class="input" id="cmNotes" placeholder="بدون بصل، حار...">${escAttr(notesVal)}</textarea>
            </div>

            <button class="btn btn-success btn-lg btn-block" ${_mCart.length ? '' : 'disabled'} onclick="submitCustomerOrder()">
                <i class="bi bi-check2-circle"></i> تأكيد الطلب — ${moneyNum(t.total)}
            </button>` : `<div class="cm-empty"><i class="bi bi-info-circle"></i><p>الطلب من المنيو معطّل حالياً — تواصلوا معنا هاتفياً</p></div>`}
        </main>
    `;
}

function submitCustomerOrder() {
    if (!_mCart.length) { toast('السلة فارغة', 'error'); return; }
    const s = getSettings();
    if (s.enableOnlineOrders === false) { toast('الطلب من المنيو معطّل', 'warning'); return; }
    const name = document.getElementById('cmName')?.value.trim();
    const phone = document.getElementById('cmPhone')?.value.trim();
    if (!name) { toast('أدخل اسمك', 'error'); return; }
    if (!phone) { toast('أدخل رقم الهاتف', 'error'); return; }
    if (_mType === 'delivery' && s.requireDeliveryZone !== false && !_mZoneId) {
        toast('اختر منطقة التوصيل', 'error'); return;
    }
    const address = document.getElementById('cmAddr')?.value.trim() || '';
    const notes = document.getElementById('cmNotes')?.value.trim() || '';
    const t = menuTotals();
    const zone = t.zone;

    let customer = getCustomers().find(c => c.phone && c.phone.replace(/\s+/g, '') === phone.replace(/\s+/g, '') && c.id !== 'cu1');
    if (!customer) customer = api.addCustomer({ name, phone, addresses: [] });
    else if (customer.name === 'عميل نقدي' || !customer.name) api.updateCustomer(customer.id, { name });

    const order = api.addOrder({
        items: _mCart.map(i => ({ ...i })),
        subtotal: t.subtotal, tax: t.tax, service: 0, discount: 0, tip: 0,
        total: t.total, paid: 0, change: 0,
        orderType: _mType === 'delivery' ? 'delivery' : 'take',
        orderTypeLabel: _mType === 'delivery' ? 'توصيل' : 'سفري',
        deliveryFee: t.fee, zoneId: _mType === 'delivery' ? _mZoneId : null,
        zoneName: zone ? zone.name : '', address: _mType === 'delivery' ? address : '',
        customerId: customer.id, customerName: name, customerPhone: phone,
        paymentMethod: 'cash', notes, status: 'preparing',
        source: 'menu', cashierName: 'منيو الزبون'
    });

    if (order.orderType === 'delivery' && s.enableDelivery !== false) {
        api.addDelivery({
            orderId: order.id, orderNumber: order.number,
            customerName: name, phone, zoneId: _mZoneId, address,
            fee: t.fee, total: t.total, collect: t.total, status: 'pending'
        });
        if (address) {
            const exists = (customer.addresses || []).some(a => a.address === address);
            if (!exists) api.addCustomerAddress(customer.id, { label: zone ? zone.name : 'عنوان', zoneId: _mZoneId, address });
        }
    }

    try {
        localStorage.setItem(MENU_LAST_KEY, JSON.stringify({
            id: order.id, number: order.number, name, phone, address, at: Date.now()
        }));
    } catch (e) {}

    _mCart = [];
    _mScreen = 'track';
    toast(`تم استلام طلبك #${order.number} 🎉`, 'success');
    renderCustomerMenu();
}

function loadLastMenuOrder() {
    try { return JSON.parse(localStorage.getItem(MENU_LAST_KEY) || '{}'); } catch (e) { return {}; }
}

function renderMenuTrack(el) {
    const last = loadLastMenuOrder();
    const order = last.id ? getOrder(last.id) : null;
    const dl = order ? getDeliveries().find(d => d.orderId === order.id) : null;
    const st = order ? (typeof STATUS_MAP !== 'undefined' && STATUS_MAP[order.status]) : null;
    const dst = dl ? (DELIVERY_STATUS[dl.status] || null) : null;

    el.innerHTML = `
        <header class="cm-bar">
            <button class="cm-back" onclick="_mScreen='menu';renderCustomerMenu()"><i class="bi bi-arrow-right"></i></button>
            <h2>طلبك</h2>
            <span></span>
        </header>
        <main class="cm-check">
            ${order ? `
                <div class="cm-track">
                    <div class="cm-num">#${order.number}</div>
                    <div class="badge ${st ? st.cls : 'badge-info'}">${st ? st.label : order.status}</div>
                    ${dst ? `<div class="badge ${dst.cls}" style="margin-top:8px"><i class="bi ${dst.icon}"></i> ${dst.label}</div>` : ''}
                    <p class="cm-muted">${fmtDateTime(order.createdAt)}</p>
                    <div class="cm-box" style="margin-top:14px">
                        ${(order.items || []).map(i => `<div class="cm-line"><span>${i.name} × ${i.qty}</span><strong>${moneyNum(i.price * i.qty)}</strong></div>`).join('')}
                        <div class="cm-line grand"><span>الإجمالي</span><strong>${moneyNum(order.total)}</strong></div>
                    </div>
                    ${order.zoneName ? `<p class="cm-note"><i class="bi bi-geo-alt"></i> ${order.zoneName}${order.address ? ' — ' + order.address : ''}</p>` : ''}
                    <button class="btn btn-gold btn-block" onclick="_mScreen='feedback';renderCustomerMenu()"><i class="bi bi-star"></i> قيّم تجربتك</button>
                </div>
            ` : `<div class="cm-empty"><i class="bi bi-receipt"></i><p>لا يوجد طلب محفوظ على هذا الجهاز بعد</p></div>`}
        </main>
    `;
}

function renderMenuFeedback(el) {
    const last = loadLastMenuOrder();
    el.innerHTML = `
        <header class="cm-bar">
            <button class="cm-back" onclick="_mScreen='menu';renderCustomerMenu()"><i class="bi bi-arrow-right"></i></button>
            <h2>تقييم التجربة</h2>
            <span></span>
        </header>
        <main class="cm-check">
            <p class="cm-muted" style="margin-bottom:14px">رأيك يساعدنا نقدّم أفضل.</p>
            <div class="field"><label>اسمك</label><input class="input" id="fbName" value="${escAttr(last.name || '')}"></div>
            ${['rating|التقييم العام', 'food|جودة الطعام', 'service|الخدمة', 'speed|سرعة التقديم'].map(x => {
                const [k, l] = x.split('|');
                return `<div class="field"><label>${l}</label>
                    <div class="star-pick" id="star_${k}">
                        ${[1, 2, 3, 4, 5].map(n => `<span onclick="pickStar('${k}',${n})" data-n="${n}" class="on">★</span>`).join('')}
                    </div></div>`;
            }).join('')}
            <div class="field"><label>ملاحظتك</label><textarea class="input" id="fbComment" placeholder="شو عجبكم وشنو نحسّن؟"></textarea></div>
            <button class="btn btn-primary btn-lg btn-block" onclick="saveMenuFeedback()"><i class="bi bi-send"></i> إرسال التقييم</button>
        </main>
    `;
    window._fbStars = { rating: 5, food: 5, service: 5, speed: 5 };
}

function saveMenuFeedback() {
    const last = loadLastMenuOrder();
    const st = window._fbStars || { rating: 5, food: 5, service: 5, speed: 5 };
    api.addFeedback({
        orderId: last.id || null, orderNumber: last.number || null,
        customerName: document.getElementById('fbName')?.value.trim() || last.name || 'زبون',
        ...st, comment: document.getElementById('fbComment')?.value.trim() || ''
    });
    toast('شكراً لتقييمك ⭐', 'success');
    _mScreen = 'menu';
    renderCustomerMenu();
}

function escAttr(v) {
    return String(v || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
