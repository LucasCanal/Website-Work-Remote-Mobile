/**
 * TASKS MANAGER - Filtros, Busca e Contadores
 * ✅ Isolamento por usuário: cada usuário tem suas próprias tarefas
 */

// ✅ Chave de storage isolada por usuário — igual ao data-store.js
const _userEmail  = localStorage.getItem('userEmail') || 'guest';
const _tasksKey   = `tasks_${_userEmail}`;

// ✅ Sem tarefas padrão hardcoded — novo usuário começa com lista vazia
let tasks = JSON.parse(localStorage.getItem(_tasksKey)) || [];

let currentFilter = "all"; // "all" | "todo" | "done"
let searchQuery   = "";

// ==================== LOCALSTORAGE ====================

function saveTasks() {
    // ✅ Salva na chave do usuário, não mais em "tasks" genérico
    localStorage.setItem(_tasksKey, JSON.stringify(tasks));

    // Sincroniza com o data-store também
    if (window.store) {
        tasks.forEach(task => {
            const existing = store.getTaskById(task.id);
            if (!existing) store.addTask(task);
            else store.updateTask(task.id, task);
        });
    }
}

// ==================== CRIAR CARD ====================

function createTaskCard(task) {
    // ✅ Avatar dinâmico: usa a inicial do usuário logado em vez de "L" fixo
    const userInitial = localStorage.getItem('userFullname')?.charAt(0).toUpperCase() || '?';

    return `
        <div class="task-card" data-task-id="${task.id}" draggable="true">
            <div class="task-tags">
                <span class="tag priority-${task.priority}">${(task.priority || "low").toUpperCase()}</span>
                <span class="tag category">${task.category}</span>
            </div>
            <h4>${task.title}</h4>
            <p>${task.description}</p>
            <div class="task-footer">
                <div class="task-date">📅 ${new Date(task.dueDate).toLocaleDateString('pt-BR')}</div>
                <div class="task-user">${task.assignedTo || userInitial}</div>
            </div>
            <div class="task-actions">
                <button class="task-edit"   onclick="editTaskModal(${task.id})"     title="Editar">✏️</button>
                <button class="task-delete" onclick="deleteTaskConfirm(${task.id})" title="Deletar">🗑️</button>
                <button class="task-toggle" onclick="toggleTaskStatus(${task.id})"  title="Próximo status">→</button>
            </div>
        </div>
    `;
}

// ==================== RENDERIZAR ====================

function renderTasks() {
    const todoList  = document.getElementById("todoList");
    const doingList = document.getElementById("doingList");
    const doneList  = document.getElementById("doneList");

    todoList.innerHTML = doingList.innerHTML = doneList.innerHTML = "";

    // 1. Filtro de aba
    let filtered = tasks.filter(task => {
        if (currentFilter === "todo") return task.status === "todo";
        if (currentFilter === "done") return task.status === "done";
        return true;
    });

    // 2. Filtro de busca por texto
    if (searchQuery.length > 0) {
        filtered = filtered.filter(task =>
            task.title.toLowerCase().includes(searchQuery)
        );
    }

    // 3. Distribui nos grupos
    filtered.forEach(task => {
        const html = createTaskCard(task);
        if      (task.status === "todo")  todoList.innerHTML  += html;
        else if (task.status === "doing") doingList.innerHTML += html;
        else if (task.status === "done")  doneList.innerHTML  += html;
    });

    // 4. Contadores
    const todoCount  = filtered.filter(t => t.status === "todo").length;
    const doingCount = filtered.filter(t => t.status === "doing").length;
    const doneCount  = filtered.filter(t => t.status === "done").length;

    const badges = document.querySelectorAll(".count-badge");
    if (badges[0]) badges[0].textContent = todoCount;
    if (badges[1]) badges[1].textContent = doingCount;
    if (badges[2]) badges[2].textContent = doneCount;

    // Badge do nav sidebar (total pendente)
    const navBadge = document.querySelector('.nav-item[data-section="todos"] .nav-badge');
    if (navBadge) navBadge.textContent = tasks.filter(t => t.status !== "done").length;

    // 5. Drag & Drop
    setupDragAndDrop();
}

// ==================== FILTROS E BUSCA ====================

function setupFilters() {
    const filterBtns = document.querySelectorAll(".filter-btn");

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const label = btn.textContent.trim().toLowerCase();
            if      (label === "to do") currentFilter = "todo";
            else if (label === "done")  currentFilter = "done";
            else                        currentFilter = "all";

            renderTasks();
        });
    });

    document.addEventListener("input", e => {
        const input = e.target.closest(".todo-toolbar .search-box input");
        if (!input) return;
        searchQuery = input.value.trim().toLowerCase();
        renderTasks();
    });
}

