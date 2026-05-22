/**
 * TEAM MANAGER — Versão 100% Padronizada (Apenas Current Task)
 * Cards limpos + Stats sidebar + Projetos + Atividade recente + Busca/Filtros
 */

// ── Avatar classes (espelha o CSS original) ────────────────────────────────
const AVATAR_CLASS_MAP = { L:'main', A:'aline', S:'sophia', M:'marcus', B:'backend' };
const AVATAR_CYCLE     = ['aline','sophia','marcus','backend','main'];
function avatarClass(letter, i) {
    return AVATAR_CLASS_MAP[letter?.toUpperCase()] || AVATAR_CYCLE[i % AVATAR_CYCLE.length];
}

// Cores para presença no overview e avatares empilhados
const AVATAR_COLORS = {
    main:'#6c6cff', aline:'#ff6cbb', sophia:'#9b51e0',
    marcus:'#f2994a', backend:'#56ccf2'
};
function avatarColor(letter, i) {
    const cls = avatarClass(letter, i);
    return AVATAR_COLORS[cls] || '#6c6cff';
}

// ── Status helpers ─────────────────────────────────────────────────────────
const STATUS_LABEL = { online:'Online', offline:'Away', focus:'Focus Mode' };
const STATUS_DOT   = { online:'#4ade80', focus:'#f5c842', offline:'#888' };
function stLabel(s) { return STATUS_LABEL[s] ?? 'Away'; }
function stClass(s) { return s === 'online' ? 'online' : 'offline'; }

// ── Projetos fixos (usados na barra lateral) ──────────────────────────────
const PROJECTS = [
    { icon:'📦', name:'Fênix Cloud',    members:['L','A','S'], color:'#6c6cff' },
    { icon:'📉', name:'Trade Platform', members:['L','M'],     color:'#f5c842' },
    { icon:'🚀', name:'Snap Remote',    members:['L','A','S','B','M'], color:'#4ade80' },
    { icon:'🎨', name:'Fênix UI',       members:['A','L'],     color:'#ff6cbb' }
];

// ── Feed de atividade recente ─────────────────────────────────────────────
const ACTIVITY = [
    { avatar:'A', name:'Aline',  action:'pushed a commit to',  target:'fenix-ui',          time:'5m ago',  color:'#ff6cbb' },
    { avatar:'S', name:'Sophia', action:'created a sprint in', target:'Q3 Roadmap',        time:'1h ago',  color:'#9b51e0' },
    { avatar:'L', name:'Lucas',  action:'completed task',      target:'Dashboard Redesign',time:'2h ago',  color:'#6c6cff' },
    { avatar:'B', name:'Sam',    action:'reviewed PR in',      target:'API Security',      time:'3h ago',  color:'#56ccf2' },
    { avatar:'M', name:'Marcus', action:'opened issue on',     target:'React Native app',  time:'5h ago',  color:'#f2994a' }
];

// ── Estado de filtro/busca ─────────────────────────────────────────────────
let teamSearchVal  = '';
let teamFilterVal  = 'all';

// ══════════════════════════════════════════════════════════════════════════
// RENDER PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
function renderTeam() {
    renderTeamGrid();
    renderTeamSidebar();
    renderPresenceOverview();
}

// ══════════════════════════════════════════════════════════════════════════
// GRID DE CARDS
// ══════════════════════════════════════════════════════════════════════════
function renderTeamGrid() {
    const grid = document.getElementById('teamGrid') || document.querySelector('.team-grid');
    if (!grid) return;

    const team = window.store?.getTeam() ?? [];
    const filtered = team.filter(m => {
        const matchFilter = teamFilterVal === 'all' || m.status === teamFilterVal;
        const q = teamSearchVal.toLowerCase();
        const matchSearch = !q ||
            m.name.toLowerCase().includes(q) ||
            m.role.toLowerCase().includes(q) ||
            (m.skills||[]).some(s => s.toLowerCase().includes(q));
        return matchFilter && matchSearch;
    });

    if (!filtered.length) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;color:var(--text-secondary);">
                <div style="font-size:3rem;margin-bottom:1rem;">👥</div>
                <p style="font-size:1.4rem;">No members found.</p>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map((m, i) => buildCard(m, i)).join('');

    // Bind de botões originais
    grid.querySelectorAll('.team-edit-btn').forEach(b =>
        b.addEventListener('click', () => openMemberModal(parseInt(b.dataset.id))));
    grid.querySelectorAll('.team-del-btn').forEach(b =>
        b.addEventListener('click', () => confirmDelete(parseInt(b.dataset.id))));
    grid.querySelectorAll('.team-msg-btn').forEach(b =>
        b.addEventListener('click', () => openMsgModal(b.dataset.name)));
}

