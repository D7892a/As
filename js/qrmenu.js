/* ============================================
   المنيو الرقمي QR + تقييمات العملاء
   ============================================ */

let _qrTab = 'menu'; // menu | feedback

function renderQrMenu() {
    const wrap = document.getElementById('qrmenuContainer');
    if (!wrap) return;
    const fb = getFeedback();
    const avg = fb.length ? (fb.reduce((s, f) => s + Number(f.rating || 0), 0) / fb.length).toFixed(1) : '0.0';
    const avgOf = (k) => fb.length ? (fb.reduce((s, f) => s + Number(f[k] || 0), 0) / fb.length).toFixed(1) : '0.0';

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat gold"><i class="bi bi-star-fill stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">التقييم العام</div><div class="stat-value">${avg} <small style="font-size:14px">/ 5</small></div></div>
            <div class="stat green"><i class="bi bi-egg-fried stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">جودة الطعام</div><div class="stat-value">${avgOf('food')}</div></div>
            <div class="stat blue"><i class="bi bi-emoji-smile stat-icon" style="color:rgba(37,99,235,.1)"></i><div class="stat-label">الخدمة</div><div class="stat-value">${avgOf('service')}</div></div>
            <div class="stat purple"><i class="bi bi-lightning stat-icon" style="color:rgba(124,58,237,.1)"></i><div class="stat-label">سرعة التقديم</div><div class="stat-value">${avgOf('speed')}</div></div>
        </div>

        <div class="seg-tabs">
            ${[['menu', 'bi-qr-code', 'المنيو الرقمي QR'], ['feedback', 'bi-chat-heart', `تقييمات العملاء (${fb.length})`]]
              .map(([k, i, l]) => `<button class="seg ${_qrTab === k ? 'active' : ''}" onclick="setQrTab('${k}')"><i class="bi ${i}"></i> ${l}</button>`).join('')}
        </div>
        <div id="qrBody"></div>`;
    renderQrBody();
}
function setQrTab(t) { _qrTab = t; renderQrMenu(); }

function renderQrBody() {
    const box = document.getElementById('qrBody');
    if (!box) return;
    if (_qrTab === 'feedback') return renderFeedbackTab(box);

    const s = getSettings();
    const cats = getCategories();
    box.innerHTML = `
        <div class="grid grid-2">
            <div class="card card-pad">
                <div class="ss-title"><i class="bi bi-qr-code"></i> رمز QR للمنيو</div>
                <p style="font-size:13px;color:var(--muted);margin-bottom:14px">اطبع هذا الرمز وضعه على الطاولات — يفتح الزبون المنيو من هاتفه مباشرة بدون تطبيق.</p>
                <div class="qr-preview" id="qrBox"></div>
                <div class="field" style="margin-top:14px"><label>رابط المنيو (اختياري — للنشر على الإنترنت)</label>
                    <input class="input" id="qrLink" value="${s.menuUrl || ''}" placeholder="https://example.com/menu" oninput="drawMenuQr()">
                </div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-gold" style="flex:1" onclick="saveMenuUrl()"><i class="bi bi-save"></i> حفظ الرابط</button>
                    <button class="btn btn-light" style="flex:1" onclick="printQrCard()"><i class="bi bi-printer"></i> طباعة بطاقة الطاولة</button>
                </div>
            </div>

            <div class="card card-pad">
                <div class="ss-title"><i class="bi bi-phone"></i> معاينة المنيو</div>
                <p style="font-size:13px;color:var(--muted);margin-bottom:12px">هكذا يشاهد الزبون قائمتك — ${getProducts().filter(p => p.available).length} صنف في ${cats.length} قسم.</p>
                <div class="phone-frame">
                    <div class="phone-screen">
                        <div class="pm-head">
                            <div class="pm-logo">${s.restaurantLogo ? `<img src="${s.restaurantLogo}">` : '🍽️'}</div>
                            <h3>${s.restaurantName}</h3>
                            <p>${s.slogan}</p>
                        </div>
                        ${cats.map(c => {
                            const items = getProducts().filter(p => p.categoryId === c.id && p.available);
                            if (!items.length) return '';
                            return `<div class="pm-cat"><span>${c.icon}</span> ${c.name}</div>
                                ${items.map(p => `<div class="pm-item">
                                    <div class="pm-emoji">${p.image ? `<img src="${p.image}">` : (p.emoji || '🍽️')}</div>
                                    <div style="flex:1;min-width:0">
                                        <div class="pm-name">${p.name}</div>
                                        <div class="pm-desc">${p.description || ''}</div>
                                    </div>
                                    <div class="pm-price">${moneyNum(p.price)}</div>
                                </div>`).join('')}`;
                        }).join('')}
                        <div class="pm-foot">${s.receiptFooter || ''}</div>
                    </div>
                </div>
                <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="printDigitalMenu()"><i class="bi bi-printer"></i> طباعة المنيو الكامل</button>
            </div>
        </div>`;
    drawMenuQr();
}

/* ----- توليد QR بدون مكتبات خارجية (عبر خدمة صورة + بديل نصي) ----- */
function drawMenuQr() {
    const box = document.getElementById('qrBox');
    if (!box) return;
    const url = (document.getElementById('qrLink')?.value || '').trim() || location.href;
    const enc = encodeURIComponent(url);
    box.innerHTML = `
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${enc}"
             alt="QR" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'qr-fallback',textContent:'تعذّر توليد الرمز — تحقق من الاتصال بالإنترنت'}))">
        <div class="qr-url">${url}</div>`;
}
function saveMenuUrl() {
    api.saveSettings({ menuUrl: document.getElementById('qrLink').value.trim() });
    toast('تم حفظ رابط المنيو ✅', 'success');
}
function printQrCard() {
    const s = getSettings();
    const url = (document.getElementById('qrLink')?.value || '').trim() || location.href;
    printElement(`<div style="text-align:center;padding:30px;font-family:Cairo,sans-serif">
        <div style="font-size:44px">${s.restaurantLogo ? `<img src="${s.restaurantLogo}" style="width:70px;height:70px;border-radius:14px;object-fit:cover">` : '🍽️'}</div>
        <h1 style="font-size:24px;margin:8px 0">${s.restaurantName}</h1>
        <p style="color:#666;margin-bottom:16px">${s.slogan}</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(url)}" style="width:260px;height:260px">
        <h2 style="font-size:19px;margin-top:14px">امسح الرمز لعرض المنيو 📱</h2>
        <p style="color:#666;font-size:13px;margin-top:6px">${s.phone} • ${s.address}</p>
    </div>`);
}
function printDigitalMenu() {
    const s = getSettings();
    const body = getCategories().map(c => {
        const items = getProducts().filter(p => p.categoryId === c.id && p.available);
        if (!items.length) return '';
        return `<h3 style="margin:14px 0 6px;font-size:16px;border-bottom:2px solid #d4af37;padding-bottom:4px">${c.icon} ${c.name}</h3>
            <table class="rep-tbl"><tbody>
            ${items.map(p => `<tr><td style="width:60%">${p.emoji || ''} <strong>${p.name}</strong><br><small style="color:#666">${p.description || ''}</small></td>
                <td style="text-align:left;font-weight:900">${moneyNum(p.price)} ${s.currency}</td></tr>`).join('')}
            </tbody></table>`;
    }).join('');
    printElement(reportShell('قائمة الطعام', body, 'المنيو الكامل'));
}

/* ============ تقييمات العملاء ============ */
function renderFeedbackTab(box) {
    const fb = getFeedback();
    const dist = [5, 4, 3, 2, 1].map(n => ({ n, c: fb.filter(f => Math.round(f.rating) === n).length }));
    const max = Math.max(1, ...dist.map(d => d.c));

    box.innerHTML = `
        <div class="toolbar">
            <div class="spacer"></div>
            <button class="btn btn-primary" onclick="openFeedbackForm()"><i class="bi bi-plus-lg"></i> تسجيل تقييم</button>
        </div>
        <div class="grid grid-2">
            <div class="card card-pad">
                <div class="ss-title"><i class="bi bi-bar-chart"></i> توزيع التقييمات</div>
                ${dist.map(d => `<div class="rate-row">
                    <span class="rate-star">${d.n} ★</span>
                    <div class="rate-bar"><div style="width:${d.c / max * 100}%"></div></div>
                    <span class="rate-count">${d.c}</span>
                </div>`).join('')}
            </div>
            <div class="card card-pad">
                <div class="ss-title"><i class="bi bi-chat-heart"></i> آخر الآراء</div>
                <div class="fb-list">
                    ${fb.length ? fb.slice(0, 12).map(f => `
                        <div class="fb-item">
                            <div class="fb-top">
                                <strong>${f.customerName || 'زبون'}</strong>
                                <span class="fb-stars">${'★'.repeat(Math.round(f.rating))}${'☆'.repeat(5 - Math.round(f.rating))}</span>
                            </div>
                            ${f.comment ? `<div class="fb-comment">${f.comment}</div>` : ''}
                            <div class="fb-meta">${f.orderNumber ? 'طلب #' + f.orderNumber + ' • ' : ''}${fmtDateTime(f.createdAt)}
                                <button class="icon-btn" style="width:26px;height:26px;font-size:11px;float:left" onclick="delFeedback('${f.id}')"><i class="bi bi-trash"></i></button>
                            </div>
                        </div>`).join('') : `<div class="empty-state"><i class="bi bi-chat-heart"></i><p>لا توجد تقييمات بعد</p></div>`}
                </div>
            </div>
        </div>`;
}
function openFeedbackForm(orderId) {
    const o = orderId ? getOrder(orderId) : null;
    openModalContent('تقييم تجربة الزبون', `
        <div class="field"><label>اسم الزبون</label><input class="input" id="fbName" value="${o ? o.customerName : ''}" placeholder="اختياري"></div>
        ${['rating|التقييم العام', 'food|جودة الطعام', 'service|الخدمة', 'speed|سرعة التقديم'].map(x => {
            const [k, l] = x.split('|');
            return `<div class="field"><label>${l}</label>
                <div class="star-pick" id="star_${k}">
                    ${[1, 2, 3, 4, 5].map(n => `<span onclick="pickStar('${k}',${n})" data-n="${n}" class="${n <= 5 ? 'on' : ''}">★</span>`).join('')}
                </div></div>`;
        }).join('')}
        <div class="field"><label>ملاحظات الزبون</label><textarea class="input" id="fbComment" placeholder="رأي الزبون بالخدمة والطعام..."></textarea></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-primary" style="flex:1" onclick="saveFeedback('${orderId || ''}')"><i class="bi bi-check2"></i> حفظ التقييم</button>`);
    window._fbStars = { rating: 5, food: 5, service: 5, speed: 5 };
}
function pickStar(key, n) {
    window._fbStars = window._fbStars || { rating: 5, food: 5, service: 5, speed: 5 };
    window._fbStars[key] = n;
    document.querySelectorAll(`#star_${key} span`).forEach(s => s.classList.toggle('on', Number(s.dataset.n) <= n));
}
function saveFeedback(orderId) {
    const o = orderId ? getOrder(orderId) : null;
    const st = window._fbStars || { rating: 5, food: 5, service: 5, speed: 5 };
    api.addFeedback({
        orderId: orderId || null, orderNumber: o ? o.number : null,
        customerName: document.getElementById('fbName').value.trim(),
        ...st, comment: document.getElementById('fbComment').value.trim()
    });
    closeModal('dynModal'); renderQrMenu(); toast('شكراً — تم حفظ التقييم ⭐', 'success');
}
function delFeedback(id) {
    if (!confirmAction('حذف هذا التقييم؟')) return;
    api.deleteFeedback(id); renderQrMenu();
}