// ==================== MODAL: ADICIONAR ====================

function openAddTaskModal() {
    // ✅ Avatar usa inicial do usuário logado
    const userInitial = localStorage.getItem('userFullname')?.charAt(0).toUpperCase() || '?';

    const modalOverlay = document.getElementById('modalOverlay');
    document.getElementById('modalTitle').textContent = '➕ Adicionar Nova Tarefa';
    document.getElementById('modalBody').innerHTML = `
        <form id="taskForm" class="modal-form">
            <div>
                <label for="taskTitle">Título *</label>
                <input type="text" id="taskTitle" required placeholder="Ex: Refatorar código">
            </div>
            <div>
                <label for="taskDescription">Descrição</label>
                <textarea id="taskDescription" placeholder="Descreva a tarefa..." rows="3"></textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div>
                    <label for="taskPriority">Prioridade *</label>
                    <select id="taskPriority" required>
                        <option value="low">🟢 Low</option>
                        <option value="medium" selected>🟡 Medium</option>
                        <option value="high">🟠 High</option>
                        <option value="urgent">🔴 Urgent</option>
                    </select>
                </div>
                <div>
                    <label for="taskCategory">Categoria *</label>
                    <input type="text" id="taskCategory" required placeholder="Ex: Design, Dev">
                </div>
            </div>
            <div>
                <label for="taskDueDate">Data de Vencimento *</label>
                <input type="date" id="taskDueDate" required>
            </div>
            <button type="submit" class="btn-submit-modal">Criar Tarefa</button>
        </form>
    `;
    modalOverlay.classList.add('open');

    document.getElementById('taskForm').addEventListener('submit', e => {
        e.preventDefault();
        const title    = document.getElementById('taskTitle').value.trim();
        const desc     = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const category = document.getElementById('taskCategory').value.trim();
        const dueDate  = document.getElementById('taskDueDate').value;

        if (!title || !category || !dueDate) {
            showSuccessToast('⚠️ Preencha todos os campos obrigatórios!');
            return;
        }

        // ✅ assignedTo usa a inicial do usuário logado
        tasks.push({
            id:          Date.now(),
            title,
            description: desc,
            status:      "todo",
            priority,
            category,
            dueDate:     new Date(dueDate).toISOString(),
            assignedTo:  userInitial
        });

        saveTasks();
        renderTasks();
        closeModal();
        showSuccessToast('✅ Tarefa criada com sucesso!');
    });
}

// ==================== MODAL: EDITAR ====================

function editTaskModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const dueDateVal = new Date(task.dueDate).toISOString().split('T')[0];
    document.getElementById('modalTitle').textContent = '✏️ Editar Tarefa';
    document.getElementById('modalBody').innerHTML = `
        <form id="taskForm" class="modal-form">
            <div>
                <label for="taskTitle">Título *</label>
                <input type="text" id="taskTitle" required value="${task.title}">
            </div>
            <div>
                <label for="taskDescription">Descrição</label>
                <textarea id="taskDescription" rows="3">${task.description}</textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div>
                    <label for="taskPriority">Prioridade *</label>
                    <select id="taskPriority" required>
                        <option value="low"    ${task.priority==='low'    ?'selected':''}>🟢 Low</option>
                        <option value="medium" ${task.priority==='medium' ?'selected':''}>🟡 Medium</option>
                        <option value="high"   ${task.priority==='high'   ?'selected':''}>🟠 High</option>
                        <option value="urgent" ${task.priority==='urgent' ?'selected':''}>🔴 Urgent</option>
                    </select>
                </div>
                <div>
                    <label for="taskCategory">Categoria *</label>
                    <input type="text" id="taskCategory" required value="${task.category}">
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div>
                    <label for="taskStatus">Status *</label>
                    <select id="taskStatus" required>
                        <option value="todo"  ${task.status==='todo'  ?'selected':''}>📋 To Do</option>
                        <option value="doing" ${task.status==='doing' ?'selected':''}>⚙️ Doing</option>
                        <option value="done"  ${task.status==='done'  ?'selected':''}>✅ Done</option>
                    </select>
                </div>
                <div>
                    <label for="taskDueDate">Vencimento *</label>
                    <input type="date" id="taskDueDate" required value="${dueDateVal}">
                </div>
            </div>
            <button type="submit" class="btn-submit-modal">💾 Salvar Alterações</button>
        </form>
    `;
    document.getElementById('modalOverlay').classList.add('open');

    document.getElementById('taskForm').addEventListener('submit', e => {
        e.preventDefault();
        task.title       = document.getElementById('taskTitle').value.trim();
        task.description = document.getElementById('taskDescription').value.trim();
        task.priority    = document.getElementById('taskPriority').value;
        task.category    = document.getElementById('taskCategory').value.trim();
        task.status      = document.getElementById('taskStatus').value;
        task.dueDate     = new Date(document.getElementById('taskDueDate').value).toISOString();
        saveTasks();
        renderTasks();
        closeModal();
        showSuccessToast('✅ Tarefa atualizada com sucesso!');
    });
}

