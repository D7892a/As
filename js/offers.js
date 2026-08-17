/* ============================================
   قسم العروض — الوجبات المركّبة والتخفيضات
   ============================================ */

let _offersFilter = 'all';
let _offerDraftItems = [];

const WEEK_DAYS = [
    { v: 6, l: 'السبت' }, { v: 0, l: 'الأحد' }, { v: 1, l: 'الاثنين' }, { v: 2, l: 'الثلاثاء' },
    { v: 3, l: 'الأربعاء' }, { v: 4, l: 'الخميس' }, { v: 5, l: 'الجمعة' }
];

function renderOffers() {
    const wrap = document.getElementById('offersContainer');
    if (!wrap) return;
    let list = [...getOffers()];
    if (_offersFilter === 'live') list = list.filter(isOfferLive);
    if (_offersFilter === 'off') list = list.filter(o => !o.active);
    if (_offersFilter === 'expired') list = list.filter(o => o.active && !isOfferLive(o));

    const totalSold = getOffers().reduce((s, o) => s + (o.sold || 0), 0);
    const avgSaving = getOffers().length
        ? Math.round(getOffers().reduce((s, o) => s + offerSaving(o), 0) / getOffers().length) : 0;

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-stars stat-icon"></i><div class="stat-label">إجمالي العروض</div><div class="stat-value">${getOffers().length}</div></div>
            <div class="stat green"><i class="bi bi-broadcast stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">عروض سارية الآن</div><div class="stat-value">${getOffers().filter(isOfferLive).length}</div></div>
            <div class="stat gold"><i class="bi bi-bag-heart stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">مرات البيع</div><div class="stat-value">${totalSold}</div></div>
            <div class="stat blue"><i class="bi bi-piggy-bank stat-icon" style="color:rgba(37,99,235,.1)"></i><div class="stat-label">متوسط التوفير</div><div class="stat-value" style="font-size:20px">${moneyNum(avgSaving)}</div></div>
        </div>

        <div class="toolbar">
            <div class="filter-pills">
                ${[['all', 'الكل'], ['live', 'سارية الآن'], ['expired', 'خارج التوقيت'], ['off', 'موقوفة']].map(([k, l]) =>
                    `<span class="pill ${_offersFilter === k ? 'active' : ''}" onclick="setOffersFilter('${k}')">${l}</span>`).join('')}
            </div>
            <div class="spacer"></div>
            <button class="btn btn-gold" data-perm="offers" onclick="guard('offers', printOffersMenu)"><i class="bi bi-printer"></i> طباعة لوحة العروض</button>
            <button class="btn btn-primary" data-perm="offers" onclick="guard('offers', () => openOfferForm())"><i class="bi bi-plus-lg"></i> عرض جديد</button>
        </div>

        <div class="offers-grid">
            ${list.length ? list.map(offerCard).join('') : `<div class="empty-state" style="grid-column:1/-1"><i class="bi bi-stars"></i><p>لا توجد عروض — أنشئ أول عرض لجذب الزبائن 🎉</p></div>`}
        </div>`;
    applyPermissions();
}

function offerCard(o) {
    const original = offerOriginalPrice(o);
    const saving = offerSaving(o);
    const pct = original ? Math.round(saving / original * 100) : 0;
    const live = isOfferLive(o);
    const items = (o.items || []).map(it => {
        const p = getProduct(it.productId);
        return p ? `<span class="oi-chip">${p.emoji || '🍽️'} ${p.name} ×${it.qty}</span>` : '';
    }).join('');
    return `
    <div class="offer-card ${live ? '' : 'dim'}">
        <div class="oc-head">
            <div class="oc-visual">${o.image ? `<img src="${o.image}" alt="${o.name}">` : (o.emoji || '🎁')}</div>
            <div style="flex:1;min-width:0">
                <div class="oc-title">${o.name}</div>
                <div class="oc-desc">${o.description || '—'}</div>
            </div>
            ${pct > 0 ? `<div class="oc-discount">-${pct}%</div>` : ''}
        </div>
        ${o.badge ? `<span class="oc-badge">${o.badge}</span>` : ''}
        <div class="oc-items">${items || '<span class="oi-chip">لا توجد أصناف</span>'}</div>
        <div class="oc-prices">
            <div>
                <div class="oc-price">${moneyNum(o.price)} <small>${getSettings().currency}</small></div>
                ${saving > 0 ? `<div class="oc-old">${moneyNum(original)}</div>` : ''}
            </div>
            <div class="oc-saving">${saving > 0 ? `يوفّر ${moneyNum(saving)}` : 'بدون توفير'}</div>
        </div>
        <div class="oc-meta">
            <span class="badge ${live ? 'badge-success' : 'badge-danger'}"><i class="bi ${live ? 'bi-broadcast' : 'bi-pause-circle'}"></i> ${live ? 'ساري' : (o.active ? 'خارج التوقيت' : 'موقوف')}</span>
            <span class="badge badge-dark"><i class="bi bi-bag-check"></i> بيع ${o.sold || 0} مرة</span>
            ${(o.startDate || o.endDate) ? `<span class="badge badge-gold"><i class="bi bi-calendar-range"></i> ${o.startDate || '…'} ← ${o.endDate || '…'}</span>` : ''}
            ${(o.days || []).length ? `<span class="badge badge-info"><i class="bi bi-calendar-week"></i> ${o.days.map(d => WEEK_DAYS.find(w => w.v === d)?.l).join('، ')}</span>` : ''}
        </div>
        <div class="oc-actions">
            <button class="btn btn-success btn-sm" onclick="addOfferToCart('${o.id}'); navigate('pos')"><i class="bi bi-cart-plus"></i> بيع الآن</button>
            <button class="btn btn-light btn-sm" data-perm="offers" onclick="guard('offers', () => toggleOffer('${o.id}'))"><i class="bi bi-power"></i> ${o.active ? 'إيقاف' : 'تفعيل'}</button>
            <button class="btn btn-light btn-sm" data-perm="offers" onclick="guard('offers', () => openOfferForm('${o.id}'))"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-danger btn-sm" data-perm="offers" onclick="guard('offers', () => delOffer('${o.id}'))"><i class="bi bi-trash"></i></button>
        </div>
    </div>`;
}

function setOffersFilter(f) { _offersFilter = f; renderOffers(); }
function toggleOffer(id) {
    const o = getOffer(id); if (!o) return;
    api.updateOffer(id, { active: !o.active });
    renderOffers();
    toast(o.active ? 'تم تفعيل العرض' : 'تم إيقاف العرض', 'info');
}
function delOffer(id) {
    if (!confirmAction('حذف هذا العرض نهائياً؟')) return;
    api.deleteOffer(id); renderOffers(); toast('تم حذف العرض', 'success');
}

/* ----- نموذج العرض ----- */
function openOfferForm(id) {
    const o = id ? getOffer(id) : null;
    _offerDraftItems = o ? JSON.parse(JSON.stringify(o.items || [])) : [];
    openModalContent(o ? 'تعديل العرض' : 'عرض جديد', `
        <div class="row-flex">
            <div class="field" style="flex:2"><label>اسم العرض</label><input class="input" id="ofName" value="${o?.name || ''}" placeholder="مثال: وجبة العائلة"></div>
            <div class="field" style="flex:1"><label>الأيقونة</label><input class="input" id="ofEmoji" value="${o?.emoji || '🎁'}" style="text-align:center;font-size:20px"></div>
        </div>
        <div class="field"><label>الوصف</label><input class="input" id="ofDesc" value="${o?.description || ''}" placeholder="ما الذي يشمله العرض؟"></div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>سعر العرض (د.ع)</label><input class="input" id="ofPrice" type="number" value="${o?.price || 0}" oninput="updateOfferSummary()"></div>
            <div class="field" style="flex:1"><label>شارة تسويقية</label><input class="input" id="ofBadge" value="${o?.badge || ''}" placeholder="الأكثر طلباً"></div>
        </div>

        <div class="field">
            <label>أصناف العرض</label>
            <div class="row-flex" style="gap:8px">
                <select class="input" id="ofPickProduct" style="flex:2">
                    ${getProducts().map(p => `<option value="${p.id}">${p.emoji || '🍽️'} ${p.name} — ${moneyNum(p.price)}</option>`).join('')}
                </select>
                <input class="input" id="ofPickQty" type="number" value="1" min="1" style="flex:0 0 80px">
                <button class="btn btn-primary" onclick="addOfferItem()"><i class="bi bi-plus-lg"></i></button>
            </div>
            <div id="ofItemsList" style="margin-top:10px"></div>
        </div>

        <div class="row-flex">
            <div class="field" style="flex:1"><label>يبدأ في (اختياري)</label><input class="input" id="ofStart" type="date" value="${o?.startDate || ''}"></div>
            <div class="field" style="flex:1"><label>ينتهي في (اختياري)</label><input class="input" id="ofEnd" type="date" value="${o?.endDate || ''}"></div>
        </div>
        <div class="field">
            <label>أيام العرض (اتركها فارغة = كل الأيام)</label>
            <div class="filter-pills" id="ofDays">
                ${WEEK_DAYS.map(d => `<span class="pill ${(o?.days || []).includes(d.v) ? 'active' : ''}" data-day="${d.v}" onclick="this.classList.toggle('active')">${d.l}</span>`).join('')}
            </div>
        </div>
        <div class="toggle-row"><div class="tr-info"><h5>العرض مفعّل</h5><p>يظهر في شاشة نقطة البيع</p></div>
            <label class="switch"><input type="checkbox" id="ofActive" ${o ? (o.active ? 'checked' : '') : 'checked'}><span class="slider-sw"></span></label></div>

        <div id="ofSummary" class="offer-summary"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-success" style="flex:1" onclick="saveOffer(${o ? `'${o.id}'` : 'null'})"><i class="bi bi-check2-circle"></i> حفظ العرض</button>`, 'lg');
    renderOfferItems();
}

