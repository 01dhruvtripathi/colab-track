// Notification Service
class NotificationService {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.listeners = [];
    }

    async loadNotifications(forceRefresh = false) {
        try {
            const response = await API.notifications.getAll();
            
            if (response.success && response.data) {
                const notificationData = response.data.data || response.data || [];
                this.notifications = Array.isArray(notificationData) ? notificationData : [];
                this.updateUnreadCount();
                this.notifyListeners();
                return { success: true, data: this.notifications };
            }

            return { success: false, data: [] };
        } catch (error) {
            console.error('Error loading notifications:', error);
            return { success: false, data: [] };
        }
    }

    async loadUnread() {
        try {
            const response = await API.notifications.getUnread();
            
            if (response.success) {
                this.updateUnreadCount();
                return { success: true, data: response.data?.data || response.data };
            }

            return response;
        } catch (error) {
            return { success: false };
        }
    }

    async markAsRead(notificationId) {
        const response = await API.notifications.markAsRead(notificationId);
        
        if (response.success) {
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
            }
            this.updateUnreadCount();
            this.notifyListeners();
        }

        return response;
    }

    async markAllAsRead() {
        const response = await API.notifications.markAllAsRead();
        
        if (response.success) {
            this.notifications.forEach(n => n.read = true);
            this.updateUnreadCount();
            this.notifyListeners();
        }

        return response;
    }

    async delete(notificationId) {
        const response = await API.notifications.delete(notificationId);
        
        if (response.success) {
            this.notifications = this.notifications.filter(n => n.id !== notificationId);
            this.updateUnreadCount();
            this.notifyListeners();
        }

        return response;
    }

    addNotification(notification) {
        this.notifications.unshift(new Notification(notification));
        this.updateUnreadCount();
        this.notifyListeners();
        
        // Show toast
        Utils.showToast(notification.message, 'info');
    }

    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.updateBadge();
    }

    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    unsubscribe(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.notifications, this.unreadCount);
            } catch (error) {
                console.error('Error in notification listener:', error);
            }
        });
    }

    getUnreadCount() {
        return this.unreadCount;
    }

    getNotifications() {
        return this.notifications;
    }
}

// Create singleton instance
const notificationService = new NotificationService();

// Subscribe to WebSocket notifications
if (wsManager) {
    wsManager.subscribeToNotifications((data) => {
        notificationService.addNotification(data);
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationService;
}


