// =============================================
// STATE
// =============================================

let calendarState = {
    currentYear:  2026,
    currentMonth: 4,
    view:         'month', 
    filters:      { work: true, personal: true, focus: true },
    selectedDay:  null,
};

// =============================================
// DATA LAYER
// =============================================

function getEvents() {
    if (window.store) return window.store.getEvents();
    const raw = localStorage.getItem('cal-events');
    return raw ? JSON.parse(raw) : [];
}

function saveEvent(event) {
    if (window.store) {
        if (event.id && window.store.getEventById(event.id)) {
            window.store.updateEvent(event.id, event);
        } else {
            window.store.addEvent(event);
        }
    } else {
        const events = getEvents();
        const idx = events.findIndex(e => e.id === event.id);
        if (idx >= 0) events[idx] = event;
        else events.push({ ...event, id: Date.now() });
        localStorage.setItem('cal-events', JSON.stringify(events));
    }
}

function deleteEvent(id) {
    if (window.store) {
        window.store.deleteEvent(id);
    } else {
        const events = getEvents().filter(e => e.id !== id);
        localStorage.setItem('cal-events', JSON.stringify(events));
    }
}

// =============================================
// HELPERS
// =============================================

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function firstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }
function isToday(year, month, day) {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
}

function eventsForDay(day, month, year) {
    return getEvents().filter(e => {
        const dayMatch = parseInt(e.date) === day;
        const monMatch = e.month === MONTH_NAMES[month] || parseInt(e.month) === month + 1;
        const yrMatch  = e.year === undefined || parseInt(e.year) === year;
        const visible  = calendarState.filters[e.category] !== false;
        return dayMatch && monMatch && yrMatch && visible;
    });
}

// =============================================
// PANEL HELPERS — overlay for week/day
// =============================================

function getAltPanel() {
    let panel = document.getElementById('cal-alt-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'cal-alt-panel';
        // Insert after .calendar-grid inside .full-calendar-card
        const card = document.querySelector('.full-calendar-card');
        if (card) card.appendChild(panel);
    }
    return panel;
}

function showAltPanel(html) {
    const grid  = document.querySelector('.calendar-grid');
    const panel = getAltPanel();
    if (grid)  grid.style.display  = 'none';
    panel.innerHTML = html;
    panel.style.display = 'block';
}

function hideAltPanel() {
    const grid  = document.querySelector('.calendar-grid');
    const panel = document.getElementById('cal-alt-panel');
    if (grid)  grid.style.display  = '';  // restore original CSS grid display
    if (panel) panel.style.display = 'none';
}

// =============================================
// MAIN RENDER DISPATCHER
// =============================================

function renderCalendarFull() {
    const { currentYear, currentMonth, view } = calendarState;

    const label = document.querySelector('.cal-month-nav h2');
    if (label) label.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

    if (view === 'month') {
        hideAltPanel();
        renderMonthView();
    } else if (view === 'week') {
        renderWeekView();
    } else if (view === 'day') {
        renderDayView();
    }
}

// =============================================
// MONTH VIEW — rebuilds .calendar-grid innerHTML
// =============================================