function addOfferItem() {
    const pid = document.getElementById('ofPickProduct').value;
    const qty = Math.max(1, Number(document.getElementById('ofPickQty').value) || 1);
    const ex = _offerDraftItems.find(i => i.productId === pid);
    if (ex) ex.qty += qty; else _offerDraftItems.push({ productId: pid, qty });
    renderOfferItems();
}
function removeOfferItem(pid) {
    _offerDraftItems = _offerDraftItems.filter(i => i.productId !== pid);
    renderOfferItems();
}
function renderOfferItems() {
    const box = document.getElementById('ofItemsList');
    if (!box) return;
    box.innerHTML = _offerDraftItems.length ? _offerDraftItems.map(it => {
        const p = getProduct(it.productId);
        if (!p) return '';
        return `<div class="cart-line">
            <div class="cl-info"><div class="cl-name">${p.emoji || '🍽️'} ${p.name}</div><div class="cl-price">${moneyNum(p.price)} × ${it.qty}</div></div>
            <div class="cl-total">${moneyNum(p.price * it.qty)}</div>
            <span class="cl-remove" onclick="removeOfferItem('${p.id}')"><i class="bi bi-x-circle"></i></span>
        </div>`;
    }).join('') : `<div style="font-size:12.5px;color:var(--muted);padding:8px">لم تُضف أصناف بعد</div>`;
    updateOfferSummary();
}
function updateOfferSummary() {
    const box = document.getElementById('ofSummary');
    if (!box) return;
    const original = _offerDraftItems.reduce((s, it) => { const p = getProduct(it.productId); return s + (p ? p.price * it.qty : 0); }, 0);
    const price = Number(document.getElementById('ofPrice')?.value || 0);
    const saving = Math.max(0, original - price);
    box.innerHTML = `
        <div class="totals-row"><span>السعر الأصلي للأصناف</span><span>${moneyNum(original)}</span></div>
        <div class="totals-row"><span>سعر العرض</span><span>${moneyNum(price)}</span></div>
        <div class="totals-row discount"><span>توفير الزبون</span><span>− ${moneyNum(saving)} (${original ? Math.round(saving / original * 100) : 0}%)</span></div>`;
}

