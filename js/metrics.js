/**
 * METRICS.JS — Full dashboard in the style of ClickUp/Linear
 * Integrated with window.store (DataStore)
 * Charts: pure SVG + dynamically injected Chart.js
 */

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────

function m_store() { return window.store || null; }

function m_tasks()     { return m_store() ? m_store().getTasks()     : []; }
function m_reminders() { return m_store() ? m_store().getReminders() : []; }
function m_events()    { return m_store() ? m_store().getEvents()    : []; }
function m_team()      { return m_store() ? m_store().getTeam()      : []; }
function m_stats()     { return m_store() ? m_store().getStats()     : {}; }

function m_isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

// Semantic priority colors
const PRIORITY_COLORS = {
    urgent: '#ef4444',
    high:   '#f97316',
    medium: '#eab308',
    low:    '#22c55e',
};

// Last N days → array of { dateStr, count } objects
function m_tasksByDay(days = 7) {
    const tasks = m_tasks();
    const result = [];
    const today  = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const count = tasks.filter(t => {
            if (!t.createdAt) return false;
            try { return new Date(t.createdAt).toISOString().split('T')[0] === key; }
            catch { return false; }
        }).length;
        result.push({ dateStr: key, date: d, count });
    }
    return result;
}

// Last 35 days for the heatmap
function m_activityHeatmap() {
    const tasks  = m_tasks();
    const events = m_events();
    const map    = {};
    [...tasks, ...events].forEach(item => {
        const at = item.createdAt || item.date;
        if (!at) return;
        try {
            const d   = new Date(at);
            const key = d.toISOString().split('T')[0];
            map[key]  = (map[key] || 0) + 1;
        } catch {}
    });
    const cells = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        cells.push({ key, count: map[key] || 0, d });
    }
    return cells;
}

// ─────────────────────────────────────────────
// SECTION HTML — replaces the content of #section-metrics
// ─────────────────────────────────────────────