function renderMonthView() {
    const { currentYear, currentMonth } = calendarState;
    const grid = document.querySelector('.calendar-grid');
    if (!grid) return;

    const totalDays = daysInMonth(currentYear, currentMonth);
    const firstDay  = firstDayOfMonth(currentYear, currentMonth);
    const prevTotal = daysInMonth(currentYear, currentMonth === 0 ? 11 : currentMonth - 1);

    let html = DAY_NAMES.map(d => `<div class="weekday">${d}</div>`).join('');

    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="day empty">${prevTotal - i}</div>`;
    }

    for (let d = 1; d <= totalDays; d++) {
        const todayClass    = isToday(currentYear, currentMonth, d) ? ' today' : '';
        const selectedClass = calendarState.selectedDay === d ? ' selected-day' : '';
        const dayEvents     = eventsForDay(d, currentMonth, currentYear);

        const pillsHTML = dayEvents.map(ev => `
            <div class="event-pill ${ev.category}" data-event-id="${ev.id}" title="${ev.title}">
                ${ev.title}
            </div>
        `).join('');

        html += `
            <div class="day${todayClass}${selectedClass}" data-day="${d}">
                <span class="day-num">${d}</span>
                ${pillsHTML}
            </div>
        `;
    }

    const totalCells = firstDay + totalDays;
    const remainder  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let d = 1; d <= remainder; d++) {
        html += `<div class="day empty">${d}</div>`;
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.day:not(.empty)').forEach(dayEl => {
        dayEl.addEventListener('click', e => {
            if (e.target.classList.contains('event-pill')) return;
            calendarState.selectedDay = parseInt(dayEl.getAttribute('data-day'));
            renderMonthView();
        });

        dayEl.addEventListener('dblclick', e => {
            if (e.target.classList.contains('event-pill')) return;
            openEventModal(null, parseInt(dayEl.getAttribute('data-day')));
        });
    });

    // Click event pill → edit
    grid.querySelectorAll('.event-pill').forEach(pill => {
        pill.addEventListener('click', e => {
            e.stopPropagation();
            openEventModal(parseInt(pill.getAttribute('data-event-id')));
        });
    });
}

// =============================================
// WEEK VIEW — renders inside alt panel
// =============================================

function renderWeekView() {
    const { currentYear, currentMonth, selectedDay } = calendarState;

    const base      = selectedDay || new Date().getDate();
    const baseDate  = new Date(currentYear, currentMonth, base);
    const startDate = new Date(baseDate);
    startDate.setDate(base - baseDate.getDay()); // Sunday of that week

    const hours = ['07:00','08:00','09:00','10:00','11:00','12:00',
                   '13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

    let headerCols = `<div class="wv-gutter"></div>`;
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const todayCls = isToday(d.getFullYear(), d.getMonth(), d.getDate()) ? ' wv-today' : '';
        headerCols += `
            <div class="wv-col-header${todayCls}">
                <span class="wv-dname">${DAY_NAMES[d.getDay()]}</span>
                <span class="wv-dnum">${d.getDate()}</span>
            </div>`;
    }

    let bodyRows = '';
    hours.forEach(h => {
        let cells = `<div class="wv-time">${h}</div>`;
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const todayCls   = isToday(d.getFullYear(), d.getMonth(), d.getDate()) ? ' wv-today' : '';
            const dayEvs     = eventsForDay(d.getDate(), d.getMonth(), d.getFullYear());
            const hourNum    = parseInt(h);
            const slotEvents = dayEvs.filter(ev => {
                if (!ev.time) return false;
                const evH = parseInt(convertTo24(ev.time).split(':')[0]);
                return evH === hourNum;
            });
            const pills = slotEvents.map(ev =>
                `<div class="wv-event ${ev.category}" data-event-id="${ev.id}">${ev.title}</div>`
            ).join('');
            cells += `<div class="wv-cell${todayCls}" data-day="${d.getDate()}" data-month="${d.getMonth()}" data-year="${d.getFullYear()}" data-hour="${h}">${pills}</div>`;
        }
        bodyRows += `<div class="wv-row">${cells}</div>`;
    });

    const html = `
        <div class="alt-view week-view">
            <div class="wv-header">${headerCols}</div>
            <div class="wv-body">${bodyRows}</div>
        </div>
    `;

    showAltPanel(html);

    document.querySelectorAll('.wv-event').forEach(el => {
        el.addEventListener('click', e => {
            e.stopPropagation();
            openEventModal(parseInt(el.dataset.eventId));
        });
    });

    document.querySelectorAll('.wv-cell').forEach(cell => {
        cell.addEventListener('dblclick', () => {
            openEventModal(null, parseInt(cell.dataset.day), parseInt(cell.dataset.month), cell.dataset.hour);
        });
    });
}

// =============================================
// DAY VIEW — renders inside alt panel
// =============================================

function renderDayView() {
    const { currentYear, currentMonth, selectedDay } = calendarState;
    const day      = selectedDay || new Date().getDate();
    const dayEvs   = eventsForDay(day, currentMonth, currentYear);
    const dateLabel = new Date(currentYear, currentMonth, day)
        .toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

    const hours = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2,'0')}:00`);

    let rows = '';
    hours.forEach(h => {
        const hourNum    = parseInt(h);
        const slotEvents = dayEvs.filter(ev => {
            if (!ev.time) return false;
            return parseInt(convertTo24(ev.time).split(':')[0]) === hourNum;
        });
        const pills = slotEvents.map(ev => `
            <div class="dv-event ${ev.category}" data-event-id="${ev.id}">
                <strong>${ev.title}</strong>
                ${ev.time ? `<span>${ev.time}</span>` : ''}
                ${ev.description ? `<small>${ev.description}</small>` : ''}
            </div>
        `).join('');
        rows += `
            <div class="dv-row" data-hour="${h}" data-day="${day}" data-month="${currentMonth}" data-year="${currentYear}">
                <div class="dv-time">${h}</div>
                <div class="dv-content">${pills}</div>
            </div>
        `;
    });

    const html = `
        <div class="alt-view day-view">
            <div class="dv-title">${dateLabel}</div>
            <div class="dv-body">${rows}</div>
        </div>
    `;

    showAltPanel(html);

    document.querySelectorAll('.dv-event').forEach(el => {
        el.addEventListener('click', e => {
            e.stopPropagation();
            openEventModal(parseInt(el.dataset.eventId));
        });
    });

    document.querySelectorAll('.dv-row').forEach(row => {
        row.addEventListener('dblclick', () => {
            openEventModal(null, parseInt(row.dataset.day), parseInt(row.dataset.month), row.dataset.hour);
        });
    });
}

