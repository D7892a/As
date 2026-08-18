/* ============================================
   تطبيق السائق — طلبات التوصيل من الهاتف
   يُفتح عبر: index.html?view=driver
   الحسابات الافتراضية:
     حسين الدليفري  2222
     كرار التوصيل   3333
   ============================================ */

const DRIVER_SESSION_KEY = 'iq_driver_session_v1';

let _drUser = null;
let _drPin = '';
let _drTab = 'jobs'; // jobs | today | me
let _drTimer = null;

function bootDriverApp() {
    window._portal = 'driver';
    document.body.classList.add('portal-mode', 'driver-mode');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'none';
    const el = document.getElementById('portalDriver');
    el.style.display = 'flex';
    document.title = 'تطبيق السائق — ' + (getSettings().restaurantName || 'التوصيل');
    restoreDriverSession();
    renderDriverApp();
    window.addEventListener('storage', onPortalStorage);
    if (_drTimer) clearInterval(_drTimer);
    _drTimer = setInterval(() => {
        if (window._portal === 'driver' && _drUser) renderDriverApp();
    }, 12000);
}

function restoreDriverSession() {
    let id = null;
    try { id = localStorage.getItem(DRIVER_SESSION_KEY); } catch (e) {}
    const d = id ? getDriver(id) : null;
    _drUser = (d && d.active !== false) ? d : null;
}

function currentDriver() { return _drUser; }

function renderDriverApp() {
    const el = document.getElementById('portalDriver');
    if (!el) return;
    if (!_drUser) return renderDriverLogin(el);
    renderDriverHome(el);
}

function renderDriverLogin(el) {
    const s = getSettings();
    const drivers = getDrivers().filter(d => d.active !== false);
    el.innerHTML = `
        <div class="dr-login">
            <div class="dr-login-card">
                <div class="dr-badge"><i class="bi bi-truck"></i></div>
                <h1>تطبيق السائق</h1>
                <p>${s.restaurantName}</p>
                <div class="login-col-title" style="margin-top:18px"><i class="bi bi-person-vcard"></i> اختر حسابك</div>
                <div class="dr-users">
                    ${drivers.map(d => `<button class="dr-user ${_drPin && window._drPick === d.id ? 'on' : ''}" onclick="pickDriver('${d.id}')">
                        <span class="dr-av"><i class="bi bi-person-fill"></i></span>
                        <span><b>${d.name}</b><small>${d.vehicle || ''} • ${d.phone || ''}</small></span>
                    </button>`).join('') || '<p class="cm-muted">لا يوجد سائقون نشطون</p>'}
                </div>
                <div id="drPinBox" style="display:${window._drPick ? 'block' : 'none'}">
                    <div class="login-col-title">الرمز السري</div>
                    <div class="pin-dots" id="drDots"></div>
                    <div class="pin-pad">
                        ${[1,2,3,4,5,6,7,8,9].map(n => `<button onclick="drPinPress('${n}')">${n}</button>`).join('')}
                        <button class="pin-fn" onclick="drPinClear()"><i class="bi bi-eraser"></i></button>
                        <button onclick="drPinPress('0')">0</button>
                        <button class="pin-fn" onclick="drPinBack()"><i class="bi bi-backspace"></i></button>
                    </div>
                    <button class="btn btn-gold btn-block" onclick="doDriverLogin()"><i class="bi bi-box-arrow-in-right"></i> دخول</button>
                </div>
                <p class="dr-hint">حسين <b>2222</b> • كرار <b>3333</b></p>
                <a class="dr-back-link" href="${portalUrl()}">العودة للكاشير</a>
            </div>
        </div>
    `;
    paintDrDots();
}

