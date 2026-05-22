class DataStore {
    constructor() {
        this.tasks = [];
        this.reminders = [];
        this.events = [];
        this.team = [];
        this.kpis = {};
        this.metrics = {};

        const userEmail = localStorage.getItem('userEmail') || 'guest';
        this.storageKey = `dashboardData_${userEmail}`;

        const hasStoredData = localStorage.getItem(this.storageKey);

        if (hasStoredData) {
            // Usuário já tem dados salvos — carrega os dele
            this.loadFromStorage();
        } else {
            // Primeira vez desse usuário — inicializa com dados limpos/padrão
            this.initializeData();
            this.saveToStorage();
        }
    }

    // ==================== INITIALIZATION ====================

    initializeData() {
        this.tasks = [];

        this.reminders = [];

        this.events = [];

        this.team = [];

        this.kpis = {
            tasksCompleted:   { value: 0,     trend: 0, progress: 0  },
            dayStreak:        { value: 0,     trend: 0, progress: 0  },
            focusTime:        { value: "0h",  trend: 0, progress: 0  },
            sprintCompletion: { value: "0%",  trend: 0, progress: 0  }
        };

        this.metrics = {
            uptime:       "—",
            responseTime: "—",
            activeUsers:  "—",
            errorRate:    "—"
        };
    }

    // ==================== TASKS CRUD ====================

    getTasks() {
        return this.tasks;
    }

    getTaskById(id) {
        return this.tasks.find(t => t.id === id);
    }

    addTask(task) {
        const newTask = {
            id: Date.now(),
            ...task,
            status:     task.status     || "todo",
            priority:   task.priority   || "medium",
            category:   task.category   || "General",
            assignedTo: task.assignedTo || "?",
            createdAt:  new Date()
        };
        this.tasks.push(newTask);
        this.saveToStorage();
        return newTask;
    }

    updateTask(id, updates) {
        const task = this.getTaskById(id);
        if (task) {
            Object.assign(task, updates);
            this.saveToStorage();
        }
        return task;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToStorage();
    }

    getTasksByStatus(status) {
        return this.tasks.filter(t => t.status === status);
    }

    getTasksByPriority(priority) {
        return this.tasks.filter(t => t.priority === priority);
    }

    // ==================== REMINDERS CRUD ====================

    getReminders() {
        return this.reminders;
    }

    getReminderById(id) {
        return this.reminders.find(r => r.id === id);
    }

    addReminder(reminder) {
        const newReminder = {
            id: Date.now(),
            ...reminder,
            createdAt: new Date()
        };
        this.reminders.push(newReminder);
        this.saveToStorage();
        return newReminder;
    }

    updateReminder(id, updates) {
        const reminder = this.getReminderById(id);
        if (reminder) {
            Object.assign(reminder, updates);
            this.saveToStorage();
        }
        return reminder;
    }

    deleteReminder(id) {
        this.reminders = this.reminders.filter(r => r.id !== id);
        this.saveToStorage();
    }

    getRemindersByDate(date) {
        return this.reminders.filter(r => r.date === date);
    }

    // ==================== EVENTS CRUD ====================

    getEvents() {
        return this.events;
    }

    getEventById(id) {
        return this.events.find(e => e.id === id);
    }

    addEvent(event) {
        const newEvent = {
            id: Date.now(),
            ...event,
            createdAt: new Date()
        };
        this.events.push(newEvent);
        this.saveToStorage();
        return newEvent;
    }

    updateEvent(id, updates) {
        const event = this.getEventById(id);
        if (event) {
            Object.assign(event, updates);
            this.saveToStorage();
        }
        return event;
    }

    deleteEvent(id) {
        this.events = this.events.filter(e => e.id !== id);
        this.saveToStorage();
    }

    getEventsByDate(date) {
        return this.events.filter(e => e.date === date);
    }

    // ==================== TEAM CRUD ====================

    getTeam() {
        return this.team;
    }

    getTeamMemberById(id) {
        return this.team.find(m => m.id === id);
    }

    addTeamMember(member) {
        const newMember = {
            id: Date.now(),
            ...member
        };
        this.team.push(newMember);
        this.saveToStorage();
        return newMember;
    }

    updateTeamMember(id, updates) {
        const member = this.getTeamMemberById(id);
        if (member) {
            Object.assign(member, updates);
            this.saveToStorage();
        }
        return member;
    }

    deleteTeamMember(id) {
        this.team = this.team.filter(m => m.id !== id);
        this.saveToStorage();
    }

    // ==================== KPIs & METRICS ====================

    getKPIs() {
        return this.kpis;
    }

    updateKPI(key, value) {
        if (this.kpis[key]) {
            this.kpis[key] = { ...this.kpis[key], ...value };
            this.saveToStorage();
        }
        return this.kpis[key];
    }

    getMetrics() {
        return this.metrics;
    }

    updateMetrics(updates) {
        this.metrics = { ...this.metrics, ...updates };
        this.saveToStorage();
    }

    // ==================== STATS ====================

    getStats() {
        return {
            totalTasks:     this.tasks.length,
            completedTasks: this.tasks.filter(t => t.status === "done").length,
            pendingTasks:   this.tasks.filter(t => t.status !== "done").length,
            todoCount:      this.tasks.filter(t => t.status === "todo").length,
            doingCount:     this.tasks.filter(t => t.status === "doing").length,
            doneCount:      this.tasks.filter(t => t.status === "done").length,
            totalReminders: this.reminders.length,
            totalEvents:    this.events.length,
            teamMembers:    this.team.length,
            onlineMembers:  this.team.filter(m => m.status === "online").length
        };
    }

    // ==================== STORAGE ====================

    saveToStorage() {
        const data = {
            tasks:     this.tasks,
            reminders: this.reminders,
            events:    this.events,
            team:      this.team,
            kpis:      this.kpis,
            metrics:   this.metrics
        };
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    loadFromStorage() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                const data    = JSON.parse(stored);
                this.tasks     = data.tasks     || [];
                this.reminders = data.reminders || [];
                this.events    = data.events    || [];
                this.team      = data.team      || [];
                this.kpis      = data.kpis      || this.kpis;
                this.metrics   = data.metrics   || this.metrics;
            } catch (e) {
                console.error("Erro ao carregar dados:", e);
                this.initializeData();
            }
        }
    }

    // Limpa apenas os dados desse usuário no localStorage
    clearUserData() {
        localStorage.removeItem(this.storageKey);
        this.initializeData();
    }

    // Reseta os dados e recria os padrão para esse usuário
    resetData() {
        this.initializeData();
        this.saveToStorage();
    }
}

window.store = new DataStore();