/* ============================================
   المستخدمون والصلاحيات — لوحة المدير
   ============================================ */

const AVATARS = ['👑', '🧑‍🍳', '👨‍💼', '👩‍💼', '🧔', '👨‍🔧', '👩‍🍳', '🕴️', '🧑‍💻', '🦸'];

function renderUsers() {
    const wrap = document.getElementById('usersContainer');
    if (!wrap) return;
    const users = getUsers();

    wrap.innerHTML = `
        <div class="stats-grid">
            <div class="stat"><i class="bi bi-people stat-icon"></i><div class="stat-label">إجمالي المستخدمين</div><div class="stat-value">${users.length}</div></div>
            <div class="stat"><i class="bi bi-shield-lock stat-icon"></i><div class="stat-label">المدراء</div><div class="stat-value">${users.filter(u => u.role === 'admin').length}</div></div>
            <div class="stat green"><i class="bi bi-person-check stat-icon" style="color:rgba(22,163,74,.1)"></i><div class="stat-label">حسابات نشطة</div><div class="stat-value">${users.filter(u => u.active !== false).length}</div></div>
            <div class="stat gold"><i class="bi bi-key stat-icon" style="color:rgba(212,175,55,.1)"></i><div class="stat-label">عدد الصلاحيات</div><div class="stat-value">${PERMS.length}</div></div>
        </div>

        <div class="toolbar">
            <div class="filter-pills"><span class="pill active"><i class="bi bi-people-fill"></i> فريق العمل</span></div>
            <div class="spacer"></div>
            <button class="btn btn-primary" data-perm="users" onclick="guard('users', () => openUserForm())"><i class="bi bi-person-plus"></i> مستخدم جديد</button>
        </div>

        <div class="users-grid">
            ${users.map(u => {
                const p = effectivePerms(u);
                const granted = PERM_KEYS.filter(k => p[k]).length;
                const me = currentUser() && currentUser().id === u.id;
                return `
                <div class="user-card ${u.active === false ? 'off' : ''}">
                    <div class="uc-avatar">${u.avatar || '🧑'}</div>
                    <div class="uc-name">${u.name} ${me ? '<span class="badge badge-success" style="font-size:10px">أنت</span>' : ''}</div>
                    <span class="badge ${ROLE_BADGE[u.role] || 'badge-dark'}">${ROLE_LABEL[u.role] || u.role}</span>
                    <div class="uc-job">${u.jobTitle || ''}</div>
                    <div class="uc-perm-bar"><div style="width:${Math.round(granted / PERM_KEYS.length * 100)}%"></div></div>
                    <div class="uc-perm-txt">${granted} من ${PERM_KEYS.length} صلاحية</div>
                    <div class="uc-meta">
                        <span><i class="bi bi-key"></i> رمز: ${'•'.repeat(String(u.pin || '').length)}</span>
                        <span><i class="bi bi-clock-history"></i> ${u.lastLogin ? fmtDate(u.lastLogin) : 'لم يدخل بعد'}</span>
                    </div>
                    <div class="uc-actions">
                        <button class="btn btn-light btn-sm" data-perm="users" onclick="guard('users', () => openPermsEditor('${u.id}'))"><i class="bi bi-sliders"></i> الصلاحيات</button>
                        <button class="btn btn-light btn-sm" data-perm="users" onclick="guard('users', () => openUserForm('${u.id}'))"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-danger btn-sm" data-perm="users" onclick="guard('users', () => delUser('${u.id}'))"><i class="bi bi-trash"></i></button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    applyPermissions();
}

