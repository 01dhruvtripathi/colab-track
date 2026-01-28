// Team Service
class TeamService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = CONFIG.CACHE_DURATION;
    }

    async getAll(workspaceId, forceRefresh = false) {
        const cacheKey = `teams_${workspaceId}`;
        
        if (!forceRefresh && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return { success: true, data: cached.data };
            }
        }

        const response = await API.teams.getAll(workspaceId);
        
        if (response.success) {
            const teams = response.data.map(t => new Team(t));
            this.cache.set(cacheKey, {
                data: teams,
                timestamp: Date.now()
            });
            return { success: true, data: teams };
        }

        return response;
    }

    async getById(workspaceId, teamId) {
        const response = await API.teams.getById(workspaceId, teamId);
        
        if (response.success) {
            return { success: true, data: new Team(response.data) };
        }

        return response;
    }

    async create(workspaceId, teamData) {
        const response = await API.teams.create(workspaceId, teamData);
        
        if (response.success) {
            this.cache.delete(`teams_${workspaceId}`);
            return { success: true, data: new Team(response.data) };
        }

        return response;
    }

    async update(workspaceId, teamId, teamData) {
        const response = await API.teams.update(workspaceId, teamId, teamData);
        
        if (response.success) {
            this.cache.delete(`teams_${workspaceId}`);
            return { success: true, data: new Team(response.data) };
        }

        return response;
    }

    async delete(workspaceId, teamId) {
        const response = await API.teams.delete(workspaceId, teamId);
        
        if (response.success) {
            this.cache.delete(`teams_${workspaceId}`);
        }

        return response;
    }

    async addMember(workspaceId, teamId, userId) {
        const response = await API.teams.addMember(workspaceId, teamId, userId);
        
        if (response.success) {
            this.cache.delete(`teams_${workspaceId}`);
        }

        return response;
    }

    async removeMember(workspaceId, teamId, userId) {
        const response = await API.teams.removeMember(workspaceId, teamId, userId);
        
        if (response.success) {
            this.cache.delete(`teams_${workspaceId}`);
        }

        return response;
    }

    clearCache(workspaceId = null) {
        if (workspaceId) {
            this.cache.delete(`teams_${workspaceId}`);
        } else {
            this.cache.clear();
        }
    }
}

// Create singleton instance
const teamService = new TeamService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamService;
}