function pickDriver(id) {
    window._drPick = id;
    _drPin = '';
    renderDriverApp();
}
function drPinPress(d) {
    if (_drPin.length >= 6) return;
    _drPin += d;
    paintDrDots();
    const dr = getDriver(window._drPick);
    if (dr && _drPin.length === String(dr.pin || '').length) setTimeout(doDriverLogin, 80);
}
function drPinClear() { _drPin = ''; paintDrDots(); }
function drPinBack() { _drPin = _drPin.slice(0, -1); paintDrDots(); }
function paintDrDots() {
    const dots = document.getElementById('drDots');
    if (!dots) return;
    dots.innerHTML = Array.from({ length: Math.max(4, _drPin.length) })
        .map((_, i) => `<span class="pin-dot ${i < _drPin.length ? 'filled' : ''}"></span>`).join('');
}
function doDriverLogin() {
    const dr = getDriver(window._drPick);
    if (!dr) { toast('اختر السائق أولاً', 'warning'); return; }
    if (String(dr.pin || '') !== _drPin) {
        toast('الرمز السري غير صحيح ❌', 'error');
        _drPin = ''; paintDrDots();
        return;
    }
    if (dr.active === false) { toast('هذا الحساب موقوف', 'error'); return; }
    _drUser = dr;
    try { localStorage.setItem(DRIVER_SESSION_KEY, dr.id); } catch (e) {}
    logActivity('login', `دخول تطبيق السائق: ${dr.name}`);
    persist();
    toast(`أهلاً ${dr.name} 🚗`, 'success');
    renderDriverApp();
}
function driverLogout() {
    _drUser = null;
    _drPin = '';
    window._drPick = null;
    try { localStorage.removeItem(DRIVER_SESSION_KEY); } catch (e) {}
    renderDriverApp();
}

function driverJobs() {
    if (!_drUser) return [];
    return getDeliveries().filter(d =>
        d.driverId === _drUser.id && ['assigned', 'onway'].includes(d.status)
    ).sort((a, b) => a.createdAt - b.createdAt);
}
function driverOpenPool() {
    return getDeliveries().filter(d => d.status === 'pending');
}
function driverToday() {
    if (!_drUser) return [];
    const start = new Date().setHours(0, 0, 0, 0);
    return getDeliveries().filter(d => d.driverId === _drUser.id && d.createdAt >= start);
}

function renderDriverHome(el) {
    const jobs = driverJobs();
    const pool = driverOpenPool();
    const today = driverToday();
    const done = today.filter(d => d.status === 'delivered');
    const cash = done.filter(d => !d.settled).reduce((s, d) => s + Number(d.collect || 0), 0);
    const comm = done.length * Number(_drUser.commission || 0);
    const s = getSettings();

    el.innerHTML = `
        <header class="dr-top">
            <div>
                <small>تطبيق السائق</small>
                <strong>${_drUser.name}</strong>
            </div>
            <div class="dr-top-actions">
                <span class="dr-live">${jobs.length ? jobs.length + ' جارية' : 'متاح'}</span>
                <button class="cm-icon" onclick="driverLogout()" title="خروج"><i class="bi bi-box-arrow-right"></i></button>
            </div>
        </header>

        <div class="dr-kpis">
            <div><b>${done.length}</b><span>مُسلّم اليوم</span></div>
            <div><b>${moneyNum(comm)}</b><span>عمولتك</span></div>
            <div><b>${moneyNum(cash)}</b><span>كاش للتسوية</span></div>
        </div>

        <nav class="dr-tabs">
            <button class="${_drTab === 'jobs' ? 'on' : ''}" onclick="_drTab='jobs';renderDriverApp()"><i class="bi bi-truck"></i> مهامي ${jobs.length ? `(${jobs.length})` : ''}</button>
            <button class="${_drTab === 'today' ? 'on' : ''}" onclick="_drTab='today';renderDriverApp()"><i class="bi bi-calendar-day"></i> اليوم</button>
            <button class="${_drTab === 'me' ? 'on' : ''}" onclick="_drTab='me';renderDriverApp()"><i class="bi bi-person"></i> حسابي</button>
        </nav>

        <main class="dr-body">
            ${_drTab === 'me' ? driverProfileHtml(s, today, done, cash, comm)
              : _drTab === 'today' ? driverTodayHtml(today)
              : driverJobsHtml(jobs, pool)}
        </main>
    `;
}

