/* ============================================
   الإعدادات — تحكم كامل + الطباعة و PDF
   ============================================ */

function renderSettings() {
    const wrap = document.getElementById('settingsContainer');
    if (!wrap) return;
    const s = getSettings();

    wrap.innerHTML = `
        <div class="grid" style="grid-template-columns:2fr 1fr;gap:18px;align-items:start">

        <!-- القسم الأيمن: النماذج -->
        <div>

        <!-- هوية المطعم -->
        <div class="card card-pad settings-section">
            <div class="ss-title"><i class="bi bi-shop"></i> هوية المطعم</div>
            <div class="row-flex" style="align-items:flex-start">
                <div style="flex:1;min-width:180px">
                    <div class="field"><label>شعار المطعم</label>
                        <div class="img-upload" id="logoBox" style="aspect-ratio:1/1">
                            ${s.restaurantLogo ? `<img src="${s.restaurantLogo}"><button class="clear-img" onclick="event.stopPropagation();clearSettingImg('restaurantLogo')"><i class="bi bi-x"></i></button>` : `<i class="bi bi-image"></i><span>رفع الشعار</span>`}
                            <input type="file" accept="image/*" hidden>
                        </div>
                    </div>
                </div>
                <div style="flex:2;min-width:240px">
                    <div class="field"><label>اسم المطعم</label><input class="input" id="setRestName" value="${s.restaurantName}"></div>
                    <div class="field"><label>الشعار النصي (Slogan)</label><input class="input" id="setSlogan" value="${s.slogan}"></div>
                </div>
            </div>
            <div class="field"><label>رقم الهاتف</label><input class="input" id="setPhone" value="${s.phone}" style="direction:ltr;text-align:right"></div>
            <div class="field"><label>العنوان</label><input class="input" id="setAddress" value="${s.address}"></div>
        </div>

        <!-- الكاشير -->
        <div class="card card-pad settings-section">
            <div class="ss-title"><i class="bi bi-person-badge"></i> بيانات الكاشير</div>
            <div class="row-flex">
                <div class="field" style="flex:1"><label>اسم الكاشير</label><input class="input" id="setCashierName" value="${s.cashierName}"></div>
                <div class="field" style="flex:1"><label>المسمى الوظيفي</label><input class="input" id="setCashierRole" value="${s.cashierRole}"></div>
            </div>
        </div>

        <!-- المالية والضرائب -->
        <div class="card card-pad settings-section">
            <div class="ss-title"><i class="bi bi-cash-coin"></i> الإعدادات المالية</div>
            <div class="row-flex">
                <div class="field" style="flex:1"><label>العملة</label><input class="input" id="setCurrency" value="${s.currency}"></div>
                <div class="field" style="flex:1"><label>نسبة الضريبة %</label><input class="input" id="setTax" type="number" value="${s.taxRate}"></div>
                <div class="field" style="flex:1"><label>رسوم الخدمة %</label><input class="input" id="setService" type="number" value="${s.serviceCharge}"></div>
            </div>
            <div class="toggle-row"><div class="tr-info"><h5>تفعيل الضريبة</h5><p>إضافة ضريبة لكل طلب</p></div>
                <label class="switch"><input type="checkbox" id="setEnableTax" ${s.enableTax ? 'checked' : ''}><span class="slider-sw"></span></label></div>
            <div class="toggle-row"><div class="tr-info"><h5>نظام نقاط الولاء</h5><p>منح نقاط للعملاء عند الشراء</p></div>
                <label class="switch"><input type="checkbox" id="setEnablePoints" ${s.enablePoints ? 'checked' : ''}><span class="slider-sw"></span></label></div>
            <div class="field"><label>نقطة لكل (دينار)</label><input class="input" id="setPointsPer" type="number" value="${s.pointsPerDinar}"></div>
        </div>

        <!-- الإيصال -->
        <div class="card card-pad settings-section">
            <div class="ss-title"><i class="bi bi-receipt"></i> إعدادات الإيصال</div>
            <div class="field"><label>رسالة أسفل الإيصال</label><input class="input" id="setFooter" value="${s.footerMessage}"></div>
            <div class="field"><label>كلمة ختامية على الإيصال</label><input class="input" id="setReceiptFoot" value="${s.receiptFooter}"></div>
            <div class="toggle-row"><div class="tr-info"><h5>طباعة تلقائية</h5><p>طباعة الإيصال فور إتمام الطلب</p></div>
                <label class="switch"><input type="checkbox" id="setPrintAuto" ${s.printAuto ? 'checked' : ''}><span class="slider-sw"></span></label></div>
        </div>

        <!-- إدارة النظام -->
        <div class="card card-pad settings-section">
            <div class="ss-title"><i class="bi bi-gear-wide-connected"></i> إدارة النظام</div>
            <div class="row-flex">
                <button class="btn btn-light" onclick="backupData()"><i class="bi bi-download"></i> نسخة احتياطية (JSON)</button>
                <button class="btn btn-light" onclick="document.getElementById('restoreFile').click()"><i class="bi bi-upload"></i> استعادة نسخة</button>
                <input type="file" id="restoreFile" accept="application/json" hidden onchange="restoreData(event)">
            </div>
            <div style="margin-top:14px">
                <button class="btn btn-danger" onclick="resetSystem()"><i class="bi bi-arrow-counterclockwise"></i> إعادة تعيين النظام بالكامل</button>
            </div>
        </div>
        </div>

        <!-- القسم الأيسر: حفظ ومعاينة -->
        <div style="position:sticky;top:88px">
            <div class="card card-pad">
                <h3 style="font-size:15px;font-weight:800;margin-bottom:14px"><i class="bi bi-check2-square" style="color:var(--success)"></i> حفظ التغييرات</h3>
                <p style="font-size:12.5px;color:var(--muted);margin-bottom:14px">ستُطبّق كل التغييرات فوراً على النظام بالكامل.</p>
                <button class="btn btn-success btn-lg btn-block" onclick="saveAllSettings()"><i class="bi bi-check2-circle"></i> حفظ الإعدادات</button>
                <hr style="border:none;border-top:1px solid var(--border);margin:18px 0">
                <h3 style="font-size:14px;font-weight:800;margin-bottom:10px"><i class="bi bi-info-circle" style="color:var(--info)"></i> معلومات النظام</h3>
                <div style="font-size:12.5px;line-height:2">
                    <div class="totals-row"><span>عدد المنتجات</span><strong>${getProducts().length}</strong></div>
                    <div class="totals-row"><span>عدد الأقسام</span><strong>${getCategories().length}</strong></div>
                    <div class="totals-row"><span>عدد العملاء</span><strong>${getCustomers().length}</strong></div>
                    <div class="totals-row"><span>إجمالي الطلبات</span><strong>${getOrders().length}</strong></div>
                    <div class="totals-row"><span>تاريخ التشغيل</span><strong style="font-size:11px">${fmtDate(DB.meta.createdAt)}</strong></div>
                </div>
            </div>
        </div>
        </div>`;

    // ربط رفع الشعار
    bindImageUpload('#logoBox', (box, data) => {
        window._settingLogo = data;
        box.innerHTML = `<img src="${data}"><button class="clear-img" onclick="event.stopPropagation();clearSettingImg('restaurantLogo')"><i class="bi bi-x"></i></button><input type="file" accept="image/*" hidden>`;
    });
}
function clearSettingImg(key) {
    if (key === 'restaurantLogo') window._settingLogo = '';
    const box = document.getElementById('logoBox');
    if (box) box.innerHTML = `<i class="bi bi-image"></i><span>رفع الشعار</span><input type="file" accept="image/*" hidden>`;
}

