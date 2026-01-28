// Analytics View Controller
class AnalyticsView {
    constructor() {
        this.analyticsData = null;
    }

    async init() {
        await this.loadAnalytics();
        this.setupEventListeners();
    }

    async loadAnalytics() {
        const dashboard = document.getElementById('analyticsDashboard');
        if (!dashboard) return;

        Utils.showLoading(dashboard);

        const workspaceId = app.getCurrentWorkspace()?.id;
        if (!workspaceId) {
            Utils.showEmptyState(dashboard, 'Select a workspace to view analytics');
            return;
        }

        const response = await analyticsService.getDashboard(workspaceId);

        if (response.success) {
            this.analyticsData = response.data;
            this.renderAnalytics(this.analyticsData);
        } else {
            Utils.showEmptyState(dashboard, 'Failed to load analytics', 'fa-chart-line');
        }
    }

    renderAnalytics(data) {
        const dashboard = document.getElementById('analyticsDashboard');
        if (!dashboard) return;

        dashboard.innerHTML = `
            <div class="chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">Task Completion Rate</h3>
                    <p class="chart-subtitle">Overall project progress</p>
                </div>
                <div class="chart-content">
                    <p>Chart will be rendered here: ${data.completionRate || 0}%</p>
                </div>
            </div>
            <div class="chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">Team Productivity</h3>
                    <p class="chart-subtitle">Tasks completed by team</p>
                </div>
                <div class="chart-content">
                    <p>Productivity chart will be rendered here</p>
                </div>
            </div>
            <div class="chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">Time Tracking</h3>
                    <p class="chart-subtitle">Hours logged this month</p>
                </div>
                <div class="chart-content">
                    <p>Time tracking chart will be rendered here</p>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Export report button
        const exportBtn = document.getElementById('exportReportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                await this.exportReport();
            });
        }

        // Period filter
        const periodSelect = document.getElementById('analyticsPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', async (e) => {
                await this.loadAnalytics();
            });
        }
    }

    async exportReport() {
        const workspaceId = app.getCurrentWorkspace()?.id;
        if (!workspaceId) {
            Utils.showToast('Please select a workspace', 'error');
            return;
        }

        const period = document.getElementById('analyticsPeriod')?.value || 'month';
        const format = 'pdf'; // Could be made selectable

        Utils.showToast('Generating report...', 'info');

        const response = await analyticsService.exportReport(workspaceId, format, { period });

        if (response.success) {
            Utils.showToast('Report exported successfully', 'success');
        } else {
            Utils.showToast('Failed to export report', 'error');
        }
    }

    async refresh() {
        await this.loadAnalytics();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsView;
}


