document.addEventListener('DOMContentLoaded', function () {

    // Lê o usuário logado uma única vez — usado em todo o arquivo
    const fullname  = localStorage.getItem('userFullname') || 'User';
    const email     = localStorage.getItem('userEmail')    || '';
    const initial   = fullname.trim().charAt(0).toUpperCase();
    const firstName = fullname.split(' ')[0];


    // ==============================================
    // 1. LIVE DATE & ADAPTIVE GREETING
    // ==============================================

    const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];

    function updateLiveDate() {
        const now  = new Date();
        const hour = now.getHours();

        let greeting = 'Welcome back';
        if (hour >= 5  && hour < 12) greeting = 'Good morning';
        else if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
        else greeting = 'Good evening';

        const greetingEl = document.getElementById('overviewGreeting');
        if (greetingEl) greetingEl.textContent = `${greeting}, ${firstName} 👋`;

        const dayName = DAYS[now.getDay()];
        const day     = now.getDate();
        const month   = MONTHS[now.getMonth()];
        const year    = now.getFullYear();
        const hh      = String(now.getHours()).padStart(2, '0');
        const mm      = String(now.getMinutes()).padStart(2, '0');

        const dateEl = document.getElementById('liveDateText');
        if (dateEl) dateEl.textContent = `${dayName}, ${month} ${day} ${year} · ${hh}:${mm}`;
    }

    updateLiveDate();
    setInterval(updateLiveDate, 30000);


    // ==============================================
    // 2. DYNAMIC SUBTITLE — meetings & urgent tasks
    // ==============================================

    function updateSubtitle() {
        const subtitleEl = document.querySelector('#section-overview .section-header > div > p');
        if (!subtitleEl) return;

        const todayMeetings = getTodayMeetingsCount();
        const urgentTasks   = getUrgentTasksCount();

        if (todayMeetings === 0 && urgentTasks === 0) {
            subtitleEl.innerHTML = `All clear today — no meetings or urgent tasks. 🎉`;
            return;
        }

        let parts = [];
        if (todayMeetings > 0) {
            parts.push(`<span class="text-accent">${todayMeetings} meeting${todayMeetings > 1 ? 's' : ''}</span> today`);
        }
        if (urgentTasks > 0) {
            parts.push(`<span class="text-urgent">${urgentTasks} urgent task${urgentTasks > 1 ? 's' : ''}</span> pending`);
        }

        subtitleEl.innerHTML = `You have ${parts.join(' and ')}.`;
    }

    function getTodayMeetingsCount() {
        if (!window.store) return 0;
        const events = window.store.getEvents();
        const now    = new Date();
        const todayD = now.getDate();
        const todayM = MONTHS[now.getMonth()];

        return events.filter(ev => {
            const dayMatch   = parseInt(ev.date) === todayD;
            const monthMatch = ev.month === todayM ||
                               parseInt(ev.month) === now.getMonth() + 1;
            const yearMatch  = ev.year === undefined ||
                               parseInt(ev.year) === now.getFullYear();
            return dayMatch && monthMatch && yearMatch;
        }).length;
    }

    function getUrgentTasksCount() {
        if (!window.store) return 0;
        return window.store.getTasks().filter(
            t => t.priority === 'urgent' && t.status !== 'done'
        ).length;
    }

    updateSubtitle();
    setInterval(updateSubtitle, 3000);


    // ==============================================
    // 3. KPI CARDS — conectados ao store real
    // ==============================================

    function updateKPIs() {
        if (!window.store) return;

        const stats = window.store.getStats();

        // --- Tasks Completed ---
        const kpiCompleted = document.getElementById('kpiTasksCompleted');
        if (kpiCompleted) kpiCompleted.textContent = stats.doneCount;

        const completedPct = stats.totalTasks > 0
            ? Math.round((stats.doneCount / stats.totalTasks) * 100)
            : 0;
        setProgressBar('kpiTasksCompleted', completedPct);
        setTrendLabel(0, completedPct, true);

        // --- Day Streak ---
        const streak    = calculateStreak();
        const streakEls = document.querySelectorAll('.kpi-value');
        if (streakEls[1]) streakEls[1].textContent = streak;

        const streakPct  = Math.min(streak * 10, 100);
        const streakBars = document.querySelectorAll('.kpi-progress-bar');
        if (streakBars[1]) {
            setTimeout(() => { streakBars[1].style.width = streakPct + '%'; }, 400);
        }
        setTrendLabel(1, streak, true);

        // --- Focus Time (Pomodoro) ---
        const focusEl = document.getElementById('kpiFocusTime');
        if (focusEl) {
            const focusMins = getFocusMinutesToday();
            if (focusMins >= 60) {
                const h = Math.floor(focusMins / 60);
                const m = focusMins % 60;
                focusEl.textContent = m > 0 ? `${h}h ${m}m` : `${h}h`;
            } else {
                focusEl.textContent = focusMins > 0 ? `${focusMins}m` : '0h';
            }
        }

        // --- Sprint Completion ---
        const sprintPct  = stats.totalTasks > 0
            ? Math.round((stats.doneCount / stats.totalTasks) * 100)
            : 0;
        const kpiValues  = document.querySelectorAll('.kpi-value');
        if (kpiValues[3]) kpiValues[3].textContent = sprintPct + '%';

        const sprintBars = document.querySelectorAll('.kpi-progress-bar');
        if (sprintBars[2]) {
            sprintBars[2].setAttribute('data-width', sprintPct);
            setTimeout(() => { sprintBars[2].style.width = sprintPct + '%'; }, 400);
        }
        setTrendLabel(3, sprintPct, true);
    }

    function setProgressBar(anchorId, pct) {
        const anchor = document.getElementById(anchorId);
        if (!anchor) return;
        const card = anchor.closest('.kpi-card');
        if (!card) return;
        const bar = card.querySelector('.kpi-progress-bar');
        if (bar) {
            bar.setAttribute('data-width', pct);
            setTimeout(() => { bar.style.width = pct + '%'; }, 400);
        }
    }

    function setTrendLabel(cardIndex, value, isUp) {
        const trends = document.querySelectorAll('.kpi-trend');
        if (!trends[cardIndex]) return;
        const el  = trends[cardIndex];
        el.textContent = (isUp ? '↑ ' : '↓ ') + value + '%';
        el.className   = 'kpi-trend ' + (isUp ? 'up' : 'down');
    }

    function calculateStreak() {
        if (!window.store) return 0;
        const tasks = window.store.getTasks().filter(t => t.status === 'done');
        if (tasks.length === 0) return 0;

        const days = new Set(tasks.map(t => {
            const d = new Date(t.createdAt || t.dueDate || Date.now());
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        }));

        let streak   = 0;
        const today  = new Date();
        for (let i = 0; i < 30; i++) {
            const check = new Date(today);
            check.setDate(today.getDate() - i);
            const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
            if (days.has(key)) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        return streak;
    }

    function getFocusMinutesToday() {
        const key = `focusMinutes_${email}_${todayKey()}`;
        return parseInt(localStorage.getItem(key) || '0');
    }

    function todayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }

    updateKPIs();
    setInterval(updateKPIs, 3000);


    // ==============================================
    // 4. SPRINT CARD
    // ==============================================

    function updateSprintCard() {
        if (!window.store) return;
        const stats = window.store.getStats();
        const tasks = window.store.getTasks();

        const doneEl   = document.getElementById('sprintDone');
        const doingEl  = document.getElementById('sprintDoing');
        const urgentEl = document.getElementById('sprintUrgent');
        const pctEl    = document.getElementById('sprintPercent');
        const barEl    = document.getElementById('sprintProgressBar');

        if (doneEl)   doneEl.textContent   = stats.doneCount;
        if (doingEl)  doingEl.textContent  = stats.doingCount;
        if (urgentEl) urgentEl.textContent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;

        const pct = stats.totalTasks > 0
            ? Math.round((stats.doneCount / stats.totalTasks) * 100)
            : 0;

        if (pctEl) pctEl.textContent = pct + '%';
        if (barEl) {
            barEl.setAttribute('data-width', pct);
            setTimeout(() => { barEl.style.width = pct + '%'; }, 400);
        }

        const now        = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daysLeft   = Math.ceil((endOfMonth - now) / (1000 * 60 * 60 * 24));
        const daysEls    = document.querySelectorAll('.sprint-stat-num.accent');
        if (daysEls[0]) daysEls[0].textContent = daysLeft;
    }

    updateSprintCard();
    setInterval(updateSprintCard, 3000);


    // ==============================================
    // 5. TODAY'S PRIORITIES — reminders de hoje
    // ==============================================

    const _priorityKey = `priorityChecked_${email}`;

    function _loadChecked() {
        try { return new Set(JSON.parse(localStorage.getItem(_priorityKey) || '[]')); }
        catch { return new Set(); }
    }
    function _saveChecked(set) {
        localStorage.setItem(_priorityKey, JSON.stringify([...set]));
    }
    const _checkedPriorityIds = _loadChecked();

    function updatePriorityList() {
        const listEl = document.getElementById('overviewPriorityList');
        if (!listEl) return;

        // Busca reminders do dia (date === 'today'), não feitos e não snoozed
        const allReminders  = JSON.parse(localStorage.getItem('snap-reminders') || '[]');
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const topTasks      = allReminders
            .filter(r => r.date === 'today' && !r.done && !r.snoozed)
            .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9))
            .slice(0, 3);

        if (topTasks.length === 0) {
            listEl.innerHTML = `<p style="color: var(--text-secondary); font-size: 1.3rem; padding: 1rem 0;">
                No reminders for today. Add one in Reminders!
            </p>`;
            return;
        }

        const priorityColors = {
            urgent: '#ef4444',
            high:   '#f97316',
            medium: '#f5c842',
            low:    '#4ade80'
        };

        listEl.innerHTML = topTasks.map(task => {
            const color       = priorityColors[task.priority] || '#888';
            const itemId      = `priItem_${task.id}`;
            const cbId        = `priCb_${task.id}`;
            const isDone      = _checkedPriorityIds.has(task.id);
            const strikeStyle = isDone
                ? 'text-decoration: line-through; color: var(--text-secondary);'
                : '';

            return `
                <div class="priority-item" id="${itemId}" style="display:flex; align-items:center; gap:.8rem; padding:.6rem 0; border-bottom:1px solid var(--border);">
                    <input type="checkbox" id="${cbId}" ${isDone ? 'checked' : ''}
                        style="accent-color: var(--accent); width:16px; height:16px; cursor:pointer; flex-shrink:0;">
                    <label for="${cbId}" style="flex:1; cursor:pointer; ${strikeStyle}">
                        ${task.title}
                        <span style="font-size:1rem; color:${color}; margin-left:.5rem; font-weight:600;">
                            ● ${task.priority.toUpperCase()}
                        </span>
                    </label>
                    <span style="font-size:1rem; color:var(--text-secondary);">
                        ${task.time || ''}
                    </span>
                </div>
            `;
        }).join('');

        topTasks.forEach(task => {
            const cb   = document.getElementById(`priCb_${task.id}`);
            const item = document.getElementById(`priItem_${task.id}`);
            if (!cb || !item) return;

            cb.addEventListener('change', () => {
                const label = item.querySelector('label');
                if (cb.checked) {
                    _checkedPriorityIds.add(task.id);
                    label.style.textDecoration = 'line-through';
                    label.style.color          = 'var(--text-secondary)';
                } else {
                    _checkedPriorityIds.delete(task.id);
                    label.style.textDecoration = '';
                    label.style.color          = '';
                }
                _saveChecked(_checkedPriorityIds);
            });
        });
    }

    updatePriorityList();
    setInterval(updatePriorityList, 3000);


    // ==============================================
    // 6. ACTIVITY FEED
    // ==============================================

    function updateActivityFeed() {
        const feedEl = document.getElementById('activityFeed');
        if (!feedEl || !window.store) return;

        const tasks  = window.store.getTasks();
        const events = window.store.getEvents();

        const items = [
            ...tasks.map(t => ({
                type:  t.status === 'done' ? '✅' : '📋',
                label: t.status === 'done'
                    ? `Task completed: <strong>${t.title}</strong>`
                    : `Task added: <strong>${t.title}</strong>`,
                time:  new Date(t.createdAt || Date.now())
            })),
            ...events.map(e => ({
                type:  '📅',
                label: `Event scheduled: <strong>${e.title}</strong>`,
                time:  new Date(e.createdAt || Date.now())
            }))
        ]
        .sort((a, b) => b.time - a.time)
        .slice(0, 5);

        if (items.length === 0) {
            feedEl.innerHTML = `<p style="color: var(--text-secondary); font-size: 1.3rem; padding: 1rem 0;">No recent activity.</p>`;
            return;
        }

        feedEl.innerHTML = items.map(item => `
            <div class="feed-item" style="display:flex; gap:1rem; align-items:flex-start; padding:.8rem 0; border-bottom:1px solid var(--border);">
                <span style="font-size:1.6rem;">${item.type}</span>
                <div style="flex:1;">
                    <p style="font-size:1.2rem; color:var(--text-primary); margin:0;">${item.label}</p>
                    <small style="color:var(--text-secondary);">${timeAgo(item.time)}</small>
                </div>
            </div>
        `).join('');
    }

    function timeAgo(date) {
        const diff = Math.floor((Date.now() - date) / 1000);
        if (diff < 60)    return 'just now';
        if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }

    updateActivityFeed();
    setInterval(updateActivityFeed, 5000);


    // ==============================================
    // 7. CLICKABLE KPI CARDS
    // ==============================================

    function setupClickableKPIs() {
        const kpiCards = document.querySelectorAll('.kpi-card');
        const navMap   = ['todos', 'metrics', null, 'metrics'];

        kpiCards.forEach((card, i) => {
            card.style.cursor     = 'pointer';
            card.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';

            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-3px)';
                card.style.boxShadow = '0 8px 24px rgba(108,108,255,0.18)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.boxShadow = '';
            });

            card.addEventListener('click', () => {
                const section = navMap[i];
                if (section) {
                    const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
                    if (navItem) navItem.click();
                } else {
                    const pomodoro = document.querySelector('.focus-card');
                    if (pomodoro) {
                        pomodoro.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        pomodoro.style.outline = '2px solid var(--accent)';
                        setTimeout(() => { pomodoro.style.outline = ''; }, 1500);
                    }
                }
            });
        });
    }

    setupClickableKPIs();


    // ==============================================
    // 8. PROGRESS BAR ANIMATIONS
    // ==============================================

    function animateProgressBars() {
        document.querySelectorAll('.kpi-progress-bar[data-width], .sprint-progress-fill[data-width]')
            .forEach(bar => {
                const target = bar.getAttribute('data-width');
                setTimeout(() => { bar.style.width = target + '%'; }, 400);
            });
    }

    animateProgressBars();


    // ==============================================
    // 9. POMODORO TIMER
    // ==============================================

    const POMODORO_PHASES = [
        { label: 'Deep Work',   mode: 'Focus', duration: 25 * 60 },
        { label: 'Short Break', mode: 'Break', duration:  5 * 60 }
    ];
    const CIRCUMFERENCE = 100;

    let pomState = {
        running:      false,
        phase:        0,
        sessionCount: 1,
        remaining:    25 * 60,
        interval:     null
    };

    function pomUpdateUI() {
        const { phase, sessionCount, remaining } = pomState;
        const totalDur = POMODORO_PHASES[phase].duration;
        const pct      = remaining / totalDur;

        const m = String(Math.floor(remaining / 60)).padStart(2, '0');
        const s = String(remaining % 60).padStart(2, '0');

        const display   = document.getElementById('pomodoroDisplay');
        const ring      = document.getElementById('pomodoroRing');
        const modeLabel = document.getElementById('pomodoroModeLabel');
        const subtext   = document.getElementById('pomodoroSubtext');

        if (display)   display.textContent   = `${m}:${s}`;
        if (ring)      ring.setAttribute('stroke-dasharray', `${(pct * CIRCUMFERENCE).toFixed(1)}, ${CIRCUMFERENCE}`);
        if (modeLabel) modeLabel.textContent = POMODORO_PHASES[phase].label;
        if (subtext)   subtext.textContent   = `${POMODORO_PHASES[phase].mode} — session ${sessionCount}/4`;
    }

    function addFocusMinute() {
        const key     = `focusMinutes_${email}_${todayKey()}`;
        const current = parseInt(localStorage.getItem(key) || '0');
        localStorage.setItem(key, current + 1);
    }

    window.togglePomodoro = function () {
        const btn = document.getElementById('pomodoroBtn');
        pomState.running = !pomState.running;

        if (pomState.running) {
            btn.textContent      = '⏸ Pause';
            btn.style.background = 'rgba(108,108,255,0.2)';
            btn.style.color      = 'var(--accent)';

            pomState.interval = setInterval(() => {
                pomState.remaining--;

                if (pomState.phase === 0 && pomState.remaining % 60 === 0) {
                    addFocusMinute();
                }

                if (pomState.remaining <= 0) {
                    pomState.phase = (pomState.phase + 1) % 2;
                    if (pomState.phase === 0) {
                        pomState.sessionCount = Math.min(pomState.sessionCount + 1, 4);
                    }
                    pomState.remaining = POMODORO_PHASES[pomState.phase].duration;
                }

                pomUpdateUI();
            }, 1000);
        } else {
            clearInterval(pomState.interval);
            btn.textContent      = '▶ Resume session';
            btn.style.background = '';
            btn.style.color      = '';
        }
    };

    pomUpdateUI();


    // ==============================================
    // 10. CLICKABLE AVATAR MENU
    // ==============================================

    const avatarBtn = document.querySelector('.topbar-avatar');
    if (avatarBtn) {
        avatarBtn.style.cursor   = 'pointer';
        avatarBtn.style.position = 'relative';

        const menu = document.createElement('div');
        menu.id    = 'avatarDropdown';

        menu.innerHTML = `
            <div class="av-menu-user">
                <div class="av-menu-av">${initial}</div>
                <div class="av-menu-info">
                    <strong>${fullname}</strong>
                    <small>${email}</small>
                </div>
            </div>

            <div class="av-menu-section-title">STATUS</div>
            <div class="av-status-row">
                <button class="av-status-opt active" data-status="online">
                    <span class="av-status-icon online-icon"></span>Online
                </button>
                <button class="av-status-opt" data-status="focus">
                    <span class="av-status-icon focus-icon"></span>Focus
                </button>
                <button class="av-status-opt" data-status="away">
                    <span class="av-status-icon away-icon"></span>Away
                </button>
            </div>

            <div class="av-menu-sep"></div>

            <a class="av-menu-item" data-section="metrics">
                <span class="av-menu-icon">📊</span> My performance
            </a>
            <a class="av-menu-item" data-section="todos">
                <span class="av-menu-icon">✅</span> My tasks
            </a>
            <a class="av-menu-item" data-section="reminders">
                <span class="av-menu-icon">🔔</span> Reminders
            </a>
            <a class="av-menu-item" id="avThemeToggle">
                <span class="av-menu-icon">🌙</span> Toggle theme
            </a>

            <div class="av-menu-sep"></div>

            <a class="av-menu-item av-menu-danger" id="avLogout">
                <span class="av-menu-icon">🚪</span> Sign out
            </a>
        `;
        menu.className = 'av-dropdown';
        document.body.appendChild(menu);

        function positionMenu() {
            const rect   = avatarBtn.getBoundingClientRect();
            menu.style.top   = (rect.bottom + window.scrollY + 8) + 'px';
            menu.style.right = (window.innerWidth - rect.right) + 'px';
        }

        avatarBtn.addEventListener('click', e => {
            e.stopPropagation();
            const isOpen = menu.classList.toggle('open');
            avatarBtn.classList.toggle('av-active', isOpen);
            if (isOpen) positionMenu();
        });

        document.addEventListener('click', () => {
            menu.classList.remove('open');
            avatarBtn.classList.remove('av-active');
        });

        menu.addEventListener('click', e => e.stopPropagation());

        menu.querySelectorAll('.av-status-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                menu.querySelectorAll('.av-status-opt').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        menu.querySelectorAll('.av-menu-item[data-section]').forEach(item => {
            item.addEventListener('click', () => {
                const target = document.querySelector(`[data-section="${item.dataset.section}"]`);
                if (target) target.click();
                menu.classList.remove('open');
                avatarBtn.classList.remove('av-active');
            });
        });

        const avThemeToggle = document.getElementById('avThemeToggle');
        if (avThemeToggle) {
            avThemeToggle.addEventListener('click', () => {
                const themeBtn = document.getElementById('themeToggle');
                if (themeBtn) themeBtn.click();
            });
        }

        const avLogout = document.getElementById('avLogout');
        if (avLogout) {
            avLogout.addEventListener('click', () => {
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('snapToken');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userFullname');
                window.location.href = 'login.html';
            });
        }
    }

});