// Main Application Controller
class App {
    constructor() {
        this.currentView = 'dashboard';
        this.currentWorkspace = null;
        this.views = {};
        this.init();
    }

    async init() {
        // Check authentication
        if (!authManager.requireAuth()) {
            return;
        }

        // Initialize WebSocket connection
        if (CONFIG.FEATURES.REAL_TIME_UPDATES) {
            wsManager.connect();
        }

        // Load initial data
        await this.loadInitialData();

        // Initialize views
        this.initViews();

        // Setup event listeners
        this.setupEventListeners();

        // Setup WebSocket listeners
        this.setupWebSocketListeners();

        // Load notifications
        await notificationService.loadNotifications();
    }

    async loadInitialData() {
        // Load workspaces, projects, etc.
        // This will be implemented based on the current user's data
    }

    initViews() {
        // Initialize view controllers
        if (typeof DashboardView !== 'undefined') {
            this.views.dashboard = new DashboardView();
        }
        if (typeof ProjectsView !== 'undefined') {
            this.views.projects = new ProjectsView();
        }
        if (typeof TasksView !== 'undefined') {
            this.views.tasks = new TasksView();
        }
        if (typeof TeamsView !== 'undefined') {
            this.views.teams = new TeamsView();
        }
        if (typeof AnalyticsView !== 'undefined') {
            this.views.analytics = new AnalyticsView();
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('href').substring(1);
                this.switchView(view);
            });
        });

        // User menu
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                userMenu.classList.remove('active');
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await authManager.logout();
            });
        }

        // Modal close
        const modalClose = document.getElementById('modalClose');
        const modal = document.getElementById('modal');
        if (modalClose && modal) {
            modalClose.addEventListener('click', () => {
                Utils.hideModal();
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    Utils.hideModal();
                }
            });
        }

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const navMenu = document.getElementById('navMenu');
        if (mobileMenuToggle && navMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }

    setupWebSocketListeners() {
        // Task updates
        wsManager.subscribeToTaskUpdates((data) => {
            // Refresh task views
            if (this.views.tasks) {
                this.views.tasks.refresh();
            }
            if (this.views.dashboard) {
                this.views.dashboard.refresh();
            }
        });

        // Project updates
        wsManager.subscribeToProjectUpdates((data) => {
            if (this.views.projects) {
                this.views.projects.refresh();
            }
        });

        // Comments
        wsManager.subscribeToComments((data) => {
            // Update comment sections
            const event = new CustomEvent('comment-updated', { detail: data });
            document.dispatchEvent(event);
        });
    }

    switchView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        const viewElement = document.getElementById(`${viewName}View`);
        if (viewElement) {
            viewElement.classList.add('active');
            this.currentView = viewName;

            // Update navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${viewName}`) {
                    link.classList.add('active');
                }
            });

            // Initialize view if needed
            if (this.views[viewName] && typeof this.views[viewName].init === 'function') {
                this.views[viewName].init();
            }
        }
    }

    getCurrentView() {
        return this.currentView;
    }

    getCurrentWorkspace() {
        return this.currentWorkspace;
    }

    setCurrentWorkspace(workspace) {
        this.currentWorkspace = workspace;
        // Refresh views that depend on workspace
        Object.values(this.views).forEach(view => {
            if (view && typeof view.refresh === 'function') {
                view.refresh();
            }
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}