function m_buildHTML() {
    const sec = document.getElementById('section-metrics');
    if (!sec) return;

    sec.innerHTML = `
    <div class="section-header">
        <div>
            <h1>Metrics 📊</h1>
            <p id="m-subtitle">Your real-time productivity dashboard.</p>
        </div>
        <div class="header-actions">
            <select class="card-select" id="m-period-sel">
                <option value="7">Last 7 days</option>
                <option value="14">Last 2 weeks</option>
                <option value="30">Last month</option>
            </select>
            <button class="btn-primary" id="btnExportData">⬇ Export</button>
        </div>
    </div>

    <!-- KPI ROW -->
    <div class="m-kpi-row reveal-up" id="m-kpi-row"></div>

    <!-- MAIN GRID -->
    <div class="m-main-grid">

        <!-- Left col: large charts -->
        <div class="m-col-main">

            <!-- Velocity Chart (tasks/day) -->
            <div class="dash-card m-card reveal-up">
                <div class="m-card-head">
                    <div>
                        <h3>Velocity</h3>
                        <p class="m-card-sub">Tasks created per day</p>
                    </div>
                    <div class="m-legend" id="m-velocity-legend"></div>
                </div>
                <div style="position:relative;height:200px;">
                    <canvas id="m-velocity-chart" role="img" aria-label="Velocity chart: tasks created per day"></canvas>
                </div>
            </div>

            <!-- Status Breakdown donut + list -->
            <div class="dash-card m-card reveal-up" style="--delay:.1s">
                <div class="m-card-head">
                    <div>
                        <h3>Task Status</h3>
                        <p class="m-card-sub">Distribution by status</p>
                    </div>
                </div>
                <div class="m-status-row">
                    <div class="m-donut-wrap">
                        <canvas id="m-donut-chart" role="img" aria-label="Task status donut chart"></canvas>
                    </div>
                    <div class="m-status-list" id="m-status-list"></div>
                </div>
            </div>

            <!-- Activity heatmap -->
            <div class="dash-card m-card reveal-up" style="--delay:.2s">
                <div class="m-card-head">
                    <div>
                        <h3>Activity Map</h3>
                        <p class="m-card-sub">Last 35 days</p>
                    </div>
                    <div class="m-heatmap-legend">
                        <span>Less</span>
                        <span class="m-heat-cell m-h0"></span>
                        <span class="m-heat-cell m-h1"></span>
                        <span class="m-heat-cell m-h2"></span>
                        <span class="m-heat-cell m-h3"></span>
                        <span class="m-heat-cell m-h4"></span>
                        <span>More</span>
                    </div>
                </div>
                <div class="m-heatmap-grid" id="m-heatmap"></div>
            </div>

        </div><!-- /col-main -->

        <!-- Right col: detailed metrics -->
        <div class="m-col-side">

            <!-- Pending by priority -->
            <div class="dash-card m-card reveal-up" style="--delay:.05s">
                <div class="m-card-head">
                    <div>
                        <h3>By Priority</h3>
                        <p class="m-card-sub" id="m-priority-sub">Pending tasks</p>
                    </div>
                </div>
                <div id="m-priority-bars"></div>
            </div>

            <!-- Sprint progress -->
            <div class="dash-card m-card reveal-up" style="--delay:.15s">
                <div class="m-card-head">
                    <div>
                        <h3>Sprint</h3>
                        <p class="m-card-sub">Q2 · May 2026</p>
                    </div>
                    <span class="m-sprint-badge" id="m-sprint-badge">0%</span>
                </div>
                <div class="m-sprint-ring-wrap">
                    <svg class="m-sprint-ring" viewBox="0 0 120 120" aria-hidden="true">
                        <circle cx="60" cy="60" r="48" fill="none" stroke="var(--border,#ffffff15)" stroke-width="10"/>
                        <circle cx="60" cy="60" r="48" fill="none" stroke="var(--accent,#7c3aed)" stroke-width="10"
                                stroke-linecap="round" stroke-dasharray="301.59" stroke-dashoffset="301.59"
                                id="m-sprint-ring-fill" transform="rotate(-90 60 60)"
                                style="transition:stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)"/>
                        <text x="60" y="55" text-anchor="middle" font-size="22" font-weight="700"
                              fill="var(--text-primary,#fff)" id="m-sprint-ring-pct">0%</text>
                        <text x="60" y="73" text-anchor="middle" font-size="11"
                              fill="var(--text-secondary,#aaa)">complete</text>
                    </svg>
                </div>
                <div class="m-sprint-stats" id="m-sprint-stats"></div>
            </div>

            <!-- Team status -->
            <div class="dash-card m-card reveal-up" style="--delay:.25s">
                <div class="m-card-head">
                    <div>
                        <h3>Team</h3>
                        <p class="m-card-sub" id="m-team-sub">Members &amp; status</p>
                    </div>
                </div>
                <div id="m-team-list"></div>
            </div>

            <!-- Activity feed -->
            <div class="dash-card m-card reveal-up" style="--delay:.3s">
                <div class="m-card-head">
                    <div>
                        <h3>Recent Activity</h3>
                        <p class="m-card-sub">All sections</p>
                    </div>
                </div>
                <div id="m-feed-list"></div>
            </div>

        </div><!-- /col-side -->

    </div><!-- /main-grid -->
    `;
}

// ─────────────────────────────────────────────
// KPI CARDS
// ─────────────────────────────────────────────