function buildCard(m, i) {
    const isMe     = m.id === 1;
    const avCls    = avatarClass(m.avatar, i);
    const skills   = (m.skills||[]).map(s => `<span class="m-tag">${s}</span>`).join('');

    const footer = isMe
        ? `<div class="member-footer" style="display:flex;gap:0.8rem;margin-top:auto;padding-top:1rem;">
               <button class="btn-msg team-edit-btn"
                   style="flex:1;background:var(--accent);color:#fff;border-color:var(--accent);"
                   data-id="${m.id}">✏️ Edit Profile</button>
           </div>`
        : `<div class="member-footer" style="display:flex;gap:0.8rem;margin-top:auto;padding-top:1rem;">
               <button class="btn-msg team-msg-btn" style="flex:1;">Send Message</button>
               <button class="btn-msg team-edit-btn"
                   style="flex:0 0 38px;padding:0;background:var(--accent-light);color:var(--accent);border-color:var(--accent);"
                   data-id="${m.id}" title="Edit">✏️</button>
               <button class="btn-msg team-del-btn"
                   style="flex:0 0 38px;padding:0;background:rgba(248,113,113,0.1);color:#f87171;border-color:#f87171;"
                   data-id="${m.id}" title="Remove">🗑️</button>
           </div>`;

    const displayName = isMe
        ? `${m.name} <span style="opacity:.45;font-size:1.1rem;">(You)</span>`
        : m.name;

    // Dados manipuláveis do Projeto Ativo
    const activeProjectName = m.activeProjectName || "Fênix Cloud";
    const activeProjectProgress = parseInt(m.activeProjectProgress ?? 75);

    return `
    <div class="team-card${isMe?' me':''}" data-member-id="${m.id}"
         style="display:flex;flex-direction:column;gap:0;">
        <div class="card-status ${stClass(m.status)}">${stLabel(m.status)}</div>
        
        <div class="member-header">
            <div class="member-avatar ${avCls}">${m.avatar}</div>
            <div class="member-basic">
                <h3>${displayName}</h3>
                <span>${m.role}</span>
            </div>
        </div>
        
        <div class="member-work">
            <small>Current Task</small>
            <p>${m.currentTask||'—'}</p>
        </div>
        
        <div class="member-tags" style="flex-wrap:wrap;margin-bottom:1.2rem;">${skills}</div>
        
        <div class="member-active-project-section" style="margin-bottom:0.5rem; padding: 1.2rem; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.6rem;">
                <small style="font-size:1rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; display:block;">⚡ Active Project</small>
                <span style="font-size:1.1rem; font-weight:700; color:var(--accent);">${activeProjectProgress}%</span>
            </div>
            <strong style="display:block; font-size:1.3rem; color:var(--text-primary); margin-bottom:0.8rem;">${activeProjectName}</strong>
            <div style="height:6px; background: rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
                <div style="width: ${activeProjectProgress}%; height:100%; background: var(--accent); border-radius:10px; transition: width 0.4s ease;"></div>
            </div>
        </div>

        ${footer}
    </div>`;
}

// ══════════════════════════════════════════════════════════════════════════
// SIDEBAR DIREITA
// ══════════════════════════════════════════════════════════════════════════
function renderTeamSidebar() {
    const sidebar = document.querySelector('.team-sidebar');
    if (!sidebar) return;

    const team = window.store?.getTeam() ?? [];

    sidebar.innerHTML = `
        ${buildStatsCard(team)}
        ${buildProjectsCard(team)}
        ${buildActivityCard()}
    `;
}