function openUserForm(id) {
    const u = id ? getUser(id) : null;
    openModalContent(u ? `تعديل: ${u.name}` : 'مستخدم جديد', `
        <div class="row-flex">
            <div class="field" style="flex:2"><label>الاسم الكامل</label><input class="input" id="usName" value="${u?.name || ''}" placeholder="اسم الموظف"></div>
            <div class="field" style="flex:1"><label>المسمى الوظيفي</label><input class="input" id="usJob" value="${u?.jobTitle || ''}" placeholder="كاشير"></div>
        </div>
        <div class="field"><label>الصورة الرمزية</label>
            <div class="filter-pills" id="usAvatars">
                ${AVATARS.map(a => `<span class="pill avatar-pill ${((u?.avatar) || '🧑‍🍳') === a ? 'active' : ''}" data-a="${a}" onclick="pickAvatar(this)" style="font-size:19px">${a}</span>`).join('')}
            </div>
        </div>
        <div class="row-flex">
            <div class="field" style="flex:1"><label>الدور</label>
                <select class="input" id="usRole" onchange="onRoleChange()">
                    ${Object.entries(ROLE_LABEL).map(([k, l]) => `<option value="${k}" ${u?.role === k ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
            </div>
            <div class="field" style="flex:1"><label>الرمز السري (PIN)</label>
                <input class="input" id="usPin" value="${u?.pin || ''}" inputmode="numeric" placeholder="4 أرقام" style="letter-spacing:6px;text-align:center"></div>
        </div>
        <div class="toggle-row"><div class="tr-info"><h5>الحساب نشط</h5><p>يستطيع تسجيل الدخول للنظام</p></div>
            <label class="switch"><input type="checkbox" id="usActive" ${u ? (u.active !== false ? 'checked' : '') : 'checked'}><span class="slider-sw"></span></label></div>
        <div id="roleHint" class="role-hint"></div>
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-success" style="flex:1" onclick="saveUser(${u ? `'${u.id}'` : 'null'})"><i class="bi bi-check2-circle"></i> حفظ المستخدم</button>`, 'lg');
    onRoleChange();
}
function pickAvatar(el) {
    document.querySelectorAll('#usAvatars .avatar-pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
}
function onRoleChange() {
    const role = document.getElementById('usRole')?.value;
    const box = document.getElementById('roleHint');
    if (!box) return;
    const p = ROLE_DEFAULTS[role] || {};
    const granted = PERM_KEYS.filter(k => p[k]);
    box.innerHTML = `<i class="bi bi-info-circle"></i> الدور <strong>${ROLE_LABEL[role]}</strong> يمنح افتراضياً ${granted.length} صلاحية
        ${role === 'admin' ? '— صلاحيات كاملة على النظام بما فيها التصفير والحذف.' : '— يمكنك تخصيصها بعد الحفظ من زر «الصلاحيات».'}`;
}
function saveUser(id) {
    const name = document.getElementById('usName').value.trim();
    const pin = document.getElementById('usPin').value.trim();
    if (!name) { toast('أدخل اسم المستخدم', 'error'); return; }
    if (!/^\d{3,6}$/.test(pin)) { toast('الرمز السري يجب أن يكون من 3 إلى 6 أرقام', 'error'); return; }
    const role = document.getElementById('usRole').value;
    const data = {
        name, pin, role,
        jobTitle: document.getElementById('usJob').value.trim() || ROLE_LABEL[role],
        avatar: document.querySelector('#usAvatars .avatar-pill.active')?.dataset.a || '🧑‍🍳',
        active: document.getElementById('usActive').checked
    };
    if (id) api.updateUser(id, data);
    else { const u = api.addUser({ ...data, perms: { ...(ROLE_DEFAULTS[role] || {}) } }); }
    closeModal('dynModal');
    renderUsers();
    applyPermissions();
    toast('تم حفظ المستخدم ✅', 'success');
}
function delUser(id) {
    const u = getUser(id);
    if (!confirmAction(`حذف المستخدم «${u?.name}»؟`)) return;
    if (api.deleteUser(id)) { renderUsers(); toast('تم حذف المستخدم', 'success'); }
}

/* ----- محرّر الصلاحيات ----- */
function openPermsEditor(id) {
    const u = getUser(id); if (!u) return;
    const p = effectivePerms(u);
    const groups = [...new Set(PERMS.map(x => x.group))];
    openModalContent(`صلاحيات: ${u.name}`, `
        ${u.role === 'admin' ? `<div class="role-hint" style="background:#fee2e2;color:#b91c1c"><i class="bi bi-shield-lock-fill"></i> هذا الحساب مدير نظام — يملك جميع الصلاحيات تلقائياً ولا يمكن تقييده.</div>` : ''}
        <div class="row-flex" style="margin-bottom:10px">
            <button class="btn btn-light btn-sm" onclick="togglePermsAll(true)"><i class="bi bi-check-all"></i> منح الكل</button>
            <button class="btn btn-light btn-sm" onclick="togglePermsAll(false)"><i class="bi bi-x-lg"></i> سحب الكل</button>
            <button class="btn btn-light btn-sm" onclick="applyRoleDefaults('${u.role}')"><i class="bi bi-arrow-counterclockwise"></i> افتراضي الدور</button>
        </div>
        ${groups.map(g => `
            <div class="perm-group">
                <div class="pg-title">${g}</div>
                ${PERMS.filter(x => x.group === g).map(x => `
                    <div class="toggle-row perm-row">
                        <div class="tr-info"><h5><i class="bi ${x.icon}"></i> ${x.label}</h5><p>${x.desc}</p></div>
                        <label class="switch"><input type="checkbox" class="perm-cb" data-key="${x.key}" ${p[x.key] ? 'checked' : ''} ${u.role === 'admin' ? 'disabled' : ''}><span class="slider-sw"></span></label>
                    </div>`).join('')}
            </div>`).join('')}
    `, `<button class="btn btn-ghost" onclick="closeModal('dynModal')">إلغاء</button>
        <button class="btn btn-success" style="flex:1" onclick="savePerms('${u.id}')"><i class="bi bi-shield-check"></i> حفظ الصلاحيات</button>`, 'lg');
}
function togglePermsAll(v) { document.querySelectorAll('.perm-cb:not([disabled])').forEach(cb => cb.checked = v); }
function applyRoleDefaults(role) {
    const d = ROLE_DEFAULTS[role] || {};
    document.querySelectorAll('.perm-cb:not([disabled])').forEach(cb => cb.checked = !!d[cb.dataset.key]);
}
function savePerms(id) {
    const perms = {};
    document.querySelectorAll('.perm-cb').forEach(cb => perms[cb.dataset.key] = cb.checked);
    api.updateUser(id, { perms });
    closeModal('dynModal');
    renderUsers();
    // إذا كان المستخدم الحالي، حدّث الواجهة فوراً
    if (currentUser() && currentUser().id === id) applyPermissions();
    toast('تم تحديث الصلاحيات 🔐', 'success');
}
