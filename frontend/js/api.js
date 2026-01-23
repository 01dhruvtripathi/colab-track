// API Client for Colab Track
class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || CONFIG.API_BASE_URL;
        this.token = localStorage.getItem('auth_token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    // Get authentication headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            
            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                if (response.ok) {
                    return { success: true, data: await response.text() };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return { success: true, data };
        } catch (error) {
            console.error('API Request Error:', error);
            return { success: false, error: error.message };
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // PATCH request
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // File upload
    async uploadFile(endpoint, file, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
            }

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve({ success: true, data });
                    } catch (e) {
                        resolve({ success: true, data: xhr.responseText });
                    }
                } else {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('POST', `${this.baseUrl}${endpoint}`);
            if (this.token) {
                xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
            }
            xhr.send(formData);
        });
    }
}

// Create singleton instance
const apiClient = new ApiClient();

// API endpoints
const API = {
    // Authentication
    auth: {
        login: (credentials) => apiClient.post('/auth/login', credentials),
        register: (userData) => apiClient.post('/auth/register', userData),
        logout: () => apiClient.post('/auth/logout'),
        refresh: () => apiClient.post('/auth/refresh'),
        oauth: (provider) => apiClient.get(`/auth/oauth/${provider}`),
        verify: (token) => apiClient.get(`/auth/verify/${token}`)
    },

    // Users
    users: {
        getAll: (params) => apiClient.get('/users', params),
        getById: (id) => apiClient.get(`/users/${id}`),
        update: (id, data) => apiClient.put(`/users/${id}`, data),
        delete: (id) => apiClient.delete(`/users/${id}`),
        getProfile: () => apiClient.get('/users/me'),
        updateProfile: (data) => apiClient.put('/users/me', data)
    },

    // Workspaces
    workspaces: {
        getAll: () => apiClient.get('/workspaces'),
        getById: (id) => apiClient.get(`/workspaces/${id}`),
        create: (data) => apiClient.post('/workspaces', data),
        update: (id, data) => apiClient.put(`/workspaces/${id}`, data),
        delete: (id) => apiClient.delete(`/workspaces/${id}`),
        getMembers: (id) => apiClient.get(`/workspaces/${id}/members`),
        addMember: (id, userId) => apiClient.post(`/workspaces/${id}/members`, { userId }),
        removeMember: (id, userId) => apiClient.delete(`/workspaces/${id}/members/${userId}`)
    },

    // Projects
    projects: {
        getAll: (workspaceId, params) => apiClient.get(`/workspaces/${workspaceId}/projects`, params),
        getById: (workspaceId, id) => apiClient.get(`/workspaces/${workspaceId}/projects/${id}`),
        create: (workspaceId, data) => apiClient.post(`/workspaces/${workspaceId}/projects`, data),
        update: (workspaceId, id, data) => apiClient.put(`/workspaces/${workspaceId}/projects/${id}`, data),
        delete: (workspaceId, id) => apiClient.delete(`/workspaces/${workspaceId}/projects/${id}`),
        archive: (workspaceId, id) => apiClient.post(`/workspaces/${workspaceId}/projects/${id}/archive`),
        getMembers: (workspaceId, id) => apiClient.get(`/workspaces/${workspaceId}/projects/${id}/members`),
        addMember: (workspaceId, id, userId) => apiClient.post(`/workspaces/${workspaceId}/projects/${id}/members`, { userId })
    },

    // Tasks
    tasks: {
        getAll: (projectId, params) => apiClient.get(`/projects/${projectId}/tasks`, params),
        getById: (projectId, id) => apiClient.get(`/projects/${projectId}/tasks/${id}`),
        create: (projectId, data) => apiClient.post(`/projects/${projectId}/tasks`, data),
        update: (projectId, id, data) => apiClient.put(`/projects/${projectId}/tasks/${id}`, data),
        delete: (projectId, id) => apiClient.delete(`/projects/${projectId}/tasks/${id}`),
        updateStatus: (projectId, id, status) => apiClient.patch(`/projects/${projectId}/tasks/${id}/status`, { status }),
        assign: (projectId, id, userId) => apiClient.post(`/projects/${projectId}/tasks/${id}/assign`, { userId }),
        addComment: (projectId, id, comment) => apiClient.post(`/projects/${projectId}/tasks/${id}/comments`, { comment }),
        getComments: (projectId, id) => apiClient.get(`/projects/${projectId}/tasks/${id}/comments`),
        addAttachment: (projectId, id, file) => apiClient.uploadFile(`/projects/${projectId}/tasks/${id}/attachments`, file)
    },

    // Teams
    teams: {
        getAll: (workspaceId) => apiClient.get(`/workspaces/${workspaceId}/teams`),
        getById: (workspaceId, id) => apiClient.get(`/workspaces/${workspaceId}/teams/${id}`),
        create: (workspaceId, data) => apiClient.post(`/workspaces/${workspaceId}/teams`, data),
        update: (workspaceId, id, data) => apiClient.put(`/workspaces/${workspaceId}/teams/${id}`, data),
        delete: (workspaceId, id) => apiClient.delete(`/workspaces/${workspaceId}/teams/${id}`),
        getMembers: (workspaceId, id) => apiClient.get(`/workspaces/${workspaceId}/teams/${id}/members`),
        addMember: (workspaceId, id, userId) => apiClient.post(`/workspaces/${workspaceId}/teams/${id}/members`, { userId }),
        removeMember: (workspaceId, id, userId) => apiClient.delete(`/workspaces/${workspaceId}/teams/${id}/members/${userId}`)
    },

    // Notifications
    notifications: {
        getAll: (params) => apiClient.get('/notifications', params),
        getUnread: () => apiClient.get('/notifications/unread'),
        markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
        markAllAsRead: () => apiClient.post('/notifications/read-all'),
        delete: (id) => apiClient.delete(`/notifications/${id}`)
    },

    // Analytics
    analytics: {
        getDashboard: (workspaceId) => apiClient.get(`/workspaces/${workspaceId}/analytics/dashboard`),
        getProjectStats: (projectId) => apiClient.get(`/projects/${projectId}/analytics`),
        getTeamStats: (teamId) => apiClient.get(`/teams/${teamId}/analytics`),
        getUserStats: (userId) => apiClient.get(`/users/${userId}/analytics`),
        exportReport: (workspaceId, format, params) => apiClient.get(`/workspaces/${workspaceId}/analytics/export/${format}`, params)
    },

    // Files
    files: {
        upload: (file, onProgress) => apiClient.uploadFile('/files/upload', file, onProgress),
        getById: (id) => apiClient.get(`/files/${id}`),
        delete: (id) => apiClient.delete(`/files/${id}`),
        getVersions: (id) => apiClient.get(`/files/${id}/versions`),
        download: (id) => `${apiClient.baseUrl}/files/${id}/download`
    },

    // Time Tracking
    timeTracking: {
        start: (taskId) => apiClient.post(`/tasks/${taskId}/time/start`),
        stop: (taskId) => apiClient.post(`/tasks/${taskId}/time/stop`),
        log: (taskId, data) => apiClient.post(`/tasks/${taskId}/time/log`, data),
        getLogs: (taskId, params) => apiClient.get(`/tasks/${taskId}/time/logs`, params),
        getReport: (params) => apiClient.get('/time-tracking/report', params)
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, apiClient, API };
}