function saveAllSettings() {
    const s = getSettings();
    s.restaurantName = val('setRestName', s.restaurantName);
    s.slogan = val('setSlogan', s.slogan);
    s.phone = val('setPhone', s.phone);
    s.address = val('setAddress', s.address);
    s.cashierName = val('setCashierName', s.cashierName);
    s.cashierRole = val('setCashierRole', s.cashierRole);
    s.currency = val('setCurrency', s.currency);
    s.taxRate = Number(val('setTax', s.taxRate)) || 0;
    s.serviceCharge = Number(val('setService', s.serviceCharge)) || 0;
    s.enableTax = document.getElementById('setEnableTax').checked;
    s.enablePoints = document.getElementById('setEnablePoints').checked;
    s.pointsPerDinar = Number(val('setPointsPer', s.pointsPerDinar)) || 1;
    s.footerMessage = val('setFooter', s.footerMessage);
    s.receiptFooter = val('setReceiptFoot', s.receiptFooter);
    s.printAuto = document.getElementById('setPrintAuto').checked;
    if (window._settingLogo !== undefined) s.restaurantLogo = window._settingLogo;
    persist();
    window._settingLogo = undefined;
    refreshBranding();
    toast('تم حفظ الإعدادات بنجاح ✅', 'success');
}
function val(id, fallback) { const el = document.getElementById(id); return el ? el.value.trim() || fallback : fallback; }