function m_renderKPIs() {
    const row   = document.getElementById('m-kpi-row');
    if (!row) return;
    const stats = m_stats();
    const tasks = m_tasks();
    const team  = m_team();

    const total     = stats.totalTasks || 0;
    const done      = stats.completedTasks || 0;
    const doing     = stats.doingCount || 0;
    const todo      = stats.todoCount || 0;
    const urgent    = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
    const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
    const online    = team.filter(m => m.status === 'online').length;
    const reminders = m_reminders().filter(r => !r.done).length;

    const kpis = [
        { icon:'✅', label:'Completed',    value: done,          sub: `of ${total} tasks`,              color:'#22c55e', pct: total>0 ? (done/total)*100 : 0 },
        { icon:'⚡', label:'In progress',  value: doing,         sub: `${todo} waiting`,                color:'#3b82f6', pct: total>0 ? (doing/total)*100 : 0 },
        { icon:'🔴', label:'Urgent',       value: urgent,        sub: urgent>0?'Needs attention!':'All good', color: urgent>0?'#ef4444':'#22c55e', pct: total>0 ? (urgent/total)*100 : 0 },
        { icon:'🎯', label:'Sprint',       value: pct+'%',       sub: `${done}/${total} tasks`,         color:'var(--accent,#7c3aed)', pct },
        { icon:'👥', label:'Team online',  value: online,        sub: `${team.length} members`,         color:'#a78bfa', pct: team.length>0 ? (online/team.length)*100 : 0 },
        { icon:'🔔', label:'Reminders',    value: reminders,     sub: 'pending',                        color:'#f59e0b', pct: 0 },
    ];

    row.innerHTML = kpis.map(k => `
        <div class="m-kpi-card">
            <div class="m-kpi-top">
                <span class="m-kpi-icon" style="background:${k.color}1a;color:${k.color}">${k.icon}</span>
                <span class="m-kpi-label">${k.label}</span>
            </div>
            <div class="m-kpi-value" style="color:${k.color}">${k.value}</div>
            <div class="m-kpi-sub">${k.sub}</div>
            <div class="m-kpi-bar-track">
                <div class="m-kpi-bar-fill" style="width:${Math.min(100,k.pct)}%;background:${k.color}"></div>
            </div>
        </div>
    `).join('');
}

// ─────────────────────────────────────────────
// VELOCITY CHART (Chart.js)
// ─────────────────────────────────────────────

let m_velocityChart = null;
let m_donutChart    = null;

function m_destroyCharts() {
    if (m_velocityChart) { try { m_velocityChart.destroy(); } catch {} m_velocityChart = null; }
    if (m_donutChart)    { try { m_donutChart.destroy(); }    catch {} m_donutChart    = null; }
}

