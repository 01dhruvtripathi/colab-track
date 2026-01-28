// WebSocket Manager for Real-Time Updates
class WebSocketManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.listeners = new Map();
        this.isConnected = false;
    }

    connect() {
        if (!CONFIG.FEATURES.REAL_TIME_UPDATES) {
            return;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.warn('No auth token available for WebSocket connection');
            return;
        }

        const wsUrl = `${CONFIG.WS_URL}?token=${token}`;
        
        try {
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connected');
            };

            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.emit('error', error);
            };

            this.socket.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.emit('disconnected');
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    handleMessage(message) {
        const { type, event, data } = message;

        // Emit specific event
        this.emit(event, data);

        // Also emit generic message event
        this.emit('message', { type, event, data });
    }

    send(event, data) {
        if (this.socket && this.isConnected) {
            const message = JSON.stringify({ event, data });
            this.socket.send(message);
        } else {
            console.warn('WebSocket not connected. Message not sent:', event);
        }
    }

    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    unsubscribe(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in WebSocket listener for ${event}:`, error);
                }
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Convenience methods for common events
    subscribeToTaskUpdates(callback) {
        this.subscribe('task.updated', callback);
        this.subscribe('task.created', callback);
        this.subscribe('task.deleted', callback);
        this.subscribe('task.status.changed', callback);
    }

    subscribeToProjectUpdates(callback) {
        this.subscribe('project.updated', callback);
        this.subscribe('project.created', callback);
        this.subscribe('project.deleted', callback);
    }

    subscribeToComments(callback) {
        this.subscribe('comment.created', callback);
        this.subscribe('comment.updated', callback);
    }

    subscribeToNotifications(callback) {
        this.subscribe('notification.new', callback);
    }
}

// Create singleton instance
const wsManager = new WebSocketManager();

// Auto-connect when authenticated
if (authManager && authManager.isAuthenticated) {
    wsManager.connect();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketManager;
}


