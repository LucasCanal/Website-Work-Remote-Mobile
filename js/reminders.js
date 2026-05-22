// =============================================
// STATE
// =============================================

let remindersState = {
    completedToday: 0,
    snoozed: [],
};

// =============================================
// DATA LAYER
// =============================================

function getReminders() {
    if (window.store) return window.store.getReminders();
    const raw = localStorage.getItem('snap-reminders');
    if (raw) return JSON.parse(raw);
    // Default reminders
    return [
        { id: 1, title: "Meeting with Aline",     description: "Discuss the new landing page design system updates.", time: "10:30 AM", date: "today",    priority: "urgent", done: false, snoozed: false },
        { id: 2, title: "Push to Production",      description: "Final deployment of the CRUD Book Catalog.",          time: "02:00 PM", date: "today",    priority: "high",   done: false, snoozed: false },
        { id: 3, title: "Supabase Schema Sync",    description: "Verify migration scripts for the new Book Catalog relations.", time: "04:30 PM", date: "today", priority: "medium", done: false, snoozed: false },
        { id: 4, title: "Code Review: Fênix UI Core", description: "Perform deep audit on Framer Motion bottlenecks and CSS variables.", time: "09:00 AM", date: "tomorrow", priority: "low", done: false, snoozed: false },
    ];
}

function saveReminders(reminders) {
    if (window.store) {
        // sync with store
        reminders.forEach(r => {
            const existing = window.store.getReminderById(r.id);
            if (existing) window.store.updateReminder(r.id, r);
            else window.store.addReminder(r);
        });
    }
    localStorage.setItem('snap-reminders', JSON.stringify(reminders));
}

function getRemindersList() {
    return JSON.parse(localStorage.getItem('snap-reminders') || 'null') || getReminders();
}

// =============================================
// RENDER
// =============================================

function renderReminders() {
    const reminders = getRemindersList();
    const today     = reminders.filter(r => r.date === 'today'    && !r.done);
    const tomorrow  = reminders.filter(r => r.date === 'tomorrow' && !r.done);
    const snoozed   = reminders.filter(r => r.snoozed && !r.done);
    const done      = reminders.filter(r => r.done);

    // Update side stats
    const completedEl = document.querySelector('.reminders-stats .stat-mini:first-child strong');
    const pendingEl   = document.querySelector('.reminders-stats .stat-mini:last-child strong');
    if (completedEl) completedEl.textContent = done.length;
    if (pendingEl)   pendingEl.textContent   = today.length + tomorrow.length;

    // Update sidebar badge
    const badge = document.querySelector('.nav-item[data-section="reminders"] .nav-badge');
    if (badge) badge.textContent = today.length + tomorrow.length;

    // Render groups
    const mainEl = document.querySelector('.reminders-main');
    if (!mainEl) return;

    mainEl.innerHTML = `
        ${renderGroup('UPCOMING TODAY', today, 'today')}
        ${snoozed.length ? renderGroup('SNOOZED', snoozed, 'snoozed') : ''}
        ${renderGroup('TOMORROW', tomorrow, 'tomorrow')}
        ${done.length ? renderGroup('COMPLETED TODAY', done, 'done') : ''}
    `;

    // Attach events
    mainEl.querySelectorAll('.rem-done-btn').forEach(btn => {
        btn.addEventListener('click', () => markDone(parseInt(btn.dataset.id)));
    });
    mainEl.querySelectorAll('.rem-snooze-btn').forEach(btn => {
        btn.addEventListener('click', () => snoozeReminder(parseInt(btn.dataset.id)));
    });
    mainEl.querySelectorAll('.rem-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openReminderModal(parseInt(btn.dataset.id)));
    });
    mainEl.querySelectorAll('.rem-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteReminder(parseInt(btn.dataset.id)));
    });
    mainEl.querySelectorAll('.rem-undo-btn').forEach(btn => {
        btn.addEventListener('click', () => undoDone(parseInt(btn.dataset.id)));
    });
    mainEl.querySelectorAll('.rem-unsnooze-btn').forEach(btn => {
        btn.addEventListener('click', () => unsnoozeReminder(parseInt(btn.dataset.id)));
    });
}

