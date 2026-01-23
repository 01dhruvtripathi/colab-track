// Tasks View Controller
class TasksView {
    constructor() {
        this.tasks = [];
        this.currentView = CONFIG.VIEWS.LIST;
        this.filters = {
            status: 'all',
            priority: 'all',
            assignee: 'all'
        };
    }

    async init() {
        await this.loadTasks();
        this.setupEventListeners();
    }

    async loadTasks() {
        const container = document.getElementById('tasksContainer');
        if (!container) return;

        Utils.showLoading(container);

        // This would load tasks from API
        // For now, showing empty state
        setTimeout(() => {
            Utils.showEmptyState(container, 'No tasks found', 'fa-tasks');
        }, 500);
    }

    renderTasks(tasks) {
        const container = document.getElementById('tasksContainer');
        if (!container) return;

        if (tasks.length === 0) {
            Utils.showEmptyState(container, 'No tasks found', 'fa-tasks');
            return;
        }

        if (this.currentView === CONFIG.VIEWS.LIST) {
            this.renderListView(tasks);
        } else if (this.currentView === CONFIG.VIEWS.KANBAN) {
            this.renderKanbanView(tasks);
        } else if (this.currentView === CONFIG.VIEWS.TIMELINE) {
            this.renderTimelineView(tasks);
        }
    }

    renderListView(tasks) {
        const container = document.getElementById('tasksContainer');
        container.innerHTML = tasks.map(task => `
            <div class="task-item ${task.priority}-priority" data-task-id="${task.id}">
                <div class="task-header">
                    <h3 class="task-title">${Utils.sanitizeHtml(task.title)}</h3>
                    <div class="task-actions">
                        <button class="btn-icon" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <p>${Utils.sanitizeHtml(task.description || '')}</p>
                <div class="task-meta">
                    <span class="task-status ${task.status}">${Utils.formatStatus(task.status).label}</span>
                    ${task.dueDate ? `<span><i class="fas fa-calendar"></i> ${Utils.formatDate(task.dueDate)}</span>` : ''}
                    ${task.assignee ? `<span><i class="fas fa-user"></i> ${task.assignee.name}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    renderKanbanView(tasks) {
        const statuses = Object.values(CONFIG.TASK_STATUSES);
        const container = document.getElementById('tasksContainer');
        
        container.innerHTML = `
            <div class="kanban-board">
                ${statuses.map(status => {
                    const statusTasks = tasks.filter(t => t.status === status);
                    const statusInfo = Utils.formatStatus(status);
                    return `
                        <div class="kanban-column">
                            <div class="kanban-column-header">
                                <h3 class="kanban-column-title">${statusInfo.label}</h3>
                                <span class="kanban-column-count">${statusTasks.length}</span>
                            </div>
                            <div class="kanban-tasks">
                                ${statusTasks.map(task => `
                                    <div class="task-item ${task.priority}-priority" data-task-id="${task.id}">
                                        <h4 class="task-title">${Utils.sanitizeHtml(task.title)}</h4>
                                        ${task.dueDate ? `<span><i class="fas fa-calendar"></i> ${Utils.formatDate(task.dueDate)}</span>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderTimelineView(tasks) {
        const container = document.getElementById('tasksContainer');
        container.innerHTML = '<div class="timeline-container">Timeline view will be rendered here</div>';
    }

    setupEventListeners() {
        // View switcher
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // New task button
        const newTaskBtn = document.getElementById('newTaskBtn');
        if (newTaskBtn) {
            newTaskBtn.addEventListener('click', () => {
                this.showNewTaskModal();
            });
        }

        // Filter
        const taskFilter = document.getElementById('taskFilter');
        if (taskFilter) {
            taskFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }
    }

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === view);
        });
        this.renderTasks(this.tasks);
    }

    applyFilters() {
        // Apply filters to tasks
        let filtered = [...this.tasks];

        if (this.filters.status !== 'all') {
            filtered = filtered.filter(t => t.status === this.filters.status);
        }

        this.renderTasks(filtered);
    }

    showNewTaskModal() {
        const modalContent = `
            <form id="newTaskForm">
                <div class="form-group">
                    <label class="form-label">Task Title</label>
                    <input type="text" class="form-input" name="title" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-textarea" name="description"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <select class="form-select" name="priority">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input type="date" class="form-input" name="dueDate">
                </div>
                <div class="form-group">
                    <button type="submit" class="btn-primary">Create Task</button>
                </div>
            </form>
        `;

        Utils.showModal(modalContent, 'New Task');

        const form = document.getElementById('newTaskForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const taskData = Object.fromEntries(formData);

                // Create task via API
                Utils.showToast('Task created successfully', 'success');
                Utils.hideModal();
                await this.loadTasks();
            });
        }
    }

    async refresh() {
        await this.loadTasks();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TasksView;
}