// =============================================
// EVENT MODAL
// =============================================

function openEventModal(eventId = null, prefillDay = null, prefillMonth = null, prefillHour = null) {
    const events = getEvents();
    const event  = eventId ? events.find(e => e.id === eventId) : null;
    const isEdit = !!event;

    const { currentYear, currentMonth } = calendarState;
    const defaultDay   = prefillDay   ?? calendarState.selectedDay ?? new Date().getDate();
    const defaultMonth = prefillMonth ?? currentMonth;
    const defaultHour  = prefillHour  ?? '10:00';

    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle   = document.getElementById('modalTitle');
    const modalBody    = document.getElementById('modalBody');
    if (!modalOverlay) return;

    modalTitle.textContent = isEdit ? '✏️ Edit Event' : '📅 New Event';
    modalBody.innerHTML = `
        <form id="eventForm" class="modal-form">
            <div>
                <label>Title *</label>
                <input type="text" id="evTitle" required placeholder="Event title" value="${event?.title || ''}">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div>
                    <label>Day *</label>
                    <input type="number" id="evDay" min="1" max="31" required value="${event ? event.date : defaultDay}">
                </div>
                <div>
                    <label>Month *</label>
                    <select id="evMonth">
                        ${MONTH_NAMES.map((m, i) => `
                            <option value="${m}" ${(event ? event.month === m : i === defaultMonth) ? 'selected' : ''}>${m}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div>
                    <label>Time</label>
                    <input type="time" id="evTime" value="${event?.time ? convertTo24(event.time) : defaultHour}">
                </div>
                <div>
                    <label>Category *</label>
                    <select id="evCategory">
                        <option value="work"     ${event?.category === 'work'     ? 'selected' : ''}>💼 Work</option>
                        <option value="personal" ${event?.category === 'personal' ? 'selected' : ''}>🏠 Personal</option>
                        <option value="focus"    ${event?.category === 'focus'    ? 'selected' : ''}>🎯 Focus</option>
                    </select>
                </div>
            </div>
            <div>
                <label>Description</label>
                <textarea id="evDesc" rows="2" placeholder="Optional notes...">${event?.description || ''}</textarea>
            </div>
            <div style="display:flex;gap:1rem;">
                <button type="submit" class="btn-submit-modal" style="flex:1;">
                    ${isEdit ? '💾 Save Changes' : '✅ Create Event'}
                </button>
                ${isEdit ? `<button type="button" id="evDelete" class="btn-submit-modal" style="flex:0 0 auto;width:auto;padding:1.4rem 1.8rem;background:#ef4444;">🗑️</button>` : ''}
            </div>
        </form>
    `;
    modalOverlay.classList.add('open');

    document.getElementById('eventForm').addEventListener('submit', e => {
        e.preventDefault();
        const title    = document.getElementById('evTitle').value.trim();
        const day      = parseInt(document.getElementById('evDay').value);
        const month    = document.getElementById('evMonth').value;
        const time     = convertTo12(document.getElementById('evTime').value);
        const category = document.getElementById('evCategory').value;
        const desc     = document.getElementById('evDesc').value.trim();
        if (!title || !day) return;

        const payload = {
            id: isEdit ? event.id : Date.now(),
            title, date: day, month, year: currentYear,
            time, category, description: desc,
        };

        saveEvent(payload);
        closeEventModal();
        renderCalendarFull();
    });

    document.getElementById('evDelete')?.addEventListener('click', () => {
        deleteEvent(eventId);
        closeEventModal();
        renderCalendarFull();
    });

    const closeBtn = document.getElementById('modalClose');
    const newClose = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newClose, closeBtn);
    newClose.addEventListener('click', closeEventModal);

    modalOverlay.onclick = e => { if (e.target === modalOverlay) closeEventModal(); };
}

function closeEventModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) { overlay.classList.remove('open'); overlay.onclick = null; }
    const body = document.getElementById('modalBody');
    if (body) body.innerHTML = '';
}

// =============================================
// TIME HELPERS
// =============================================

function convertTo24(time12) {
    if (!time12) return '10:00';
    if (!time12.includes('AM') && !time12.includes('PM')) return time12;
    const [timePart, modifier] = time12.split(' ');
    let [hours, minutes] = timePart.split(':');
    if (modifier === 'PM' && hours !== '12') hours = String(parseInt(hours) + 12);
    if (modifier === 'AM' && hours === '12') hours = '00';
    return `${hours.padStart(2,'0')}:${minutes || '00'}`;
}

function convertTo12(time24) {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
}

// =============================================
// TOAST
// =============================================

function showCalToast(msg) {
    document.querySelector('.cal-toast')?.remove();
    const t = document.createElement('div');
    t.className = 'cal-toast success-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.animation = 'slideIn .3s ease reverse';
        setTimeout(() => t.remove(), 300);
    }, 2500);
}

// =============================================
// NAV SETUP
// =============================================

function setupCalendarNav() {
    const navBtns = document.querySelectorAll('.cal-month-nav .nav-btn');
    navBtns[0]?.addEventListener('click', () => {
        calendarState.currentMonth--;
        if (calendarState.currentMonth < 0) { calendarState.currentMonth = 11; calendarState.currentYear--; }
        calendarState.selectedDay = null;
        renderCalendarFull();
    });
    navBtns[1]?.addEventListener('click', () => {
        calendarState.currentMonth++;
        if (calendarState.currentMonth > 11) { calendarState.currentMonth = 0; calendarState.currentYear++; }
        calendarState.selectedDay = null;
        renderCalendarFull();
    });

    const viewBtns = document.querySelectorAll('.view-pill button');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            calendarState.view = btn.textContent.trim().toLowerCase();
            renderCalendarFull();
        });
    });

    document.querySelectorAll('.cal-filters .check-item').forEach(item => {
        const chk = item.querySelector('input[type="checkbox"]');
        const dot = item.querySelector('span[class]');
        if (!chk || !dot) return;
        const category = [...dot.classList].find(c => c !== 'dot');
        if (category) {
            chk.addEventListener('change', () => {
                calendarState.filters[category] = chk.checked;
                renderCalendarFull();
            });
        }
    });

    document.getElementById('btnNewEvent')?.addEventListener('click', () => openEventModal(null));
}

// =============================================
// INJECT CSS
// =============================================

function injectCalendarCSS() {
    if (document.getElementById('cal-extra-css')) return;
    const s = document.createElement('style');
    s.id = 'cal-extra-css';
    s.textContent = `
        /* Month view interactions */
        .day:not(.empty) { cursor: pointer; }
        .day:not(.empty):hover { background: var(--accent-light); }
        .day.selected-day { background: var(--accent-light) !important; }
        .day.selected-day .day-num { color: var(--accent); }
        .event-pill { cursor: pointer; transition: opacity .15s; }
        .event-pill:hover { opacity: .75; }

        /* Alt panel container */
        #cal-alt-panel {
            display: none;
            overflow-y: auto;
            max-height: 600px;
            border-top: 1px solid var(--border);
        }

        /* ── WEEK VIEW ── */
        .alt-view { font-family: 'Epilogue', sans-serif; }
        .wv-header {
            display: grid;
            grid-template-columns: 64px repeat(7, 1fr);
            position: sticky; top: 0;
            background: var(--bg-card); z-index: 2;
            border-bottom: 1px solid var(--border);
        }
        .wv-gutter { border-right: 1px solid var(--border); }
        .wv-col-header {
            text-align: center; padding: 1rem .4rem;
            border-right: 1px solid var(--border);
        }
        .wv-col-header.wv-today { background: var(--accent-light); }
        .wv-dname { display:block; font-size:1rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.5px; }
        .wv-dnum  { display:block; font-size:1.8rem; font-weight:700; color:var(--text-primary); }
        .wv-body  { display:flex; flex-direction:column; }
        .wv-row   { display:grid; grid-template-columns: 64px repeat(7, 1fr); }
        .wv-time  {
            border-right: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            font-size:1rem; color:var(--text-secondary);
            display:flex; align-items:flex-start; justify-content:flex-end;
            padding:.5rem .6rem 0; height:56px;
        }
        .wv-cell  {
            border-right: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            height: 56px; padding: 3px 4px; cursor: pointer;
        }
        .wv-cell:hover { background: var(--accent-light); }
        .wv-cell.wv-today { background: rgba(108,108,255,.03); }
        .wv-event {
            font-size:1rem; padding:2px 6px; border-radius:4px;
            font-weight:600; cursor:pointer; white-space:nowrap;
            overflow:hidden; text-overflow:ellipsis; margin-bottom:2px;
        }
        .wv-event.work     { background:rgba(108,108,255,.2); color:#6c6cff; }
        .wv-event.personal { background:rgba(74,222,128,.2);  color:#22c55e; }
        .wv-event.focus    { background:rgba(245,200,66,.2);   color:#d4a017; }

        /* ── DAY VIEW ── */
        .day-view { padding: 1.5rem; }
        .dv-title {
            font-size:1.8rem; font-weight:700; color:var(--text-primary);
            padding-bottom:1rem; margin-bottom:1rem;
            border-bottom:1px solid var(--border);
        }
        .dv-row {
            display:grid; grid-template-columns:70px 1fr;
            min-height:56px; border-bottom:1px solid var(--border); cursor:pointer;
        }
        .dv-row:hover .dv-content { background:var(--accent-light); }
        .dv-time {
            font-size:1.1rem; color:var(--text-secondary);
            padding:.8rem .6rem 0; text-align:right;
            border-right:1px solid var(--border);
        }
        .dv-content { padding:.4rem .8rem; }
        .dv-event {
            border-radius:6px; padding:.5rem .8rem; margin-bottom:4px;
            cursor:pointer; border-left:3px solid;
        }
        .dv-event.work     { background:rgba(108,108,255,.12); border-color:#6c6cff; }
        .dv-event.personal { background:rgba(74,222,128,.12);  border-color:#22c55e; }
        .dv-event.focus    { background:rgba(245,200,66,.12);   border-color:#d4a017; }
        .dv-event strong { display:block; font-size:1.2rem; color:var(--text-primary); }
        .dv-event span   { font-size:1rem; color:var(--text-secondary); }
        .dv-event small  { display:block; font-size:1rem; color:var(--text-secondary); margin-top:2px; }

        /* Filter dots */
        .dot.work     { display:inline-block;width:10px;height:10px;border-radius:50%;background:#6c6cff; }
        .dot.personal { display:inline-block;width:10px;height:10px;border-radius:50%;background:#22c55e; }
        .dot.focus    { display:inline-block;width:10px;height:10px;border-radius:50%;background:#d4a017; }
    `;
    document.head.appendChild(s);
}

// =============================================
// INIT
// =============================================

function initCalendar() {
    injectCalendarCSS();
    setupCalendarNav();
    renderCalendarFull();
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.getAttribute('data-section') === 'calendar') {
                setTimeout(initCalendar, 60);
            }
        });
    });

    setTimeout(() => {
        const sec = document.getElementById('section-calendar');
        if (sec && (sec.classList.contains('active') || sec.style.display === 'block')) {
            initCalendar();
        }
    }, 120);
});