function renderGroup(title, items, type) {
    if (!items.length && type !== 'today') return '';
    return `
        <div class="reminders-group">
            <h3 class="group-title">${title}</h3>
            <div class="reminder-stack">
                ${items.length
                    ? items.map(r => renderReminderCard(r, type)).join('')
                    : `<div class="rem-empty">No reminders here 🎉</div>`
                }
            </div>
        </div>
    `;
}

function renderReminderCard(r, type) {
    const isDone    = type === 'done';
    const isSnoozed = r.snoozed && !isDone;
    const priorityCls = r.priority || 'low';

    const actions = isDone
        ? `<button class="action-btn rem-undo-btn"   data-id="${r.id}">↩ Undo</button>
           <button class="action-btn rem-delete-btn" data-id="${r.id}" style="color:var(--red)">🗑️</button>`
        : isSnoozed
        ? `<button class="action-btn rem-unsnooze-btn" data-id="${r.id}">Wake up</button>
           <button class="action-btn rem-edit-btn"     data-id="${r.id}">Edit</button>
           <button class="action-btn rem-delete-btn"   data-id="${r.id}" style="color:var(--red)">🗑️</button>`
        : r.date === 'tomorrow'
        ? `<button class="action-btn rem-edit-btn"   data-id="${r.id}">Edit</button>
           <button class="action-btn rem-delete-btn" data-id="${r.id}" style="color:var(--red)">🗑️</button>`
        : `<button class="action-btn rem-done-btn"   data-id="${r.id}">Done</button>
           <button class="action-btn rem-snooze-btn" data-id="${r.id}">Snooze</button>
           <button class="action-btn rem-edit-btn"   data-id="${r.id}">Edit</button>
           <button class="action-btn rem-delete-btn" data-id="${r.id}" style="color:var(--red)">🗑️</button>`;

    return `
        <div class="reminder-item ${priorityCls === 'urgent' && !isDone ? 'urgent' : ''} ${isDone ? 'rem-done-item' : ''} ${isSnoozed ? 'muted' : ''}">
            <div class="reminder-time">${r.time || ''}</div>
            <div class="reminder-content">
                <h4 style="${isDone ? 'text-decoration:line-through;opacity:.6' : ''}">${r.title}</h4>
                <p>${r.description || ''}</p>
                ${isSnoozed && r.snoozedUntil ? `<small style="color:var(--accent)">⏰ Snoozed until ${r.snoozedUntil}</small>` : ''}
            </div>
            <div class="reminder-actions">${actions}</div>
        </div>
    `;
}

// =============================================
// ACTIONS
// =============================================

function markDone(id) {
    const list = getRemindersList();
    const r = list.find(r => r.id === id);
    if (r) { r.done = true; r.snoozed = false; }
    saveReminders(list);
    renderReminders();
}

function undoDone(id) {
    const list = getRemindersList();
    const r = list.find(r => r.id === id);
    if (r) r.done = false;
    saveReminders(list);
    renderReminders();
}