function buildStatsCard(team) {
    const online  = team.filter(m => m.status==='online').length;
    const focus   = team.filter(m => m.status==='focus').length;
    const offline = team.filter(m => m.status==='offline').length;
    const total   = team.length;
    const pct     = total ? Math.round(((online+focus)/total)*100) : 0;
    const onlineW = total ? (online/total*100).toFixed(1) : 0;
    const focusW  = total ? (focus/total*100).toFixed(1)  : 0;

    return `
    <div class="dash-card" style="margin-bottom:1.5rem;">
        <div class="card-header" style="margin-bottom:1.8rem;">
            <h3>Team Status</h3>
            <span style="font-size:1.2rem;color:var(--accent);font-weight:700;">${total} members</span>
        </div>

        <div style="display:flex;flex-direction:column;gap:1rem;margin-bottom:1.8rem;">
            ${[
                ['#4ade80', 'Online',     online ],
                ['#f5c842', 'Focus Mode', focus  ],
                ['#888',    'Offline',    offline]
            ].map(([color, label, count]) => `
            <div style="display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:1rem;">
                    <span style="width:9px;height:9px;border-radius:50%;background:${color};
                        display:inline-block;flex-shrink:0;"></span>
                    <span style="font-size:1.3rem;color:var(--text-primary);">${label}</span>
                </div>
                <strong style="font-size:1.4rem;color:var(--text-primary);">${count}</strong>
            </div>`).join('')}
        </div>

        <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="font-size:1.2rem;color:var(--text-secondary);">Presence</span>
                <span style="font-size:1.2rem;font-weight:700;color:var(--accent);">${pct}%</span>
            </div>
            <div style="height:6px;background:var(--border);border-radius:10px;overflow:hidden;display:flex;">
                <div style="width:${onlineW}%;background:#4ade80;border-radius:10px 0 0 10px;"></div>
                <div style="width:${focusW}%;background:#f5c842;"></div>
            </div>
        </div>
    </div>`;
}

function buildProjectsCard(team) {
    const items = PROJECTS.map(p => {
        const active = team.filter(m => m.activeProjectName?.toLowerCase() === p.name.toLowerCase() || p.members.includes(m.avatar));
        const stacks = active.slice(0,4).map((m,i) => `
            <div title="${m.name}" style="width:24px;height:24px;border-radius:6px;
                background:${avatarColor(m.avatar,i)};color:#fff;font-size:1rem;font-weight:700;
                display:flex;align-items:center;justify-content:center;
                border:2px solid var(--bg-card);margin-left:${i>0?'-6px':'0'};">${m.avatar}</div>
        `).join('');

        return `
        <li style="display:flex;align-items:center;justify-content:space-between;
            padding:1.2rem 0;border-bottom:1px solid var(--border);">
            <div style="display:flex;align-items:center;gap:1.2rem;">
                <div style="width:36px;height:36px;border-radius:10px;
                    background:${p.color}18;border:1px solid ${p.color}40;
                    display:flex;align-items:center;justify-content:center;font-size:1.6rem;">${p.icon}</div>
                <div>
                    <strong style="display:block;font-size:1.3rem;color:var(--text-primary);">${p.name}</strong>
                    <span style="font-size:1.1rem;color:var(--text-secondary);">${active.length} active</span>
                </div>
            </div>
            <div style="display:flex;align-items:center;">${stacks}</div>
        </li>`;
    }).join('');

    return `
    <div class="dash-card" style="margin-bottom:1.5rem;">
        <div class="card-header" style="margin-bottom:0.5rem;">
            <h3>Shared Projects</h3>
        </div>
        <ul style="list-style:none;padding:0;margin:0;">${items}</ul>
    </div>`;
}

function buildActivityCard() {
    const items = ACTIVITY.map(a => `
        <div style="display:flex;align-items:flex-start;gap:1.2rem;padding:1rem 0;
            border-bottom:1px solid var(--border);">
            <div style="width:30px;height:30px;border-radius:8px;background:${a.color};
                color:#fff;font-size:1.1rem;font-weight:700;display:flex;align-items:center;
                justify-content:center;flex-shrink:0;">${a.avatar}</div>
            <div style="flex:1;min-width:0;">
                <p style="font-size:1.2rem;color:var(--text-primary);line-height:1.4;margin:0;">
                    <strong>${a.name}</strong>
                    <span style="color:var(--text-secondary);"> ${a.action} </span>
                    <strong>${a.target}</strong>
                </p>
                <small style="font-size:1.1rem;color:var(--text-secondary);">${a.time}</small>
            </div>
        </div>`).join('');

    return `
    <div class="dash-card">
        <div class="card-header" style="margin-bottom:0.5rem;">
            <h3>Recent Activity</h3>
        </div>
        <div>${items}</div>
    </div>`;
}

// ══════════════════════════════════════════════════════════════════════════
// TEAM PRESENCE no Overview
// ══════════════════════════════════════════════════════════════════════════
function renderPresenceOverview() {
    const list = document.querySelector('.presence-list');
    if (!list) return;
    const team = window.store?.getTeam() ?? [];
    const visible = team.filter(m => m.status !== 'offline').slice(0, 4);

    list.innerHTML = visible.map((m, i) => `
        <div class="user-status-row">
            <div class="avatar-small ${m.status==='online'?'online':''}"
                 style="background:${avatarColor(m.avatar,i)};">${m.avatar}</div>
            <div class="user-status-info">
                <strong>${m.name}</strong>
                <span>${m.currentTask||m.role}</span>
            </div>
        </div>`).join('') || `<p style="font-size:1.3rem;color:var(--text-secondary);">No members online.</p>`;
}

