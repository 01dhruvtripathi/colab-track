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
        // Load dashboard data
        const workspaceId = app.getCurrentWorkspace()?.id;
        if (!workspaceId) {
            Utils.showEmptyState('#dashboardView', 'Select a workspace to view dashboard');
            return;
        }

        try {
            // Load analytics
            const analyticsResponse = await analyticsService.getDashboard(workspaceId);
            
            if (analyticsResponse.success) {
                this.updateStats(analyticsResponse.data);
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
        this.stats = {
            totalTasks: data.totalTasks || 0,
            completedTasks: data.completedTasks || 0,
            inProgressTasks: data.inProgressTasks || 0,
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

        // This would typically come from an API
        // For now, showing empty state
        setTimeout(() => {
            Utils.showEmptyState(feed, 'No recent activity', 'fa-clock');
        }, 500);
    }

    async loadMyTasks() {
        const taskList = document.getElementById('myTasksList');
        if (!taskList) return;

        Utils.showLoading(taskList);

        // Load user's tasks
        const workspaceId = app.getCurrentWorkspace()?.id;
        if (!workspaceId) {
            Utils.showEmptyState(taskList, 'Select a workspace');
            return;
        }

        // This would load from API
        setTimeout(() => {
            Utils.showEmptyState(taskList, 'No tasks assigned to you', 'fa-tasks');
        }, 500);
    }

    async loadProjectProgress() {
        const chart = document.getElementById('progressChart');
        if (!chart) return;

        // This would render a chart
        // For now, showing placeholder
        chart.innerHTML = '<p>Project progress chart will be rendered here</p>';
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


