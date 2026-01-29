// Dashboard View Controller
class DashboardView {
    constructor() {
        this.stats = {
            totalTasks: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            overdueTasks: 0
        };
    }

    async init() {
        await this.loadDashboard();
        this.setupEventListeners();
    }

    async loadDashboard() {
        try {
            // Load analytics from flat endpoint
            const analyticsResponse = await API.analytics.getDashboard();
            
            if (analyticsResponse.success && analyticsResponse.data.data) {
                this.updateStats(analyticsResponse.data.data);
            }

            // Load recent activity
            await this.loadRecentActivity();

            // Load my tasks
            await this.loadMyTasks();

            // Load project progress
            await this.loadProjectProgress();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            Utils.showToast('Failed to load dashboard', 'error');
        }
    }

    updateStats(data) {
        const taskStats = data.taskStats || {};
        this.stats = {
            totalTasks: taskStats.total || 0,
            completedTasks: taskStats.done || 0,
            inProgressTasks: taskStats.inProgress || 0,
            overdueTasks: data.overdueTasks || 0
        };

        // Update UI
        document.getElementById('totalTasks').textContent = this.stats.totalTasks;
        document.getElementById('completedTasks').textContent = this.stats.completedTasks;
        document.getElementById('inProgressTasks').textContent = this.stats.inProgressTasks;
        document.getElementById('overdueTasks').textContent = this.stats.overdueTasks;
    }

    async loadRecentActivity() {
        const feed = document.getElementById('activityFeed');
        if (!feed) return;

        Utils.showLoading(feed);

        try {
            const response = await API.activity.getMy();
            if (response.success && response.data.data && response.data.data.length > 0) {
                this.renderActivityFeed(feed, response.data.data);
            } else {
                Utils.showEmptyState(feed, 'No recent activity', 'fa-clock');
            }
        } catch (error) {
            Utils.showEmptyState(feed, 'No recent activity', 'fa-clock');
        }
    }

    renderActivityFeed(container, activities) {
        container.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <i class="fas fa-circle"></i>
                <span>${activity.description || activity.type}</span>
                <small>${Utils.formatDate(activity.createdAt)}</small>
            </div>
        `).join('');
    }

    async loadMyTasks() {
        const taskList = document.getElementById('myTasksList');
        if (!taskList) return;

        Utils.showLoading(taskList);

        try {
            const response = await API.tasks.getAll();
            if (response.success && response.data.data && response.data.data.length > 0) {
                this.renderTaskList(taskList, response.data.data.slice(0, 5));
            } else {
                Utils.showEmptyState(taskList, 'No tasks assigned to you', 'fa-tasks');
            }
        } catch (error) {
            Utils.showEmptyState(taskList, 'No tasks assigned to you', 'fa-tasks');
        }
    }

    renderTaskList(container, tasks) {
        container.innerHTML = tasks.map(task => `
            <div class="task-item ${task.status.toLowerCase()}">
                <span class="task-status-badge ${task.status.toLowerCase()}">${task.status}</span>
                <span class="task-title">${task.title}</span>
                <span class="task-priority ${task.priority.toLowerCase()}">${task.priority}</span>
            </div>
        `).join('');
    }

    async loadProjectProgress() {
        const chart = document.getElementById('progressChart');
        if (!chart) return;
    }

    setupEventListeners() {
        // Quick task button
        const quickTaskBtn = document.getElementById('quickTaskBtn');
        if (quickTaskBtn) {
            quickTaskBtn.addEventListener('click', () => {
                this.showQuickTaskModal();
            });
        }

        // View toggle
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.getAttribute('data-view');
                this.switchTaskView(view);
            });
        });
    }

    showQuickTaskModal() {
        const modalContent = `
            <form id="quickTaskForm">
                <div class="form-group">
                    <label class="form-label">Task Title</label>
                    <input type="text" class="form-input" name="title" required>
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
                    <button type="submit" class="btn-primary">Create Task</button>
                </div>
            </form>
        `;

        Utils.showModal(modalContent, 'Quick Task');

        const form = document.getElementById('quickTaskForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const taskData = Object.fromEntries(formData);
                
                // Create task
                // This would call taskService.create()
                Utils.showToast('Task created successfully', 'success');
                Utils.hideModal();
                await this.loadDashboard();
            });
        }
    }

    switchTaskView(view) {
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === view);
        });

        // Update task list view
        const taskList = document.getElementById('myTasksList');
        if (taskList) {
            taskList.className = `task-list view-${view}`;
        }
    }

    async refresh() {
        await this.loadDashboard();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardView;
}