function snoozeReminder(id) {
    const list = getRemindersList();
    const r = list.find(r => r.id === id);
    if (!r) return;

    // Snooze for 30 min
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const h    = now.getHours();
    const m    = String(now.getMinutes()).padStart(2,'0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    r.snoozed      = true;
    r.snoozedUntil = `${h % 12 || 12}:${m} ${ampm}`;

    saveReminders(list);
    renderReminders();

    // Auto-unsnooze after 30 min (in-session only)
    setTimeout(() => {
        const fresh = getRemindersList();
        const rem   = fresh.find(r => r.id === id);
        if (rem && rem.snoozed) {
            rem.snoozed = false;
            rem.snoozedUntil = null;
            saveReminders(fresh);
            renderReminders();
        }
    }, 30 * 60 * 1000);
}

function unsnoozeReminder(id) {
    const list = getRemindersList();
    const r = list.find(r => r.id === id);
    if (r) { r.snoozed = false; r.snoozedUntil = null; }
    saveReminders(list);
    renderReminders();
}

function deleteReminder(id) {
    // Use modal confirm instead of browser confirm
    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle   = document.getElementById('modalTitle');
    const modalBody    = document.getElementById('modalBody');
    if (!modalOverlay) return;

    modalTitle.textContent = '🗑️ Delete Reminder';
    modalBody.innerHTML = `
        <div style="text-align:center;padding:1rem 0;">
            <p style="margin-bottom:1.5rem;font-size:1.4rem;">Delete this reminder permanently?</p>
            <div style="display:flex;gap:1rem;justify-content:center;">
                <button class="btn-submit-modal" style="background:#ef4444;flex:1;" id="remConfirmDelete">🗑️ Delete</button>
                <button class="btn-submit-modal" style="background:var(--border,#444);flex:1;" id="remCancelDelete">Cancel</button>
            </div>
        </div>
    `;
    modalOverlay.classList.add('open');

    document.getElementById('remConfirmDelete').addEventListener('click', () => {
        const list = getRemindersList().filter(r => r.id !== id);
        saveReminders(list);
        closeReminderModal();
        renderReminders();
    });
    document.getElementById('remCancelDelete').addEventListener('click', closeReminderModal);
}

// =============================================
// QUICK REMINDER MODAL — Create / Edit
// =============================================

function openReminderModal(editId = null) {
    const list = getRemindersList();
    const r    = editId ? list.find(r => r.id === editId) : null;
    const isEdit = !!r;

    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle   = document.getElementById('modalTitle');
    const modalBody    = document.getElementById('modalBody');
    if (!modalOverlay) return;

    modalTitle.textContent = isEdit ? '✏️ Edit Reminder' : '🔔 Quick Reminder';
    modalBody.innerHTML = `
        <form id="reminderForm" class="modal-form">
            <div>
                <label>Title *</label>
                <input type="text" id="remTitle" required placeholder="Reminder title" value="${r?.title || ''}">
            </div>
            <div>
                <label>Description</label>
                <textarea id="remDesc" rows="2" placeholder="Details...">${r?.description || ''}</textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div>
                    <label>Time *</label>
                    <input type="time" id="remTime" value="${r?.time ? convertRemTimeTo24(r.time) : '10:00'}" required>
                </div>
                <div>
                    <label>Priority</label>
                    <select id="remPriority">
                        <option value="low"    ${r?.priority === 'low'    ? 'selected':''}>🟢 Low</option>
                        <option value="medium" ${r?.priority === 'medium' ? 'selected':''}>🟡 Medium</option>
                        <option value="high"   ${r?.priority === 'high'   ? 'selected':''}>🟠 High</option>
                        <option value="urgent" ${r?.priority === 'urgent' ? 'selected':''}>🔴 Urgent</option>
                    </select>
                </div>
            </div>
            <div>
                <label>When</label>
                <select id="remDate">
                    <option value="today"    ${(!r || r.date === 'today')    ? 'selected':''}>📅 Today</option>
                    <option value="tomorrow" ${r?.date === 'tomorrow'        ? 'selected':''}>📅 Tomorrow</option>
                </select>
            </div>
            <button type="submit" class="btn-submit-modal">
                ${isEdit ? '💾 Save Changes' : '🔔 Create Reminder'}
            </button>
        </form>
    `;
    modalOverlay.classList.add('open');

    document.getElementById('reminderForm').addEventListener('submit', e => {
        e.preventDefault();
        const title    = document.getElementById('remTitle').value.trim();
        const desc     = document.getElementById('remDesc').value.trim();
        const time     = convertRemTimeTo12(document.getElementById('remTime').value);
        const priority = document.getElementById('remPriority').value;
        const date     = document.getElementById('remDate').value;

        if (!title) return;

        const fresh = getRemindersList();
        if (isEdit) {
            const idx = fresh.findIndex(r => r.id === editId);
            if (idx >= 0) fresh[idx] = { ...fresh[idx], title, description: desc, time, priority, date };
        } else {
            fresh.push({ id: Date.now(), title, description: desc, time, priority, date, done: false, snoozed: false });
        }

        saveReminders(fresh);
        closeReminderModal();
        renderReminders();
    });

    // Close handlers
    const closeBtn = document.getElementById('modalClose');
    if (closeBtn) {
        const newClose = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newClose, closeBtn);
        newClose.addEventListener('click', closeReminderModal);
    }
    modalOverlay.onclick = e => { if (e.target === modalOverlay) closeReminderModal(); };
}

function closeReminderModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) { overlay.classList.remove('open'); overlay.onclick = null; }
    const body = document.getElementById('modalBody');
    if (body) body.innerHTML = '';
}

// =============================================
// TIME HELPERS
// =============================================

function convertRemTimeTo24(t) {
    if (!t) return '10:00';
    if (!t.includes('AM') && !t.includes('PM')) return t;
    const [part, mod] = t.split(' ');
    let [h, m] = part.split(':');
    if (mod === 'PM' && h !== '12') h = String(parseInt(h) + 12);
    if (mod === 'AM' && h === '12') h = '00';
    return `${h.padStart(2,'0')}:${m || '00'}`;
}

function convertRemTimeTo12(t) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

// =============================================
// TOAST
// =============================================

function showReminderToast(msg) {
    document.querySelector('.rem-toast')?.remove();
    const t = document.createElement('div');
    t.className = 'rem-toast success-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.animation = 'slideIn .3s ease reverse';
        setTimeout(() => t.remove(), 300);
    }, 2500);
}

// =============================================
// INJECT EXTRA CSS
// =============================================

function injectRemindersCSS() {
    if (document.getElementById('rem-extra-css')) return;
    const s = document.createElement('style');
    s.id = 'rem-extra-css';
    s.textContent = `
        .rem-empty {
            text-align: center;
            color: var(--text-secondary);
            font-size: 1.3rem;
            padding: 2rem 0;
        }
        .rem-done-item {
            opacity: .6;
        }
        .reminder-item {
            transition: transform .2s, box-shadow .2s, opacity .3s;
        }
        .reminder-item:hover {
            transform: translateX(4px);
        }
        .action-btn {
            transition: background .2s, color .2s, transform .15s;
        }
        .action-btn:hover {
            transform: translateY(-1px);
        }
        /* priority left border colors */
        .reminder-item.urgent { border-left: 4px solid #ef4444; }
        .reminder-item.high   { border-left: 4px solid #f5c842; }
        .reminder-item.medium { border-left: 4px solid var(--accent); }
        .reminder-item.low    { border-left: 4px solid #4ade80; }
    `;
    document.head.appendChild(s);
}

// =============================================
// INIT
// =============================================

function initReminders() {
    injectRemindersCSS();

    // + Quick Reminder button
    const btn = document.getElementById('btnNewReminder');
    if (btn) {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => openReminderModal(null));
    }

    renderReminders();
}

document.addEventListener('DOMContentLoaded', () => {
    // Watch nav clicks
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.getAttribute('data-section') === 'reminders') {
                setTimeout(initReminders, 60);
            }
        });
    });

    // Init immediately if reminders section is active on load
    setTimeout(() => {
        const sec = document.getElementById('section-reminders');
        if (sec && (sec.classList.contains('active') || sec.style.display === 'block')) {
            initReminders();
        }
    }, 120);
});