function driverJobsHtml(jobs, pool) {
    return `
        ${jobs.length ? jobs.map(driverJobCard).join('') : `<div class="cm-empty"><i class="bi bi-check2-all"></i><p>لا توجد مهام مسندة إليك الآن</p></div>`}
        ${pool.length ? `
            <h3 class="dr-sec">طلبات بانتظار سائق</h3>
            ${pool.map(d => driverPoolCard(d)).join('')}
        ` : ''}
    `;
}

function driverJobCard(d) {
    const zone = d.zoneId ? getZone(d.zoneId) : null;
    const o = d.orderId ? getOrder(d.orderId) : null;
    const st = DELIVERY_STATUS[d.status] || DELIVERY_STATUS.assigned;
    const mins = Math.floor((Date.now() - d.createdAt) / 60000);
    const late = mins > (zone?.minutes || 30);
    const phone = (d.phone || '').replace(/\s+/g, '');
    const items = (o?.items || []).slice(0, 6).map(i => `${i.qty}× ${i.name}`).join('، ');
    return `<article class="dr-job ${late ? 'late' : ''}" style="--st:${st.color}">
        <div class="dr-job-h">
            <b>#${d.orderNumber || '—'}</b>
            <span class="badge ${st.cls}"><i class="bi ${st.icon}"></i> ${st.label}</span>
        </div>
        <h3>${d.customerName || 'عميل'}</h3>
        <p><i class="bi bi-geo-alt-fill"></i> <strong>${zone ? zone.name : 'بدون منطقة'}</strong>${d.address ? ' — ' + d.address : ''}</p>
        ${items ? `<p class="dr-items">${items}</p>` : ''}
        <div class="dr-cash">
            <span>حصّل عند الباب</span>
            <strong>${moneyNum(d.collect || d.total)}</strong>
        </div>
        <div class="dr-job-meta">منذ ${mins} د ${late ? '• متأخر' : ''} ${d.express ? '• سريع ⚡' : ''}</div>
        <div class="dr-acts">
            ${phone && phone !== '-' ? `<a class="btn btn-light" href="tel:${phone}"><i class="bi bi-telephone"></i></a>` : ''}
            ${phone && phone !== '-' ? `<a class="btn btn-light" target="_blank" rel="noopener" href="https://wa.me/${phone.replace(/^0/, '964')}"><i class="bi bi-whatsapp"></i></a>` : ''}
            ${d.status === 'assigned' ? `<button class="btn btn-gold" style="flex:1" onclick="driverStart('${d.id}')"><i class="bi bi-truck"></i> انطلقت</button>` : ''}
            ${d.status === 'onway' ? `<button class="btn btn-success" style="flex:1" onclick="driverDeliver('${d.id}')"><i class="bi bi-check2-circle"></i> تم التسليم</button>` : ''}
            <button class="btn btn-ghost" onclick="driverFail('${d.id}')"><i class="bi bi-exclamation-octagon"></i></button>
        </div>
    </article>`;
}

function driverPoolCard(d) {
    const zone = d.zoneId ? getZone(d.zoneId) : null;
    return `<article class="dr-job pool">
        <div class="dr-job-h"><b>#${d.orderNumber || '—'}</b><span class="badge badge-warning">متاح</span></div>
        <h3>${d.customerName || 'عميل'}</h3>
        <p><i class="bi bi-geo-alt"></i> ${zone ? zone.name : '—'} ${d.address ? '— ' + d.address : ''}</p>
        <div class="dr-cash"><span>تحصيل</span><strong>${moneyNum(d.collect || d.total)}</strong></div>
        <button class="btn btn-primary btn-block" onclick="driverClaim('${d.id}')"><i class="bi bi-hand-index"></i> أخذ هذا الطلب</button>
    </article>`;
}