function m_renderCharts(days) {
    m_destroyCharts();

    // ── Velocity ──
    const data   = m_tasksByDay(days);
    const labels = data.map(d => d.date.toLocaleDateString('en-US', { weekday:'short', day:'numeric' }));
    const counts = data.map(d => d.count);
    const isDark = m_isDark();

    // Done per day (tasks whose createdAt matches — proxy for activity)
    const doneCounts = data.map(d => {
        const key = d.dateStr;
        return m_tasks().filter(t => {
            if (t.status !== 'done' || !t.createdAt) return false;
            try { return new Date(t.createdAt).toISOString().split('T')[0] === key; }
            catch { return false; }
        }).length;
    });

    const textCol  = isDark ? '#9ca3af' : '#6b7280';
    const gridCol  = isDark ? '#ffffff12' : '#00000010';
    const accentCreate = '#3b82f6';
    const accentDone   = '#22c55e';

    const velCtx = document.getElementById('m-velocity-chart');
    if (velCtx) {
        m_velocityChart = new Chart(velCtx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Created',
                        data: counts,
                        backgroundColor: accentCreate + '99',
                        borderColor:     accentCreate,
                        borderWidth: 1.5,
                        borderRadius: 5,
                        borderSkipped: false,
                    },
                    {
                        label: 'Completed',
                        data: doneCounts,
                        backgroundColor: accentDone + '99',
                        borderColor:     accentDone,
                        borderWidth: 1.5,
                        borderRadius: 5,
                        borderSkipped: false,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? '#1e1e2e' : '#fff',
                        titleColor: isDark ? '#e5e7eb' : '#111',
                        bodyColor:  isDark ? '#9ca3af' : '#6b7280',
                        borderColor: isDark ? '#ffffff20' : '#e5e7eb',
                        borderWidth: 1,
                        padding: 10,
                    }
                },
                scales: {
                    x: {
                        ticks: { color: textCol, font: { size: 11 }, maxRotation: 0 },
                        grid:  { color: gridCol },
                    },
                    y: {
                        ticks: { color: textCol, font: { size: 11 }, stepSize: 1 },
                        grid:  { color: gridCol },
                        beginAtZero: true,
                    }
                }
            }
        });
    }

    // Custom legend
    const legEl = document.getElementById('m-velocity-legend');
    if (legEl) {
        legEl.innerHTML = `
            <span class="m-leg-item"><span class="m-leg-dot" style="background:${accentCreate}"></span>Created</span>
            <span class="m-leg-item"><span class="m-leg-dot" style="background:${accentDone}"></span>Completed</span>
        `;
    }

    // ── Donut ──
    const stats = m_stats();
    const todo  = stats.todoCount  || 0;
    const doing = stats.doingCount || 0;
    const done  = stats.completedTasks || 0;
    const total = stats.totalTasks || 0;

    const donutCtx = document.getElementById('m-donut-chart');
    if (donutCtx) {
        if (total === 0) {
            donutCtx.getContext('2d').clearRect(0,0,300,300);
        } else {
            m_donutChart = new Chart(donutCtx, {
                type: 'doughnut',
                data: {
                    labels: ['To do', 'Doing', 'Done'],
                    datasets: [{
                        data: [todo, doing, done],
                        backgroundColor: ['#6b7280aa','#3b82f6aa','#22c55eaa'],
                        borderColor:     ['#6b7280',  '#3b82f6',  '#22c55e'],
                        borderWidth: 2,
                        hoverOffset: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '68%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: isDark ? '#1e1e2e' : '#fff',
                            titleColor: isDark ? '#e5e7eb' : '#111',
                            bodyColor:  isDark ? '#9ca3af' : '#6b7280',
                            borderColor: isDark ? '#ffffff20' : '#e5e7eb',
                            borderWidth: 1,
                            padding: 10,
                        }
                    }
                }
            });
        }
    }

    // Status list
    const statusEl = document.getElementById('m-status-list');
    if (statusEl) {
        const items = [
            { label:'To do',       count: todo,  color:'#6b7280', pct: total>0 ? Math.round((todo/total)*100)  : 0 },
            { label:'In progress', count: doing, color:'#3b82f6', pct: total>0 ? Math.round((doing/total)*100) : 0 },
            { label:'Done',        count: done,  color:'#22c55e', pct: total>0 ? Math.round((done/total)*100)  : 0 },
        ];
        statusEl.innerHTML = items.map(it => `
            <div class="m-status-item">
                <div class="m-status-top">
                    <span class="m-status-dot" style="background:${it.color}"></span>
                    <span class="m-status-label">${it.label}</span>
                    <span class="m-status-count" style="color:${it.color}">${it.count}</span>
                </div>
                <div class="m-bar-track">
                    <div class="m-bar-fill" style="width:${it.pct}%;background:${it.color}"></div>
                </div>
            </div>
        `).join('');
    }
}

// ─────────────────────────────────────────────
// HEATMAP
// ─────────────────────────────────────────────

function m_renderHeatmap() {
    const el = document.getElementById('m-heatmap');
    if (!el) return;
    const cells  = m_activityHeatmap();
    const maxVal = Math.max(...cells.map(c => c.count), 1);
    el.innerHTML = cells.map(c => {
        const intensity = c.count === 0 ? 0 : Math.min(4, Math.ceil((c.count / maxVal) * 4));
        const label     = c.d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
        return `<span class="m-heat-cell m-h${intensity}" title="${label}: ${c.count} activit${c.count !== 1 ? 'ies' : 'y'}"></span>`;
    }).join('');
}

// ─────────────────────────────────────────────
// PRIORIDADES
// ─────────────────────────────────────────────

