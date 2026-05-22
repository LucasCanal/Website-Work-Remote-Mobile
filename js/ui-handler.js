class UIHandler {
    constructor(store) {
        this.store = store;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderAllSections();
        console.log("✅ UIHandler inicializado");
    }

    // ==================== EVENT LISTENERS ====================

    setupEventListeners() {
        const btnAddTask = document.getElementById("btnAddTask");
        if (btnAddTask) {
            btnAddTask.removeEventListener("click", addTask);
            btnAddTask.addEventListener("click", () => this.openTaskModal());
        }

        const quickAddBtn = document.getElementById("quickAddBtn");
        if (quickAddBtn) {
            quickAddBtn.addEventListener("click", () => this.openTaskModal());
        }

        const btnNewEvent = document.getElementById("btnNewEvent");
        if (btnNewEvent) {
            btnNewEvent.addEventListener("click", () => this.openEventModal());
        }

        const btnNewReminder = document.getElementById("btnNewReminder");
        if (btnNewReminder) {
            btnNewReminder.addEventListener("click", () => this.openReminderModal());
        }

        const btnInviteMember = document.getElementById("btnInviteMember");
        if (btnInviteMember) {
            btnInviteMember.addEventListener("click", () => this.openTeamModal());
        }

        const btnExportData = document.getElementById("btnExportData");
        if (btnExportData) {
            btnExportData.addEventListener("click", exportDashboardData);
        }

        const modalClose = document.getElementById("modalClose");
        if (modalClose) {
            modalClose.addEventListener("click", () => this.closeModal());
        }

        const modalOverlay = document.getElementById("modalOverlay");
        if (modalOverlay) {
            modalOverlay.addEventListener("click", (e) => {
                if (e.target === modalOverlay) this.closeModal();
            });
        }
    }

    // ==================== MODAL MANAGEMENT ====================

    openModal(title, formHTML) {
        const modal        = document.getElementById("modal");
        const modalOverlay = document.getElementById("modalOverlay");
        const modalTitle   = document.getElementById("modalTitle");
        const modalBody    = document.getElementById("modalBody");

        if (modalTitle) modalTitle.textContent = title;
        if (modalBody)  modalBody.innerHTML    = formHTML;
        if (modalOverlay) modalOverlay.classList.add("open");
    }

    closeModal() {
        const modalOverlay = document.getElementById("modalOverlay");
        if (modalOverlay) {
            modalOverlay.classList.remove("open");
            const body = document.getElementById("modalBody");
            if (body) body.innerHTML = "";
        }
    }

    // Expõe closeModal para patches externos (ex: team.js)
    _closeModal() {
        this.closeModal();
    }

    // ==================== TASK FORMS ====================

    openTaskModal(taskId = null) {
        const task   = taskId ? this.store.getTaskById(taskId) : null;
        const isEdit = !!task;

        const form = `
            <form class="modal-form" id="taskForm">
                <div>
                    <label>Título</label>
                    <input type="text" name="title" value="${task?.title || ''}" required placeholder="Título da tarefa">
                </div>
                <div>
                    <label>Descrição</label>
                    <textarea name="description" placeholder="Descreva a tarefa...">${task?.description || ''}</textarea>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                    <div>
                        <label>Prioridade</label>
                        <select name="priority" required>
                            <option value="low"    ${task?.priority==='low'    ?'selected':''}>Baixa</option>
                            <option value="medium" ${task?.priority==='medium' ?'selected':''}>Média</option>
                            <option value="high"   ${task?.priority==='high'   ?'selected':''}>Alta</option>
                            <option value="urgent" ${task?.priority==='urgent' ?'selected':''}>Urgente</option>
                        </select>
                    </div>
                    <div>
                        <label>Status</label>
                        <select name="status" required>
                            <option value="todo"  ${task?.status==='todo'  ?'selected':''}>A Fazer</option>
                            <option value="doing" ${task?.status==='doing' ?'selected':''}>Fazendo</option>
                            <option value="done"  ${task?.status==='done'  ?'selected':''}>Pronto</option>
                        </select>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                    <div>
                        <label>Categoria</label>
                        <input type="text" name="category" value="${task?.category || ''}" placeholder="Ex: Frontend, Backend">
                    </div>
                    <div>
                        <label>Data de Vencimento</label>
                        <input type="text" name="dueDate" value="${task?.dueDate || ''}" placeholder="Ex: May 16, 2026">
                    </div>
                </div>
                <button type="submit" class="btn-submit-modal">
                    ${isEdit ? 'Atualizar Tarefa' : 'Criar Tarefa'}
                </button>
            </form>
        `;

        this.openModal(isEdit ? 'Editar Tarefa' : 'Nova Tarefa', form);

        document.getElementById("taskForm").addEventListener("submit", (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            if (isEdit) this.store.updateTask(taskId, data);
            else        this.store.addTask(data);
            this.closeModal();
            this.renderTasks();
        });
    }

    // ==================== REMINDER FORMS ====================

    openReminderModal(reminderId = null) {
        const reminder = reminderId ? this.store.getReminderById(reminderId) : null;
        const isEdit   = !!reminder;

        const form = `
            <form class="modal-form" id="reminderForm">
                <div>
                    <label>Título</label>
                    <input type="text" name="title" value="${reminder?.title || ''}" required placeholder="Título do lembrete">
                </div>
                <div>
                    <label>Descrição</label>
                    <textarea name="description" placeholder="Detalhes do lembrete">${reminder?.description || ''}</textarea>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                    <div>
                        <label>Hora</label>
                        <input type="time" name="time" value="${reminder?.time || '10:00'}" required>
                    </div>
                    <div>
                        <label>Prioridade</label>
                        <select name="priority" required>
                            <option value="low"    ${reminder?.priority==='low'    ?'selected':''}>Baixa</option>
                            <option value="medium" ${reminder?.priority==='medium' ?'selected':''}>Média</option>
                            <option value="high"   ${reminder?.priority==='high'   ?'selected':''}>Alta</option>
                            <option value="urgent" ${reminder?.priority==='urgent' ?'selected':''}>Urgente</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label>Data</label>
                    <input type="text" name="date" value="${reminder?.date || ''}" placeholder="Ex: May 15, 2026" required>
                </div>
                <button type="submit" class="btn-submit-modal">
                    ${isEdit ? 'Atualizar Lembrete' : 'Criar Lembrete'}
                </button>
            </form>
        `;

        this.openModal(isEdit ? 'Editar Lembrete' : 'Novo Lembrete', form);

        document.getElementById("reminderForm").addEventListener("submit", (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            if (isEdit) this.store.updateReminder(reminderId, data);
            else        this.store.addReminder(data);
            this.closeModal();
            this.renderReminders();
        });
    }

    // ==================== EVENT FORMS ====================

    openEventModal(eventId = null) {
        const event  = eventId ? this.store.getEventById(eventId) : null;
        const isEdit = !!event;

        const form = `
            <form class="modal-form" id="eventForm">
                <div>
                    <label>Título do Evento</label>
                    <input type="text" name="title" value="${event?.title || ''}" required placeholder="Título">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                    <div>
                        <label>Dia</label>
                        <input type="number" name="date" min="1" max="31" value="${event?.date || ''}" required placeholder="1-31">
                    </div>
                    <div>
                        <label>Mês</label>
                        <select name="month" required>
                            <option value="April"  ${event?.month==='April'  ?'selected':''}>Abril</option>
                            <option value="May"    ${event?.month==='May'    ?'selected':''}>Maio</option>
                            <option value="June"   ${event?.month==='June'   ?'selected':''}>Junho</option>
                            <option value="July"   ${event?.month==='July'   ?'selected':''}>Julho</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label>Hora</label>
                    <input type="text" name="time" value="${event?.time || ''}" placeholder="Ex: 10:00 AM">
                </div>
                <div>
                    <label>Tipo</label>
                    <select name="category" required>
                        <option value="work"     ${event?.category==='work'     ?'selected':''}>Trabalho</option>
                        <option value="personal" ${event?.category==='personal' ?'selected':''}>Pessoal</option>
                        <option value="focus"    ${event?.category==='focus'    ?'selected':''}>Foco</option>
                    </select>
                </div>
                <button type="submit" class="btn-submit-modal">
                    ${isEdit ? 'Atualizar Evento' : 'Criar Evento'}
                </button>
            </form>
        `;

        this.openModal(isEdit ? 'Editar Evento' : 'Novo Evento', form);

        document.getElementById("eventForm").addEventListener("submit", (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            if (isEdit) this.store.updateEvent(eventId, data);
            else        this.store.addEvent(data);
            this.closeModal();
            this.renderCalendar();
        });
    }

    // ==================== TEAM FORMS ====================

    openTeamModal(memberId = null) {
        const member = memberId ? this.store.getTeamMemberById(memberId) : null;
        const isEdit = !!member;

        const form = `
            <form class="modal-form" id="teamForm">
                <div>
                    <label>Nome</label>
                    <input type="text" name="name" value="${member?.name || ''}" required placeholder="Nome do membro">
                </div>
                <div>
                    <label>Cargo</label>
                    <input type="text" name="role" value="${member?.role || ''}" required placeholder="Ex: Frontend Developer">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                    <div>
                        <label>Status</label>
                        <select name="status" required>
                            <option value="online"  ${member?.status==='online'  ?'selected':''}>🟢 Online</option>
                            <option value="offline" ${member?.status==='offline' ?'selected':''}>⚫ Offline</option>
                            <option value="focus"   ${member?.status==='focus'   ?'selected':''}>🟡 Focus Mode</option>
                        </select>
                    </div>
                    <div>
                        <label>Avatar (1 letra)</label>
                        <input type="text" name="avatar" value="${member?.avatar || ''}" maxlength="1" placeholder="Ex: L" required>
                    </div>
                </div>
                <div>
                    <label>Tarefa Atual</label>
                    <input type="text" name="currentTask" value="${member?.currentTask || ''}" placeholder="No que está trabalhando?">
                </div>
                <div>
                    <label>Skills (separadas por vírgula)</label>
                    <input type="text" name="skills" value="${member?.skills?.join(', ') || ''}" placeholder="React, TypeScript, CSS">
                </div>
                <button type="submit" class="btn-submit-modal">
                    ${isEdit ? '💾 Atualizar Membro' : '➕ Adicionar Membro'}
                </button>
            </form>
        `;

        this.openModal(isEdit ? 'Editar Membro' : 'Convidar Membro', form);

        document.getElementById("teamForm").addEventListener("submit", (e) => {
            e.preventDefault();
            const data   = Object.fromEntries(new FormData(e.target));
            data.skills  = data.skills.split(',').map(s => s.trim()).filter(s => s);

            if (isEdit) this.store.updateTeamMember(memberId, data);
            else        this.store.addTeamMember(data);

            this.closeModal();
            this.renderTeam();

            if (typeof showSuccessToast === 'function') {
                showSuccessToast(isEdit ? '✅ Membro atualizado!' : '✅ Membro adicionado à equipe!');
            }
        });
    }

    // ==================== RENDERING ====================

    renderAllSections() {
        this.renderTasks();
        this.renderReminders();
        this.renderCalendar();
        this.renderTeam();
        this.renderKPIs();
    }

    renderTasks() {
        if (typeof renderTasks === 'function') renderTasks();
    }

    renderReminders() {
        const reminders    = this.store.getReminders();
        const reminderStack = document.querySelector('.reminder-stack');

        if (reminderStack) {
            reminderStack.innerHTML = reminders.map(reminder => `
                <div class="reminder-item ${reminder.priority}">
                    <div class="reminder-time">${reminder.time}</div>
                    <div class="reminder-content">
                        <h4>${reminder.title}</h4>
                        <p>${reminder.description}</p>
                    </div>
                    <div class="reminder-actions">
                        <button class="action-btn reminder-edit"   data-id="${reminder.id}">Editar</button>
                        <button class="action-btn reminder-delete" data-id="${reminder.id}">Deletar</button>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.reminder-edit').forEach(btn => {
                btn.addEventListener('click', () => this.openReminderModal(parseInt(btn.dataset.id)));
            });

            document.querySelectorAll('.reminder-delete').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (confirm('Deletar este lembrete?')) {
                        this.store.deleteReminder(parseInt(btn.dataset.id));
                        this.renderReminders();
                    }
                });
            });
        }
    }

    renderCalendar() {
        const events      = this.store.getEvents();
        const calendarGrid = document.querySelector('.calendar-grid');

        if (calendarGrid) {
            const days = calendarGrid.querySelectorAll('.day:not(.empty)');
            days.forEach(day => {
                day.querySelectorAll('.event-pill').forEach(pill => pill.remove());
                const dayNum = day.querySelector('.day-num')?.textContent.trim();
                if (dayNum && !isNaN(dayNum)) {
                    events.filter(e => e.date === parseInt(dayNum)).forEach(event => {
                        const pill = document.createElement('div');
                        pill.className        = `event-pill ${event.category}`;
                        pill.dataset.eventId  = event.id;
                        pill.textContent      = event.title;
                        pill.style.cursor     = 'pointer';
                        pill.addEventListener('dblclick', () => this.openEventModal(event.id));
                        day.appendChild(pill);
                    });
                }
            });
        }
    }

    renderTeam() {
        // Delegado ao team.js se disponível
        if (typeof renderTeam === 'function') {
            renderTeam();
        }
    }

    renderKPIs() {
        const kpis    = this.store.getKPIs();
        const kpiGrid = document.querySelector('.kpi-grid');

        if (kpiGrid) {
            const cards   = kpiGrid.querySelectorAll('.kpi-card');
            const kpiKeys = Object.keys(kpis);

            cards.forEach((card, index) => {
                if (!kpiKeys[index]) return;
                const kpi      = kpis[kpiKeys[index]];
                const valueEl  = card.querySelector('.kpi-value');
                const progressEl = card.querySelector('.kpi-progress-bar');
                if (valueEl)    valueEl.textContent    = kpi.value;
                if (progressEl && kpi.progress) progressEl.style.width = kpi.progress + '%';
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.store) {
        const handler = new UIHandler(store);
        window.uiHandler = handler;
        console.log('✅ UI Handler inicializado com sucesso');
    }
});