function driverTodayHtml(list) {
    if (!list.length) return `<div class="cm-empty"><i class="bi bi-calendar"></i><p>لا طلبات اليوم بعد</p></div>`;
    return list.map(d => {
        const st = DELIVERY_STATUS[d.status] || DELIVERY_STATUS.pending;
        return `<div class="dr-row">
            <div><b>#${d.orderNumber}</b><small>${d.customerName} • ${fmtTime(d.createdAt)}</small></div>
            <span class="badge ${st.cls}">${st.label}</span>
        </div>`;
    }).join('');
}

function driverProfileHtml(s, today, done, cash, comm) {
    return `<div class="dr-me">
        <div class="dr-avatar"><i class="bi bi-person-vcard"></i></div>
        <h2>${_drUser.name}</h2>
        <p>${_drUser.vehicle || ''} ${_drUser.plate ? '• ' + _drUser.plate : ''}</p>
        <p style="direction:ltr">${_drUser.phone || ''}</p>
        <div class="cm-box">
            <div class="cm-line"><span>عمولة الطلب</span><strong>${moneyNum(_drUser.commission)}</strong></div>
            <div class="cm-line"><span>طلبات اليوم</span><strong>${today.length}</strong></div>
            <div class="cm-line"><span>مُسلّمة</span><strong>${done.length}</strong></div>
            <div class="cm-line"><span>عمولة اليوم</span><strong>${moneyNum(comm)}</strong></div>
            <div class="cm-line grand"><span>كاش غير مسوّى</span><strong>${moneyNum(cash)}</strong></div>
        </div>
        <p class="cm-note">سلّم الكاش للمدير من صفحة التوصيل ← تسوية الصندوق.</p>
        <p class="cm-muted">${s.restaurantName}</p>
    </div>`;
}

function driverClaim(id) {
    if (!_drUser) return;
    api.assignDriver(id, _drUser.id);
    toast('أخذت الطلب — يالله انطلق', 'success');
    renderDriverApp();
}
function driverStart(id) {
    api.setDeliveryStatus(id, 'onway');
    toast('تم تسجيل الانطلاق 🚗', 'info');
    renderDriverApp();
}
function driverFail(id) {
    if (!confirmAction('تعذّر تسليم هذا الطلب؟')) return;
    api.setDeliveryStatus(id, 'failed');
    toast('سُجّل تعذّر التسليم', 'warning');
    renderDriverApp();
}
function driverDeliver(id) {
    const d = getDelivery(id); if (!d) return;
    openModalContent('تأكيد التسليم', `
        <div class="field"><label>استلم من؟</label>
            <input class="input" id="dlRecv" value="${d.customerName || ''}"></div>
        ${d.collect ? `<div class="field"><label>المبلغ المحصّل</label>
            <input class="input" id="dlGot" type="number" value="${d.collect}"></div>` : ''}
        <div class="field"><label>ملاحظة</label><input class="input" id="dlNote2" value="${d.note || ''}"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-success" style="flex:1" onclick="confirmDriverDeliver('${id}')"><i class="bi bi-check2"></i> تأكيد</button>`);
}
function confirmDriverDeliver(id) {
    const d = getDelivery(id); if (!d) return;
    d.receivedBy = document.getElementById('dlRecv')?.value.trim() || d.customerName;
    d.note = document.getElementById('dlNote2')?.value.trim() || d.note;
    const got = document.getElementById('dlGot');
    if (got) { d.collect = Number(got.value) || d.collect; d.collected = true; }
    api.setDeliveryStatus(id, 'delivered');
    closeModal('dynModal');
    toast('تم التسليم ✅', 'success');
    renderDriverApp();
}