function m_renderPriorities() {
    const el  = document.getElementById('m-priority-bars');
    const sub = document.getElementById('m-priority-sub');
    if (!el) return;
    const pending = m_tasks().filter(t => t.status !== 'done');
    if (sub) sub.textContent = `${pending.length} pendente${pending.length !== 1 ? 's' : ''}`;
    const order  = ['urgent','high','medium','low'];
    const labels = { urgent:'🔴 Urgente', high:'🟠 Alta', medium:'🟡 Média', low:'🟢 Baixa' };
    const maxC   = Math.max(...order.map(k => pending.filter(t => t.priority === k).length), 1);
    el.innerHTML = order.map(k => {
        const count = pending.filter(t => t.priority === k).length;
        const pct   = Math.round((count / maxC) * 100);
        return `
            <div class="m-pri-item">
                <div class="m-pri-top">
                    <span class="m-pri-label">${labels[k]}</span>
                    <span class="m-pri-count" style="color:${PRIORITY_COLORS[k]}">${count}</span>
                </div>
                <div class="m-bar-track">
                    <div class="m-bar-fill" style="width:${pct}%;background:${PRIORITY_COLORS[k]}"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ─────────────────────────────────────────────
// SPRINT RING
// ─────────────────────────────────────────────

function m_renderSprint() {
    const stats  = m_stats();
    const done   = stats.completedTasks || 0;
    const doing  = stats.doingCount     || 0;
    const urgent = m_tasks().filter(t => t.priority === 'urgent' && t.status !== 'done').length;
    const total  = stats.totalTasks     || 0;
    const pct    = total > 0 ? Math.round((done / total) * 100) : 0;

    // Badge
    const badge = document.getElementById('m-sprint-badge');
    if (badge) badge.textContent = pct + '%';

    // Ring
    const ring = document.getElementById('m-sprint-ring-fill');
    const pctEl = document.getElementById('m-sprint-ring-pct');
    if (ring) {
        const circ  = 2 * Math.PI * 48;
        const offset = circ - (pct / 100) * circ;
        // Cor por progresso
        const col = pct >= 75 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444';
        ring.setAttribute('stroke', col);
        setTimeout(() => {
            ring.style.strokeDashoffset = offset;
        }, 100);
        if (pctEl) pctEl.textContent = pct + '%';
    }

    // Stats row
    const statsEl = document.getElementById('m-sprint-stats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="m-sprint-stat"><span class="m-sprint-num" style="color:#22c55e">${done}</span><span>Concluídas</span></div>
            <div class="m-sprint-stat"><span class="m-sprint-num" style="color:#3b82f6">${doing}</span><span>Em andamento</span></div>
            <div class="m-sprint-stat"><span class="m-sprint-num" style="color:#ef4444">${urgent}</span><span>Urgentes</span></div>
        `;
    }
}

// ─────────────────────────────────────────────
// TEAM
// ─────────────────────────────────────────────

function m_renderTeam() {
    const el  = document.getElementById('m-team-list');
    const sub = document.getElementById('m-team-sub');
    if (!el) return;
    const team   = m_team();
    const online = team.filter(m => m.status === 'online').length;
    if (sub) sub.textContent = `${online} online · ${team.length} total`;
    if (team.length === 0) {
        el.innerHTML = `<p class="m-empty">Nenhum membro no time ainda.</p>`;
        return;
    }
    const statusDot = { online:'#22c55e', offline:'#6b7280', focus:'#eab308' };
    const statusLbl = { online:'Online', offline:'Offline', focus:'Focus' };
    el.innerHTML = team.slice(0, 6).map(m => `
        <div class="m-team-item">
            <div class="m-team-avatar" style="background:${statusDot[m.status]||'#6b7280'}22;color:${statusDot[m.status]||'#6b7280'}">
                ${(m.avatar || m.name?.charAt(0) || '?').toUpperCase()}
            </div>
            <div class="m-team-info">
                <span class="m-team-name">${m.name || 'Sem nome'}</span>
                <span class="m-team-role">${m.role || '—'}</span>
            </div>
            <span class="m-team-dot" style="background:${statusDot[m.status]||'#6b7280'}"
                  title="${statusLbl[m.status]||''}"></span>
        </div>
    `).join('');
}

// ─────────────────────────────────────────────
// ACTIVITY FEED (todas as seções)
// ─────────────────────────────────────────────

function m_renderFeed() {
    const el = document.getElementById('m-feed-list');
    if (!el) return;
    const items = [];

    m_tasks().slice().reverse().slice(0, 4).forEach(t => {
        const icons  = { todo:'📋', doing:'⚡', done:'✅' };
        const colors = { todo:'#6b7280', doing:'#3b82f6', done:'#22c55e' };
        const badge  = { todo:'A fazer', doing:'Fazendo', done:'Pronto' };
        items.push({
            icon:  icons[t.status]  || '📋',
            text:  t.title || 'Sem título',
            tag:   badge[t.status] || t.status,
            color: colors[t.status] || '#6b7280',
            from:  'Tasks',
        });
    });

    m_reminders().slice().reverse().slice(0, 2).forEach(r => {
        items.push({
            icon: '🔔', text: r.title || 'Lembrete',
            tag: r.time || r.date || '—', color: '#f59e0b', from: 'Reminders',
        });
    });

    m_events().slice().reverse().slice(0, 2).forEach(e => {
        items.push({
            icon: '📅', text: e.title || 'Evento',
            tag: e.month ? `${e.date} ${e.month}` : '—', color: '#a78bfa', from: 'Calendar',
        });
    });

    if (items.length === 0) {
        el.innerHTML = `<p class="m-empty">Nenhuma atividade ainda.</p>`;
        return;
    }

    el.innerHTML = items.slice(0, 8).map(it => `
        <div class="m-feed-item">
            <span class="m-feed-icon">${it.icon}</span>
            <div class="m-feed-body">
                <span class="m-feed-text">${it.text}</span>
                <span class="m-feed-from">${it.from}</span>
            </div>
            <span class="m-feed-tag" style="background:${it.color}1a;color:${it.color}">${it.tag}</span>
        </div>
    `).join('');
}

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────

function m_setupExport() {
    const btn = document.getElementById('btnExportData');
    if (!btn) return;
    const nb = btn.cloneNode(true);
    btn.parentNode.replaceChild(nb, btn);
    nb.id = 'btnExportData';
    nb.addEventListener('click', () => {
        if (!m_store()) return;
        const report = {
            exportedAt: new Date().toISOString(),
            summary:    m_stats(),
            tasks:      m_tasks(),
            reminders:  m_reminders(),
            events:     m_events(),
            team:       m_team(),
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type:'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `snap-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    });
}

function m_setupPeriod() {
    const sel = document.getElementById('m-period-sel');
    if (!sel) return;
    sel.addEventListener('change', () => {
        const days = parseInt(sel.value);
        m_renderCharts(days);
    });
}

// ─────────────────────────────────────────────
// INJETAR ESTILOS
// ─────────────────────────────────────────────

function m_injectStyles() {
    if (document.getElementById('metrics-v2-styles')) return;
    const s = document.createElement('style');
    s.id = 'metrics-v2-styles';
    s.textContent = `
    /* ── Layout ── */
    .m-main-grid {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: 1.4rem;
        margin-top: 1.4rem;
    }
    .m-col-main, .m-col-side { display:flex; flex-direction:column; gap:1.4rem; }

    /* ── Card base ── */
    .m-card { padding: 1.8rem 2rem !important; }
    .m-card-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.6rem;
    }
    .m-card-head h3 { font-size: 1.4rem; font-weight: 700; margin: 0 0 .2rem; }
    .m-card-sub { font-size: 1.1rem; color: var(--text-secondary); margin: 0; }

    /* ── KPI row ── */
    .m-kpi-row {
        display: grid;
        grid-template-columns: repeat(6,1fr);
        gap: 1.2rem;
        margin-top: 1rem;
    }
    .m-kpi-card {
        background: var(--card-bg, rgba(255,255,255,.04));
        border: 1px solid var(--border, rgba(255,255,255,.08));
        border-radius: 1.2rem;
        padding: 1.4rem 1.6rem;
        transition: transform .2s, box-shadow .2s;
    }
    .m-kpi-card:hover { transform: translateY(-2px); }
    .m-kpi-top { display:flex; align-items:center; gap:.8rem; margin-bottom:.8rem; }
    .m-kpi-icon {
        width: 3.2rem; height: 3.2rem; border-radius: .8rem;
        display:flex; align-items:center; justify-content:center;
        font-size: 1.5rem; flex-shrink:0;
    }
    .m-kpi-label { font-size: 1.1rem; color: var(--text-secondary); font-weight:500; line-height:1.3; }
    .m-kpi-value { font-size: 2.6rem; font-weight:800; line-height:1; margin-bottom:.3rem; }
    .m-kpi-sub   { font-size: 1rem; color: var(--text-secondary); margin-bottom:.8rem; }
    .m-kpi-bar-track { height:4px; background:var(--border,rgba(255,255,255,.1)); border-radius:99px; overflow:hidden; }
    .m-kpi-bar-fill  { height:100%; border-radius:99px; transition:width 1s cubic-bezier(.4,0,.2,1); }

    /* ── Legend ── */
    .m-legend { display:flex; gap:1rem; align-items:center; flex-wrap:wrap; }
    .m-leg-item { display:flex; align-items:center; gap:.4rem; font-size:1.1rem; color:var(--text-secondary); }
    .m-leg-dot  { width:10px; height:10px; border-radius:3px; flex-shrink:0; }

    /* ── Status donut ── */
    .m-status-row { display:flex; align-items:center; gap:2rem; }
    .m-donut-wrap { width:130px; height:130px; flex-shrink:0; }
    .m-donut-wrap canvas { width:130px!important; height:130px!important; }
    .m-status-list { flex:1; display:flex; flex-direction:column; gap:1rem; }
    .m-status-item {}
    .m-status-top  { display:flex; align-items:center; gap:.6rem; margin-bottom:.4rem; }
    .m-status-dot  { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
    .m-status-label{ font-size:1.2rem; flex:1; }
    .m-status-count{ font-size:1.2rem; font-weight:700; }
    .m-bar-track   { height:6px; background:var(--border,rgba(255,255,255,.08)); border-radius:99px; overflow:hidden; }
    .m-bar-fill    { height:100%; border-radius:99px; transition:width .9s cubic-bezier(.4,0,.2,1); }

    /* ── Heatmap ── */
    .m-heatmap-legend { display:flex; align-items:center; gap:4px; font-size:1rem; color:var(--text-secondary); }
    .m-heatmap-grid {
        display:grid; grid-template-columns:repeat(35,1fr);
        gap:3px; margin-top:.4rem;
    }
    .m-heat-cell { aspect-ratio:1; border-radius:3px; cursor:default; transition:transform .15s; }
    .m-heat-cell:hover { transform:scale(1.4); }
    .m-h0 { background:var(--border,rgba(255,255,255,.1)); }
    .m-h1 { background:#22c55e30; }
    .m-h2 { background:#22c55e60; }
    .m-h3 { background:#22c55eaa; }
    .m-h4 { background:#22c55e;   }

    /* ── Priorities ── */
    .m-pri-item    { margin-bottom:1.2rem; }
    .m-pri-top     { display:flex; justify-content:space-between; margin-bottom:.4rem; }
    .m-pri-label   { font-size:1.2rem; }
    .m-pri-count   { font-size:1.2rem; font-weight:700; }

    /* ── Sprint ring ── */
    .m-sprint-badge {
        background:var(--accent,#7c3aed)18; color:var(--accent,#7c3aed);
        font-size:1.1rem; font-weight:700; padding:.25rem .8rem;
        border-radius:99px;
    }
    .m-sprint-ring-wrap { display:flex; justify-content:center; padding: .5rem 0 1.2rem; }
    .m-sprint-ring { width:130px; height:130px; }
    .m-sprint-ring circle { transition:stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1); }
    .m-sprint-stats { display:flex; justify-content:space-around; }
    .m-sprint-stat  { display:flex; flex-direction:column; align-items:center; gap:.2rem; }
    .m-sprint-num   { font-size:2rem; font-weight:800; line-height:1; }
    .m-sprint-stat span:last-child { font-size:1rem; color:var(--text-secondary); }

    /* ── Team ── */
    .m-team-item  { display:flex; align-items:center; gap:.9rem; padding:.7rem 0; border-bottom:1px solid var(--border,rgba(255,255,255,.06)); }
    .m-team-item:last-child { border-bottom:none; }
    .m-team-avatar {
        width:3.4rem; height:3.4rem; border-radius:.9rem;
        display:flex; align-items:center; justify-content:center;
        font-size:1.3rem; font-weight:700; flex-shrink:0;
    }
    .m-team-info { flex:1; display:flex; flex-direction:column; gap:.1rem; min-width:0; }
    .m-team-name { font-size:1.2rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .m-team-role { font-size:1rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .m-team-dot  { width:9px; height:9px; border-radius:50%; flex-shrink:0; }

    /* ── Feed ── */
    .m-feed-item  { display:flex; align-items:center; gap:.9rem; padding:.7rem 0; border-bottom:1px solid var(--border,rgba(255,255,255,.06)); }
    .m-feed-item:last-child { border-bottom:none; }
    .m-feed-icon  { font-size:1.5rem; flex-shrink:0; width:2.4rem; text-align:center; }
    .m-feed-body  { flex:1; display:flex; flex-direction:column; gap:.1rem; min-width:0; }
    .m-feed-text  { font-size:1.2rem; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .m-feed-from  { font-size:1rem; color:var(--text-secondary); }
    .m-feed-tag   { font-size:.9rem; font-weight:600; padding:.15rem .55rem; border-radius:99px; white-space:nowrap; flex-shrink:0; }

    /* ── Empty ── */
    .m-empty { font-size:1.2rem; color:var(--text-secondary); padding:1rem 0; }

    /* ── Responsive ── */
    @media (max-width: 1200px) {
        .m-main-grid { grid-template-columns: 1fr; }
        .m-kpi-row   { grid-template-columns: repeat(3,1fr); }
    }
    @media (max-width: 700px) {
        .m-kpi-row   { grid-template-columns: repeat(2,1fr); }
        .m-heatmap-grid { grid-template-columns: repeat(17,1fr); }
        .m-status-row { flex-direction:column; }
    }
    `;
    document.head.appendChild(s);
}

// ─────────────────────────────────────────────
// CHART.JS LOADER
// ─────────────────────────────────────────────

function m_loadChartJS(cb) {
    if (window.Chart) { cb(); return; }
    const scr  = document.createElement('script');
    scr.src    = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    scr.onload = cb;
    document.head.appendChild(scr);
}

// ─────────────────────────────────────────────
// INIT PRINCIPAL
// ─────────────────────────────────────────────

function initMetrics() {
    m_injectStyles();
    m_buildHTML();              // injeta estrutura HTML

    // Renderiza tudo que não precisa de Chart.js
    m_renderKPIs();
    m_renderHeatmap();
    m_renderPriorities();
    m_renderSprint();
    m_renderTeam();
    m_renderFeed();
    m_setupExport();
    m_setupPeriod();

    // Carrega Chart.js e renderiza gráficos
    m_loadChartJS(() => {
        const sel  = document.getElementById('m-period-sel');
        const days = sel ? parseInt(sel.value) : 7;
        m_renderCharts(days);
    });
}

// ─────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.getAttribute('data-section') === 'metrics') {
                setTimeout(initMetrics, 80);
            }
        });
    });

    setTimeout(() => {
        const sec = document.getElementById('section-metrics');
        if (sec && (sec.classList.contains('active') || sec.style.display === 'block')) {
            initMetrics();
        }
    }, 180);

    // Reagir a mudanças no store
    document.addEventListener('store:updated', () => {
        const sec = document.getElementById('section-metrics');
        if (sec && (sec.classList.contains('active') || sec.style.display === 'block')) {
            initMetrics();
        }
    });
});