// ══════════════════════════════════════════════════════════════════════════
// TOOLBAR (busca + filtros)
// ══════════════════════════════════════════════════════════════════════════
function injectToolbar() {
    if (document.getElementById('teamToolbar')) return;
    const section = document.getElementById('section-team');
    if (!section) return;

    const tb = document.createElement('div');
    tb.id = 'teamToolbar';
    tb.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:1.5rem;margin-bottom:2.5rem;flex-wrap:wrap;';
    tb.innerHTML = `
        <div class="search-box" style="max-width:320px;flex:1;">
            <span>🔍</span>
            <input type="text" id="teamSearchInput" placeholder="Search by name, role or skill...">
        </div>
        <div id="teamFilterGroup" style="display:flex;gap:0.8rem;flex-wrap:wrap;">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="online">🟢 Online</button>
            <button class="filter-btn" data-filter="focus">🟡 Focus</button>
            <button class="filter-btn" data-filter="offline">⚫ Offline</button>
        </div>`;

    const layout = section.querySelector('.team-layout');
    if (layout) section.insertBefore(tb, layout);

    tb.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            tb.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            teamFilterVal = btn.dataset.filter;
            renderTeamGrid();
        });
    });

    document.getElementById('teamSearchInput').addEventListener('input', e => {
        teamSearchVal = e.target.value;
        renderTeamGrid();
    });
}

// ══════════════════════════════════════════════════════════════════════════
// MODAIS
// ══════════════════════════════════════════════════════════════════════════
function openMemberModal(memberId = null) {
    const m      = memberId && window.store ? window.store.getTeamMemberById(memberId) : null;
    const isEdit = !!m;

    _setModal(isEdit ? 'Edit Member' : 'Invite Member', `
        <form class="modal-form" id="teamMemberForm">
            <div>
                <label>Name</label>
                <input type="text" name="name" value="${m?.name??''}" required placeholder="Member name">
            </div>
            <div>
                <label>Role</label>
                <input type="text" name="role" value="${m?.role??''}" required placeholder="e.g. Frontend Developer">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div>
                    <label>Status</label>
                    <select name="status">
                        <option value="online"  ${m?.status==='online' ?'selected':''}>🟢 Online</option>
                        <option value="focus"   ${m?.status==='focus'  ?'selected':''}>🟡 Focus Mode</option>
                        <option value="offline" ${m?.status==='offline'?'selected':''}>⚫ Offline</option>
                    </select>
                </div>
                <div>
                    <label>Avatar letter</label>
                    <input type="text" name="avatar" value="${m?.avatar??''}" maxlength="1" required placeholder="e.g. A">
                </div>
            </div>
            <div>
                <label>Current Task</label>
                <input type="text" name="currentTask" value="${m?.currentTask||''}" placeholder="What are they working on?">
            </div>
            
            <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:1rem;">
                <div>
                    <label>Active Project Name</label>
                    <input type="text" name="activeProjectName" value="${m?.activeProjectName || 'Fênix Cloud'}" placeholder="e.g. Snap Remote">
                </div>
                <div>
                    <label>Progress (%)</label>
                    <input type="number" name="activeProjectProgress" min="0" max="100" value="${m?.activeProjectProgress ?? 75}">
                </div>
            </div>

            <div>
                <label>Skills <span style="color:var(--text-secondary);font-weight:400;">(comma separated)</span></label>
                <input type="text" name="skills" value="${(m?.skills??[]).join(', ')}" placeholder="React, TypeScript, CSS">
            </div>
            <button type="submit" class="btn-submit-modal">
                ${isEdit ? '💾 Save Changes' : '➕ Add to Team'}
            </button>
        </form>`);

    document.getElementById('teamMemberForm').addEventListener('submit', e => {
        e.preventDefault();
        const data  = Object.fromEntries(new FormData(e.target));
        data.skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
        if (isEdit) window.store.updateTeamMember(memberId, data);
        else        window.store.addTeamMember(data);
        _closeModal();
        renderTeam();
        showTeamToast(isEdit ? '✅ Member updated!' : '✅ Member added to the team!');
    });
}

