// Task Service
class TaskService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = CONFIG.CACHE_DURATION;
    }

    async getAll(projectId, params = {}, forceRefresh = false) {
        const cacheKey = `tasks_${projectId}_${JSON.stringify(params)}`;
        
        if (!forceRefresh && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return { success: true, data: cached.data };
            }
        }

        const response = await API.tasks.getAll(projectId, params);
        
        if (response.success) {
            const tasks = response.data.map(t => new Task(t));
            this.cache.set(cacheKey, {
                data: tasks,
                timestamp: Date.now()
            });
            return { success: true, data: tasks };
        }

        return response;
    }

    async getById(projectId, taskId) {
        const response = await API.tasks.getById(projectId, taskId);
        
        if (response.success) {
            return { success: true, data: new Task(response.data) };
        }

        return response;
    }

    async create(projectId, taskData) {
        const response = await API.tasks.create(projectId, taskData);
        
        if (response.success) {
            // Invalidate cache
            this.clearProjectCache(projectId);
            
            // Emit event
            if (wsManager && wsManager.isConnected) {
                wsManager.send('task.created', response.data);
            }
            
            return { success: true, data: new Task(response.data) };
        }

        return response;
    }

    async update(projectId, taskId, taskData) {
        const response = await API.tasks.update(projectId, taskId, taskData);
        
        if (response.success) {
            // Invalidate cache
            this.clearProjectCache(projectId);
            
            // Emit event
            if (wsManager && wsManager.isConnected) {
                wsManager.send('task.updated', response.data);
            }
            
            return { success: true, data: new Task(response.data) };
        }

        return response;
    }

    async delete(projectId, taskId) {
        const response = await API.tasks.delete(projectId, taskId);
        
        if (response.success) {
            // Invalidate cache
            this.clearProjectCache(projectId);
            
            // Emit event
            if (wsManager && wsManager.isConnected) {
                wsManager.send('task.deleted', { id: taskId });
            }
        }

        return response;
    }

    async updateStatus(projectId, taskId, status) {
        const response = await API.tasks.updateStatus(projectId, taskId, status);
        
        if (response.success) {
            this.clearProjectCache(projectId);
            
            // Emit event
            if (wsManager && wsManager.isConnected) {
                wsManager.send('task.status.changed', { id: taskId, status });
            }
        }

        return response;
    }

    async assign(projectId, taskId, userId) {
        const response = await API.tasks.assign(projectId, taskId, userId);
        
        if (response.success) {
            this.clearProjectCache(projectId);
        }

        return response;
    }

    async addComment(projectId, taskId, comment) {
        const response = await API.tasks.addComment(projectId, taskId, comment);
        
        if (response.success) {
            // Emit event
            if (wsManager && wsManager.isConnected) {
                wsManager.send('comment.created', response.data);
            }
            
            return { success: true, data: new Comment(response.data) };
        }

        return response;
    }

    async getComments(projectId, taskId) {
        const response = await API.tasks.getComments(projectId, taskId);
        
        if (response.success) {
            const comments = response.data.map(c => new Comment(c));
            return { success: true, data: comments };
        }

        return response;
    }

    async addAttachment(projectId, taskId, file, onProgress) {
        const response = await API.tasks.addAttachment(projectId, taskId, file, onProgress);
        
        if (response.success) {
            this.clearProjectCache(projectId);
            return { success: true, data: new FileAttachment(response.data) };
        }

        return response;
    }

    clearProjectCache(projectId) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith(`tasks_${projectId}_`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    clearCache() {
        this.cache.clear();
    }
}

// Create singleton instance
const taskService = new TaskService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskService;
}