// ==================== DELETAR ====================

function deleteTaskConfirm(id) {
    document.getElementById('modalTitle').textContent = '🗑️ Deletar Tarefa';
    document.getElementById('modalBody').innerHTML = `
        <div style="text-align:center;padding:1rem 0;">
            <p style="margin-bottom:1.5rem;font-size:1.4rem;">Tem certeza que quer deletar esta tarefa?</p>
            <div style="display:flex;gap:1rem;justify-content:center;">
                <button class="btn-submit-modal" style="background:#ef4444;" id="confirmDelete">🗑️ Deletar</button>
                <button class="btn-submit-modal" style="background:var(--card-border,#444);" id="cancelDelete">Cancelar</button>
            </div>
        </div>
    `;
    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('confirmDelete').addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        closeModal();
        showSuccessToast('🗑️ Tarefa deletada!');
    });
    document.getElementById('cancelDelete').addEventListener('click', closeModal);
}

// ==================== TOGGLE STATUS ====================

function toggleTaskStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const s = ['todo', 'doing', 'done'];
    task.status = s[(s.indexOf(task.status) + 1) % s.length];
    saveTasks();
    renderTasks();
}

// ==================== FECHAR MODAL ====================

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('modalBody').innerHTML = '';
}

// ==================== TOAST ====================

function showSuccessToast(message) {
    document.querySelector('.success-toast')?.remove();
    const toast = document.createElement('div');
    toast.className   = 'success-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    if (!document.getElementById('toast-styles')) {
        const s = document.createElement('style');
        s.id = 'toast-styles';
        s.textContent = `
            .success-toast{position:fixed;bottom:2.5rem;right:2.5rem;background:#4ade80;color:#fff;
            padding:1.2rem 2.4rem;border-radius:12px;font-family:'Epilogue',sans-serif;
            font-size:1.4rem;font-weight:600;box-shadow:0 8px 30px rgba(0,0,0,.2);
            animation:slideIn .3s ease;z-index:9999;}
            @keyframes slideIn{from{transform:translateX(400px);opacity:0}to{transform:translateX(0);opacity:1}}
        `;
        document.head.appendChild(s);
    }

    setTimeout(() => {
        toast.style.animation = 'slideIn .3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ==================== DRAG & DROP ====================

function setupDragAndDrop() {
    let draggedCard = null;
    const statusMap = { todoList: 'todo', doingList: 'doing', doneList: 'done' };

    document.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('dragstart', () => {
            draggedCard = card;
            setTimeout(() => card.style.opacity = '0.5', 0);
        });
        card.addEventListener('dragend', () => {
            card.style.opacity = '1';
            draggedCard = null;
        });
    });

    document.querySelectorAll('.task-list').forEach(list => {
        list.addEventListener('dragover', e => {
            e.preventDefault();
            list.style.outline = '2px dashed var(--accent, #6366f1)';
        });
        list.addEventListener('dragleave', () => list.style.outline = 'none');
        list.addEventListener('drop', e => {
            e.preventDefault();
            list.style.outline = 'none';
            if (!draggedCard) return;
            const taskId    = parseInt(draggedCard.getAttribute('data-task-id'));
            const newStatus = statusMap[list.id];
            if (!newStatus) return;
            const task = tasks.find(t => t.id === taskId);
            if (task && task.status !== newStatus) {
                task.status = newStatus;
                saveTasks();
                renderTasks();
            }
        });
    });
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnAddTask')?.addEventListener('click', openAddTaskModal);
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('modalOverlay')?.addEventListener('click', e => {
        if (e.target === document.getElementById('modalOverlay')) closeModal();
    });
    setupFilters();
    renderTasks();
});