/* ----- نسخ احتياطي / استعادة ----- */
function backupData() {
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup-cashier-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast('تم تنزيل النسخة الاحتياطية', 'success');
}
function restoreData(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (!data.settings || !data.products) throw new Error('ملف غير صالح');
            if (!confirmAction('سيتم استبدال جميع البيانات الحالية. متابعة؟')) return;
            DB = data; persist();
            toast('تمت الاستعادة بنجاح', 'success');
            refreshBranding();
            setTimeout(() => location.reload(), 800);
        } catch (err) { toast('ملف النسخة الاحتياطية غير صالح', 'error'); }
    };
    reader.readAsText(file);
}
function resetSystem() {
    if (!confirmAction('⚠️ سيتم حذف جميع البيانات (الطلبات، العملاء، المنتجات) والعودة للوضع الافتراضي. متابعة؟')) return;
    api.resetAll();
    refreshBranding();
    toast('تمت إعادة التعيين', 'success');
    setTimeout(() => location.reload(), 800);
}

/* ============================================
   الطباعة — إيصال POS + تقارير PDF
   ============================================ */

const PAY_LABEL = { cash: 'كاش', card: 'بطاقة', online: 'إلكتروني' };

/* إيصال POS مفصّل ورهيب */
function showReceipt(orderId) {
    const o = getOrder(orderId);
    if (!o) return;
    const s = getSettings();
    const logo = s.restaurantLogo
        ? `<img src="${s.restaurantLogo}" alt="">`
        : `<span style="font-size:32px">🍽️</span>`;

    const itemsHtml = o.items.map(i => `
        <div class="ri-row">
            <span class="ri-name">${i.name}</span>
            <span class="ri-qty">${i.qty} ×</span>
            <span class="ri-amt">${moneyNum(i.price * i.qty)}</span>
        </div>
        ${i.qty > 1 ? `<div class="ri-row" style="font-size:10.5px;color:#777;padding-top:0"><span class="ri-name"></span><span class="ri-qty">${moneyNum(i.price)} للوحدة</span><span class="ri-amt"></span></div>` : ''}
    `).join('');

    const html = `
    <div class="receipt">
        <div class="receipt-body">
            <div class="receipt-head">
                <div class="r-logo">${logo}</div>
                <h2>${s.restaurantName}</h2>
                <p>${s.slogan}</p>
                <p style="margin-top:6px">📞 ${s.phone}</p>
                <p>📍 ${s.address}</p>
            </div>
            <div class="receipt-meta">
                <div><span>رقم الطلب:</span><strong>#${o.number}</strong></div>
                <div><span>التاريخ:</span><strong>${fmtDateTime(o.createdAt)}</strong></div>
                <div><span>العميل:</span><strong>${o.customerName}</strong></div>
                ${o.customerPhone !== '-' ? `<div><span>الهاتف:</span><strong style="direction:ltr">${o.customerPhone}</strong></div>` : ''}
                <div><span>النوع:</span><strong>${o.orderTypeLabel}</strong></div>
                <div><span>الكاشير:</span><strong>${o.cashierName || '-'}</strong></div>
                <div><span>الدفع:</span><strong>${PAY_LABEL[o.paymentMethod] || 'كاش'}</strong></div>
            </div>
            <div class="receipt-items">${itemsHtml}</div>
            <div class="receipt-totals">
                <div class="rt-row"><span>المجموع الفرعي</span><span>${moneyNum(o.subtotal)}</span></div>
                ${o.tax ? `<div class="rt-row"><span>الضريبة</span><span>${moneyNum(o.tax)}</span></div>` : ''}
                ${o.service ? `<div class="rt-row"><span>رسوم خدمة</span><span>${moneyNum(o.service)}</span></div>` : ''}
                ${o.discount ? `<div class="rt-row"><span>الخصم</span><span style="color:#16a34a">− ${moneyNum(o.discount)}</span></div>` : ''}
                <div class="rt-row rt-grand"><span>الإجمالي</span><span>${moneyNum(o.total)}</span></div>
                ${o.paymentMethod === 'cash' ? `
                    <div class="rt-row"><span>المدفوع</span><span>${moneyNum(o.paid)}</span></div>
                    <div class="rt-row"><span>الباقي</span><span style="color:#16a34a">${moneyNum(o.change)}</span></div>
                ` : ''}
            </div>
            ${o.notes ? `<div style="margin-top:10px;padding:8px;border:1px dashed #999;border-radius:6px;font-size:11.5px"><strong>ملاحظات:</strong> ${o.notes}</div>` : ''}
            <div class="receipt-foot">
                <div style="font-weight:800;font-size:14px;color:#000;margin-bottom:4px">شكراً لكم 🌹</div>
                <p>${s.receiptFooter}</p>
                <p style="margin-top:8px;font-size:10px;color:#999">${s.footerMessage}</p>
                <div style="margin-top:6px;font-family:monospace;font-size:11px;letter-spacing:3px">*${o.number}*</div>
                <div style="margin-top:6px;font-size:9px;color:#bbb">Powered by Iraqi Cashier System</div>
            </div>
        </div>
    </div>`;

    openModalContent(`إيصال الطلب #${o.number}`, html, `
        <button class="btn btn-ghost" onclick="closeModal('dynModal')">إغلاق</button>
        <button class="btn btn-dark" onclick="printElement(document.querySelector('#dynModal .receipt').outerHTML, 'receipt')"><i class="bi bi-printer"></i> طباعة / حفظ PDF</button>
    `, 'sm');
}

