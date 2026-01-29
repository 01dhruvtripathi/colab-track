// Configuration file for Colab Track
const CONFIG = {
    // API Configuration
    API_BASE_URL: 'http://localhost:8081/api',
    WS_URL: 'ws://localhost:8081',
    
    // Application Settings
    APP_NAME: 'Colab Track',
    VERSION: '1.0.0',
    
    // Feature Flags
    FEATURES: {
        REAL_TIME_UPDATES: true,
        FILE_UPLOAD: true,
        TIME_TRACKING: true,
        ANALYTICS: true,
        NOTIFICATIONS: true,
        INTEGRATIONS: true
    },
    
    // Pagination
    ITEMS_PER_PAGE: 20,
    
    // Cache Settings
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    
    // Notification Settings
    NOTIFICATION_TIMEOUT: 5000, // 5 seconds
    
    // Date Formats
    DATE_FORMAT: 'YYYY-MM-DD',
    DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
    
    // Task Statuses
    TASK_STATUSES: {
        TODO: 'todo',
        IN_PROGRESS: 'in-progress',
        REVIEW: 'review',
        DONE: 'done'
    },
    
    // Task Priorities
    TASK_PRIORITIES: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        URGENT: 'urgent'
    },
    
    // User Roles
    USER_ROLES: {
        ADMIN: 'admin',
        MANAGER: 'manager',
        CONTRIBUTOR: 'contributor',
        VIEWER: 'viewer'
    },
    
    // Views
    VIEWS: {
        LIST: 'list',
        KANBAN: 'kanban',
        TIMELINE: 'timeline'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}


