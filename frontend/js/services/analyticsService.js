// Analytics Service
class AnalyticsService {
    async getDashboard(workspaceId) {
        const response = await API.analytics.getDashboard(workspaceId);
        return response;
    }

    async getProjectStats(projectId) {
        const response = await API.analytics.getProjectStats(projectId);
        return response;
    }

    async getTeamStats(teamId) {
        const response = await API.analytics.getTeamStats(teamId);
        return response;
    }

    async getUserStats(userId) {
        const response = await API.analytics.getUserStats(userId);
        return response;
    }

    async exportReport(workspaceId, format = 'pdf', params = {}) {
        const response = await API.analytics.exportReport(workspaceId, format, params);
        
        if (response.success && response.data.url) {
            Utils.downloadFile(response.data.url, `report.${format}`);
            return { success: true };
        }

        return response;
    }

    // Calculate task completion rate
    calculateCompletionRate(tasks) {
        if (!tasks || tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.status === CONFIG.TASK_STATUSES.DONE).length;
        return Math.round((completed / tasks.length) * 100);
    }

    // Calculate average task completion time
    calculateAverageCompletionTime(tasks) {
        const completedTasks = tasks.filter(t => 
            t.status === CONFIG.TASK_STATUSES.DONE && t.createdAt && t.updatedAt
        );

        if (completedTasks.length === 0) return 0;

        const totalTime = completedTasks.reduce((sum, task) => {
            const start = new Date(task.createdAt);
            const end = new Date(task.updatedAt);
            return sum + (end - start);
        }, 0);

        return Math.round(totalTime / completedTasks.length / (1000 * 60 * 60)); // hours
    }

    // Get task distribution by status
    getTaskDistributionByStatus(tasks) {
        const distribution = {
            todo: 0,
            'in-progress': 0,
            review: 0,
            done: 0
        };

        tasks.forEach(task => {
            if (distribution.hasOwnProperty(task.status)) {
                distribution[task.status]++;
            }
        });

        return distribution;
    }

    // Get task distribution by priority
    getTaskDistributionByPriority(tasks) {
        const distribution = {
            low: 0,
            medium: 0,
            high: 0,
            urgent: 0
        };

        tasks.forEach(task => {
            if (distribution.hasOwnProperty(task.priority)) {
                distribution[task.priority]++;
            }
        });

        return distribution;
    }

    // Get overdue tasks
    getOverdueTasks(tasks) {
        return tasks.filter(task => {
            if (!task.dueDate) return false;
            return new Date(task.dueDate) < new Date() && 
                   task.status !== CONFIG.TASK_STATUSES.DONE;
        });
    }

    // Get tasks due soon (within next 7 days)
    getTasksDueSoon(tasks) {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        return tasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= today && dueDate <= nextWeek && 
                   task.status !== CONFIG.TASK_STATUSES.DONE;
        });
    }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsService;
}