function confirmDelete(id) {
    const m = window.store?.getTeamMemberById(id);
    if (!m) return;

    _setModal('Remove Member', `
        <div style="text-align:center;padding:1rem 0;">
            <p style="font-size:1.4rem;color:var(--text-primary);font-weight:600;margin-bottom:0.5rem;">${m.name}</p>
            <p style="font-size:1.3rem;color:var(--text-secondary);margin-bottom:2.4rem;">Remove this member from the team?</p>
            <div style="display:flex;gap:1rem;justify-content:center;">
                <button class="btn-submit-modal" id="tdConfirm"
                    style="background:#ef4444;max-width:140px;">Remove</button>
                <button class="btn-submit-modal" id="tdCancel"
                    style="background:var(--border);color:var(--text-primary);max-width:140px;">Cancel</button>
            </div>
        </div>`);

    document.getElementById('tdConfirm').addEventListener('click', () => {
        window.store.deleteTeamMember(id);
        _closeModal();
        renderTeam();
        showTeamToast('🗑️ Member removed.');
    });
    document.getElementById('tdCancel').addEventListener('click', _closeModal);
}

function openMsgModal(name) {
    _setModal(`Message to ${name}`, `
        <form class="modal-form" id="teamMsgForm">
            <div>
                <label>Message</label>
                <textarea name="msg" rows="4" placeholder="Write your message..."></textarea>
            </div>
            <button type="submit" class="btn-submit-modal">Send Message</button>
        </form>`);

    document.getElementById('teamMsgForm').addEventListener('submit', e => {
        e.preventDefault();
        _closeModal();
        showTeamToast(`✅ Message sent to ${name}!`);
    });
}

// ── Helpers de modal ───────────────────────────────────────────────────────
function _setModal(title, body) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML    = body;
    document.getElementById('modalOverlay').classList.add('open');
}
function _closeModal() {
    document.getElementById('modalOverlay').classList.remove('remove');
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('modalBody').innerHTML = '';
}

// ── Toast ──────────────────────────────────────────────────────────────────
function showTeamToast(msg) {
    if (typeof showSuccessToast === 'function') { showSuccessToast(msg); return; }
    document.querySelector('.success-toast')?.remove();
    const t = document.createElement('div');
    t.className   = 'success-toast';
    t.textContent = msg;
    Object.assign(t.style, {
        position:'fixed', bottom:'2.5rem', right:'2.5rem',
        background:'#4ade80', color:'#fff', padding:'1.2rem 2.4rem',
        borderRadius:'12px', fontFamily:"'Epilogue',sans-serif",
        fontSize:'1.4rem', fontWeight:'600',
        boxShadow:'0 8px 30px rgba(0,0,0,.2)', zIndex:'9999'
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
}

// ══════════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('btnInviteMember')
        ?.addEventListener('click', () => openMemberModal(null));

    document.getElementById('modalClose')
        ?.addEventListener('click', _closeModal);
    document.getElementById('modalOverlay')
        ?.addEventListener('click', e => {
            if (e.target === document.getElementById('modalOverlay')) _closeModal();
        });

    function tryInit() {
        if (!window.store) { 
            setTimeout(tryInit, 60); 
            return; 
        }

        if (typeof window.store.getTeam !== 'function') {
            window.store._localTeamData = [
                { id: 1, name: "Lucas", role: "Front-end Developer", avatar: "L", status: "online", currentTask: "Working on Fênix UI Bento Grid", skills: ["React", "JavaScript", "Tailwind CSS"], activeProjectName: "Fênix UI", activeProjectProgress: 85 },
                { id: 2, name: "Aline", role: "UI/UX Designer", avatar: "A", status: "online", currentTask: "Designing Design System tokens", skills: ["Figma", "Motion"], activeProjectName: "Fênix UI", activeProjectProgress: 40 },
                { id: 3, name: "Sophia", role: "Product Manager", avatar: "S", status: "focus", currentTask: "Planning Sprint Q3", skills: ["Agile", "Strategy"], activeProjectName: "Fênix Cloud", activeProjectProgress: 90 },
                { id: 4, name: "Sam", role: "Backend Engineer", avatar: "B", status: "offline", currentTask: "API Endpoint Security", skills: ["Node.js", "SQL"], activeProjectName: "Snap Remote", activeProjectProgress: 60 }
            ];

            window.store.getTeam = function() { return this._localTeamData; };
            window.store.getTeamMemberById = function(id) { return this._localTeamData.find(m => m.id === id); };
            window.store.addTeamMember = function(memberData) { memberData.id = Date.now(); this._localTeamData.push(memberData); };
            window.store.updateTeamMember = function(id, updatedData) {
                const index = this._localTeamData.findIndex(m => m.id === id);
                if (index !== -1) this._localTeamData[index] = { ...this._localTeamData[index], ...updatedData };
            };
            window.store.deleteTeamMember = function(id) { this._localTeamData = this._localTeamData.filter(m => m.id !== id); };
        }

        injectToolbar();
        renderTeam();
    }
    tryInit();
});