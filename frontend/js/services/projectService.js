// Project Service
class ProjectService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = CONFIG.CACHE_DURATION;
    }

    async getAll(workspaceId, forceRefresh = false) {
        const cacheKey = `projects_${workspaceId}`;
        
        if (!forceRefresh && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return { success: true, data: cached.data };
            }
        }

        const response = await API.projects.getAll(workspaceId);
        
        if (response.success) {
            const projects = response.data.map(p => new Project(p));
            this.cache.set(cacheKey, {
                data: projects,
                timestamp: Date.now()
            });
            return { success: true, data: projects };
        }

        return response;
    }

    async getById(workspaceId, projectId) {
        const response = await API.projects.getById(workspaceId, projectId);
        
        if (response.success) {
            return { success: true, data: new Project(response.data) };
        }

        return response;
    }

    async create(workspaceId, projectData) {
        const response = await API.projects.create(workspaceId, projectData);
        
        if (response.success) {
            // Invalidate cache
            this.cache.delete(`projects_${workspaceId}`);
            
            // Emit event
            if (wsManager && wsManager.isConnected) {
                wsManager.send('project.created', response.data);
            }
            
            return { success: true, data: new Project(response.data) };
        }

        return response;
    }

    async update(workspaceId, projectId, projectData) {
        const response = await API.projects.update(workspaceId, projectId, projectData);
        
        if (response.success) {
            // Invalidate cache
            this.cache.delete(`projects_${workspaceId}`);
            
            // Emit event
            if (wsManager && wsManager.isConnected) {
                wsManager.send('project.updated', response.data);
            }
            
            return { success: true, data: new Project(response.data) };
        }

        return response;
    }

    async delete(workspaceId, projectId) {
        const response = await API.projects.delete(workspaceId, projectId);
        
        if (response.success) {
            // Invalidate cache
            this.cache.delete(`projects_${workspaceId}`);
            
            // Emit event
            if (wsManager && wsManager.isConnected) {
                wsManager.send('project.deleted', { id: projectId });
            }
        }

        return response;
    }

    async archive(workspaceId, projectId) {
        const response = await API.projects.archive(workspaceId, projectId);
        
        if (response.success) {
            this.cache.delete(`projects_${workspaceId}`);
        }

        return response;
    }

    clearCache(workspaceId = null) {
        if (workspaceId) {
            this.cache.delete(`projects_${workspaceId}`);
        } else {
            this.cache.clear();
        }
    }
}

// Create singleton instance
const projectService = new ProjectService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectService;
}