/* طباعة عامة (إيصال أو تقرير) في نافذة منفصلة */
function printElement(innerHTML, mode = 'report') {
    const s = getSettings();
    const logo = s.restaurantLogo;
    const w = window.open('', '_blank', 'width=420,height=720');
    if (!w) { toast('اسمح بالنوافذ المنبثقة للطباعة', 'warning'); return; }

    const receiptCss = `
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Cairo','Tajawal',Tahoma,sans-serif; background:#fff; color:#000; }
        .receipt { width:300px; margin:0 auto; padding:8px 4px; }
        .receipt-head { text-align:center; padding-bottom:10px; border-bottom:2px dashed #555; margin-bottom:10px; }
        .r-logo { width:54px; height:54px; border-radius:12px; margin:0 auto 6px; background:#c1272d; display:flex; align-items:center; justify-content:center; font-size:26px; overflow:hidden; }
        .r-logo img { width:100%; height:100%; object-fit:cover; }
        .receipt-head h2 { font-size:16px; }
        .receipt-head p { font-size:10.5px; color:#333; margin-top:2px; }
        .receipt-meta { font-size:11px; margin-bottom:8px; }
        .receipt-meta div { display:flex; justify-content:space-between; padding:1.5px 0; }
        .receipt-items { border-top:2px dashed #555; border-bottom:2px dashed #555; padding:6px 0; margin-bottom:8px; }
        .ri-row { display:flex; font-size:11.5px; padding:2.5px 0; gap:5px; }
        .ri-name { flex:1; font-weight:700; }
        .ri-amt { min-width:55px; text-align:left; font-weight:700; }
        .receipt-totals { font-size:12px; }
        .receipt-totals .rt-row { display:flex; justify-content:space-between; padding:2px 0; }
        .receipt-totals .rt-grand { margin-top:5px; padding-top:5px; border-top:2px solid #000; font-size:15px; font-weight:800; }
        .receipt-foot { text-align:center; margin-top:10px; padding-top:8px; border-top:2px dashed #555; font-size:11px; }
    `;

    const reportCss = `
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Cairo','Tajawal',Tahoma,sans-serif; background:#fff; color:#111; padding:20px; }
        .report-print-doc { max-width:800px; margin:0 auto; }
        .rpd-head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #c1272d; padding-bottom:14px; margin-bottom:18px; }
        .rpd-head h1 { font-size:22px; color:#8a1a1f; }
        .rpd-head p { font-size:11.5px; color:#555; }
        .rpd-rest { display:flex; align-items:center; gap:12px; }
        .rpd-rest-logo { width:56px; height:56px; border-radius:12px; background:#c1272d; display:flex; align-items:center; justify-content:center; font-size:28px; overflow:hidden; }
        .rpd-rest-logo img { width:100%; height:100%; object-fit:cover; }
        .rpd-meta { text-align:left; font-size:11.5px; }
        .rpd-meta h3 { font-size:16px; color:#8a1a1f; }
        .rpd-title { font-size:15px; font-weight:800; background:#f5ebd9; padding:9px 12px; border-radius:7px; margin:16px 0 10px; border-right:4px solid #c1272d; }
        .rpd-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
        .rpd-stat { border:1px solid #ddd; border-radius:7px; padding:10px; text-align:center; }
        .rpd-stat .v { font-size:18px; font-weight:800; color:#8a1a1f; }
        .rpd-stat .l { font-size:10.5px; color:#666; }
        table { width:100%; border-collapse:collapse; font-size:11.5px; margin:8px 0; }
        th { background:#1a1410; color:#fff; padding:7px; text-align:right; }
        td { padding:6px 7px; border-bottom:1px solid #eee; }
        .rpd-foot { margin-top:22px; padding-top:10px; border-top:1px solid #ddd; text-align:center; font-size:10.5px; color:#777; }
        @page { margin:10mm; }
    `;

    w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
    <title>طباعة</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>${mode === 'receipt' ? receiptCss : reportCss}</style></head>
    <body>${innerHTML.replace(/onclick="[^"]*"/g, '')}
    <script>window.onload=function(){setTimeout(function(){window.print();},350);};<\/script>
    </body></html>`);
    w.document.close();
}

/* ===== ملفات PDF لكل قسم ===== */
function reportShell(title, bodyHtml, subtitle = '') {
    const s = getSettings();
    const logo = s.restaurantLogo
        ? `<img src="${s.restaurantLogo}">`
        : `<span>🍽️</span>`;
    return `<div class="report-print-doc">
        <div class="rpd-head">
            <div class="rpd-rest">
                <div class="rpd-rest-logo">${logo}</div>
                <div>
                    <h1>${s.restaurantName}</h1>
                    <p>📍 ${s.address}</p>
                    <p>📞 ${s.phone} • ${s.slogan}</p>
                </div>
            </div>
            <div class="rpd-meta">
                <h3>${title}</h3>
                <p>${subtitle || 'تقرير شامل'}</p>
                <p>التاريخ: ${fmtDateTime(Date.now())}</p>
                <p>الكاشير: ${s.cashierName}</p>
            </div>
        </div>
        ${bodyHtml}
        <div class="rpd-foot">
            ${s.footerMessage} — تم الإنشاء بواسطة نظام الكاشير العراقي
        </div>
    </div>`;
}

function exportOrdersPDF() {
    const orders = getOrders();
    const body = `
        <div class="rpd-stats">
            <div class="rpd-stat"><div class="v">${orders.length}</div><div class="l">إجمالي الطلبات</div></div>
            <div class="rpd-stat"><div class="v">${orders.filter(o=>o.status==='completed').length}</div><div class="l">مكتملة</div></div>
            <div class="rpd-stat"><div class="v">${orders.filter(o=>o.status==='preparing'||o.status==='pending').length}</div><div class="l">قيد التنفيذ</div></div>
            <div class="rpd-stat"><div class="v">${moneyNum(orders.reduce((s,o)=>s+o.total,0))}</div><div class="l">إجمالي القيمة</div></div>
        </div>
        <div class="rpd-title">قائمة الطلبات</div>
        <table>
            <thead><tr><th>#</th><th>العميل</th><th>النوع</th><th>الدفع</th><th>التاريخ</th><th>الحالة</th><th>الإجمالي</th></tr></thead>
            <tbody>${orders.map(o => `<tr>
                <td>${o.number}</td><td>${o.customerName}</td><td>${o.orderTypeLabel}</td>
                <td>${PAY_LABEL[o.paymentMethod]}</td><td>${fmtDateTime(o.createdAt)}</td>
                <td>${(STATUS_MAP[o.status]||STATUS_MAP.pending).label}</td>
                <td>${moneyNum(o.total)}</td></tr>`).join('')}
            </tbody>
        </table>`;
    printElement(reportShell('تقرير الطلبات', body, `قاعدة بيانات الطلبات (${orders.length} طلب)`), 'report');
}

function exportSalesPDF(range) {
    const { records, totals } = computeSales(range);
    const rangeLabel = { today: 'اليوم', week: 'آخر 7 أيام', month: 'هذا الشهر', all: 'كل الفترات' }[range];
    const body = `
        <div class="rpd-stats">
            <div class="rpd-stat"><div class="v">${moneyNum(totals.revenue)}</div><div class="l">إجمالي المبيعات</div></div>
            <div class="rpd-stat"><div class="v">${totals.count}</div><div class="l">عدد الفواتير</div></div>
            <div class="rpd-stat"><div class="v">${moneyNum(totals.count?Math.round(totals.revenue/totals.count):0)}</div><div class="l">متوسط الفاتورة</div></div>
            <div class="rpd-stat"><div class="v">${moneyNum(totals.discount)}</div><div class="l">الخصومات</div></div>
        </div>
        <div class="rpd-title">تفاصيل المبيعات — ${rangeLabel}</div>
        <table>
            <thead><tr><th>#</th><th>التاريخ</th><th>العميل</th><th>النوع</th><th>الدفع</th><th>الخصم</th><th>الإجمالي</th></tr></thead>
            <tbody>${records.map(o => `<tr>
                <td>${o.number}</td><td>${fmtDateTime(o.createdAt)}</td><td>${o.customerName}</td>
                <td>${o.orderTypeLabel}</td><td>${PAY_LABEL[o.paymentMethod]}</td>
                <td>${o.discount ? '−'+moneyNum(o.discount) : '—'}</td><td>${moneyNum(o.total)}</td></tr>`).join('')}
            ${records.length ? `<tr style="font-weight:800;background:#f5ebd9"><td colspan="6">الإجمالي</td><td>${moneyNum(totals.revenue)}</td></tr>` : ''}
            </tbody>
        </table>`;
    printElement(reportShell('تقرير المبيعات', body, `فترة: ${rangeLabel}`), 'report');
}

function exportProductsPDF() {
    const cats = getCategories();
    const body = cats.map(c => {
        const prods = getProducts().filter(p => p.categoryId === c.id);
        if (!prods.length) return '';
        return `<div class="rpd-title">${c.icon} ${c.name} (${prods.length})</div>
        <table><thead><tr><th>المنتج</th><th>الوصف</th><th>السعر</th><th>الحالة</th></tr></thead>
        <tbody>${prods.map(p => `<tr>
            <td><strong>${p.name}</strong></td><td>${p.description || '—'}</td>
            <td>${moneyNum(p.price)}</td><td>${p.available ? 'متوفر' : 'غير متوفر'}</td></tr>`).join('')}
        </tbody></table>`;
    }).join('');
    printElement(reportShell('قائمة الطعام (Menu)', body, `${getProducts().length} صنف ضمن ${cats.length} قسم`), 'report');
}

function exportCustomersPDF() {
    const customers = getCustomers().map(c => {
        const ords = getOrders().filter(o => o.customerId === c.id && o.status !== 'cancelled');
        return { ...c, count: ords.length, spent: ords.reduce((s, o) => s + o.total, 0) };
    });
    const body = `
        <div class="rpd-stats">
            <div class="rpd-stat"><div class="v">${customers.length}</div><div class="l">العملاء</div></div>
            <div class="rpd-stat"><div class="v">${moneyNum(customers.reduce((s,c)=>s+c.spent,0))}</div><div class="l">إجمالي الإنفاق</div></div>
            <div class="rpd-stat"><div class="v">${customers.reduce((s,c)=>s+(c.points||0),0)}</div><div class="l">نقاط الولاء</div></div>
            <div class="rpd-stat"><div class="v">${customers.reduce((s,c)=>s+c.count,0)}</div><div class="l">إجمالي الطلبات</div></div>
        </div>
        <div class="rpd-title">قاعدة بيانات العملاء</div>
        <table>
            <thead><tr><th>الاسم</th><th>الهاتف</th><th>النقاط</th><th>الطلبات</th><th>إجمالي الإنفاق</th></tr></thead>
            <tbody>${customers.map(c => `<tr>
                <td>${c.name}</td><td style="direction:ltr">${c.phone}</td>
                <td>${c.points || 0}</td><td>${c.count}</td><td>${moneyNum(c.spent)}</td></tr>`).join('')}
            </tbody>
        </table>`;
    printElement(reportShell('تقرير العملاء', body, `${customers.length} عميل`), 'report');
}

function exportTopProductsPDF() {
    const orders = getOrders().filter(o => o.status !== 'cancelled');
    const map = {};
    orders.forEach(o => o.items.forEach(i => {
        if (!map[i.productId]) map[i.productId] = { name: i.name, qty: 0, revenue: 0 };
        map[i.productId].qty += i.qty; map[i.productId].revenue += i.price * i.qty;
    }));
    const list = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    const body = `
        <div class="rpd-stats">
            <div class="rpd-stat"><div class="v">${list.length}</div><div class="l">منتجات مباعة</div></div>
            <div class="rpd-stat"><div class="v">${list.reduce((s,p)=>s+p.qty,0)}</div><div class="l">إجمالي الكميات</div></div>
            <div class="rpd-stat"><div class="v">${moneyNum(list.reduce((s,p)=>s+p.revenue,0))}</div><div class="l">إجمالي الإيرادات</div></div>
        </div>
        <div class="rpd-title">المنتجات الأكثر مبيعاً</div>
        <table>
            <thead><tr><th>#</th><th>المنتج</th><th>الكمية المباعة</th><th>الإيراد</th></tr></thead>
            <tbody>${list.map((p, i) => `<tr>
                <td>${i + 1}</td><td><strong>${p.name}</strong></td><td>${p.qty}</td><td>${moneyNum(p.revenue)}</td></tr>`).join('') || '<tr><td colspan="4">لا توجد مبيعات</td></tr>'}
            </tbody>
        </table>`;
    printElement(reportShell('تقرير المنتجات', body, 'تحليل أداء المنتجات'), 'report');
}

function exportFullReportPDF() {
    const orders = getOrders().filter(o => o.status !== 'cancelled');
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const cats = getCategories();
    const catData = cats.map(c => {
        const rev = orders.reduce((s, o) => s + o.items.filter(i => {
            const p = getProduct(i.productId); return p && p.categoryId === c.id;
        }).reduce((x, i) => x + i.price * i.qty, 0), 0);
        return { ...c, rev };
    }).filter(c => c.rev > 0).sort((a, b) => b.rev - a.rev);

    const map = {};
    orders.forEach(o => o.items.forEach(i => {
        if (!map[i.productId]) map[i.productId] = { name: i.name, qty: 0, revenue: 0 };
        map[i.productId].qty += i.qty; map[i.productId].revenue += i.price * i.qty;
    }));
    const top = Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 10);

    const body = `
        <div class="rpd-stats">
            <div class="rpd-stat"><div class="v">${moneyNum(revenue)}</div><div class="l">إجمالي الإيرادات</div></div>
            <div class="rpd-stat"><div class="v">${orders.length}</div><div class="l">الطلبات</div></div>
            <div class="rpd-stat"><div class="v">${moneyNum(orders.length?Math.round(revenue/orders.length):0)}</div><div class="l">متوسط الطلب</div></div>
            <div class="rpd-stat"><div class="v">${getProducts().length}</div><div class="l">المنتجات</div></div>
        </div>
        <div class="rpd-title">أداء الأقسام</div>
        <table><thead><tr><th>القسم</th><th>الإيراد</th><th>النسبة</th></tr></thead>
        <tbody>${catData.map(c => `<tr><td>${c.icon} ${c.name}</td><td>${moneyNum(c.rev)}</td><td>${revenue?Math.round(c.rev/revenue*100):0}%</td></tr>`).join('')}</tbody></table>
        <div class="rpd-title">أكثر 10 منتجات مبيعاً</div>
        <table><thead><tr><th>#</th><th>المنتج</th><th>الكمية</th><th>الإيراد</th></tr></thead>
        <tbody>${top.map((p, i) => `<tr><td>${i + 1}</td><td>${p.name}</td><td>${p.qty}</td><td>${moneyNum(p.revenue)}</td></tr>`).join('') || '<tr><td colspan="4">لا توجد مبيعات</td></tr>'}</tbody></table>
        <div class="rpd-title">ملخص طرق الدفع</div>
        <table><thead><tr><th>الطريقة</th><th>العدد</th><th>القيمة</th></tr></thead>
        <tbody>${['cash', 'card', 'online'].map(m => {
            const list = orders.filter(o => o.paymentMethod === m);
            return `<tr><td>${PAY_LABEL[m]}</td><td>${list.length}</td><td>${moneyNum(list.reduce((s,o)=>s+o.total,0))}</td></tr>`;
        }).join('')}</tbody></table>`;
    printElement(reportShell('التقرير الشامل', body, 'تحليل كامل لأداء المطعم'), 'report');
}