function saveOffer(id) {
    const name = document.getElementById('ofName').value.trim();
    if (!name) { toast('أدخل اسم العرض', 'error'); return; }
    if (!_offerDraftItems.length) { toast('أضف صنفاً واحداً على الأقل للعرض', 'error'); return; }
    const data = {
        name,
        emoji: document.getElementById('ofEmoji').value.trim() || '🎁',
        description: document.getElementById('ofDesc').value.trim(),
        price: Number(document.getElementById('ofPrice').value) || 0,
        badge: document.getElementById('ofBadge').value.trim(),
        items: _offerDraftItems,
        startDate: document.getElementById('ofStart').value,
        endDate: document.getElementById('ofEnd').value,
        days: [...document.querySelectorAll('#ofDays .pill.active')].map(el => Number(el.dataset.day)),
        active: document.getElementById('ofActive').checked
    };
    if (id) { api.updateOffer(id, data); toast('تم تحديث العرض ✅', 'success'); }
    else { api.addOffer(data); toast('تمت إضافة العرض 🎉', 'success'); }
    closeModal('dynModal');
    renderOffers();
    if (typeof renderCategoryChips === 'function') renderCategoryChips();
}

/* ----- طباعة لوحة العروض ----- */
function printOffersMenu() {
    const rows = getOffers().filter(o => o.active).map(o => `
        <tr>
            <td style="font-weight:800">${o.emoji || '🎁'} ${o.name}</td>
            <td>${(o.items || []).map(i => { const p = getProduct(i.productId); return p ? `${p.name} ×${i.qty}` : ''; }).filter(Boolean).join(' + ')}</td>
            <td style="text-decoration:line-through;color:#888">${moneyNum(offerOriginalPrice(o))}</td>
            <td style="font-weight:900;color:#c1272d">${moneyNum(o.price)}</td>
        </tr>`).join('');
    printElement(reportShell('لوحة العروض والوجبات المركّبة', `
        <table class="rep-tbl"><thead><tr><th>العرض</th><th>المحتويات</th><th>السعر الأصلي</th><th>سعر العرض</th></tr></thead>
        <tbody>${rows}</tbody></table>`, 'العروض السارية حالياً'));
}
