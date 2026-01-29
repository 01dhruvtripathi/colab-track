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
        me: () => apiClient.get('/auth/me'),
        oauth: (provider) => apiClient.get(`/auth/oauth/${provider}`),
        verify: (token) => apiClient.get(`/auth/verify/${token}`)
    },

    // Users
    users: {
        getAll: (params) => apiClient.get('/users', params),
        getById: (id) => apiClient.get(`/users/${id}`),
        update: (id, data) => apiClient.put(`/users/${id}`, data),
        delete: (id) => apiClient.delete(`/users/${id}`),
        getProfile: () => apiClient.get('/auth/me'),
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

    // Projects (flat routes)
    projects: {
        getAll: (params) => apiClient.get('/projects', params),
        getById: (id) => apiClient.get(`/projects/${id}`),
        create: (data) => apiClient.post('/projects', data),
        update: (id, data) => apiClient.put(`/projects/${id}`, data),
        delete: (id) => apiClient.delete(`/projects/${id}`),
        archive: (id) => apiClient.post(`/projects/${id}/archive`),
        getTasks: (id) => apiClient.get(`/projects/${id}/tasks`)
    },

    // Tasks (flat routes)
    tasks: {
        getAll: (params) => apiClient.get('/tasks', params),
        getById: (id) => apiClient.get(`/tasks/${id}`),
        create: (data) => apiClient.post('/tasks', data),
        update: (id, data) => apiClient.put(`/tasks/${id}`, data),
        delete: (id) => apiClient.delete(`/tasks/${id}`),
        updateStatus: (id, status) => apiClient.patch(`/tasks/${id}/status`, { status }),
        assign: (id, userId) => apiClient.post(`/tasks/${id}/assign`, { assigneeId: userId })
    },

    // Comments
    comments: {
        getByTask: (taskId) => apiClient.get(`/comments/tasks/${taskId}`),
        create: (data) => apiClient.post('/comments', data),
        update: (id, data) => apiClient.put(`/comments/${id}`, data),
        delete: (id) => apiClient.delete(`/comments/${id}`)
    },

    // Teams (flat routes)
    teams: {
        getAll: (params) => apiClient.get('/teams', params),
        getById: (id) => apiClient.get(`/teams/${id}`),
        create: (data) => apiClient.post('/teams', data),
        update: (id, data) => apiClient.put(`/teams/${id}`, data),
        delete: (id) => apiClient.delete(`/teams/${id}`),
        addMember: (id, userId) => apiClient.post(`/teams/${id}/members`, { userId }),
        removeMember: (id, userId) => apiClient.delete(`/teams/${id}/members/${userId}`)
    },

    // Notifications
    notifications: {
        getAll: (params) => apiClient.get('/notifications', params),
        getUnread: () => apiClient.get('/notifications/unread'),
        markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
        markAllAsRead: () => apiClient.post('/notifications/read-all'),
        delete: (id) => apiClient.delete(`/notifications/${id}`)
    },

    // Analytics (flat routes)
    analytics: {
        getDashboard: () => apiClient.get('/analytics/dashboard'),
        getProjectStats: (projectId) => apiClient.get(`/analytics/projects/${projectId}`),
        getTeamStats: (teamId) => apiClient.get(`/analytics/teams/${teamId}/performance`),
        getUserStats: (userId) => apiClient.get(`/analytics/users/${userId}/productivity`),
        getWorkload: () => apiClient.get('/analytics/workload')
    },

    // Files
    files: {
        upload: (file, onProgress) => apiClient.uploadFile('/files/upload', file, onProgress),
        getById: (id) => apiClient.get(`/files/${id}`),
        delete: (id) => apiClient.delete(`/files/${id}`),
        download: (id) => `${apiClient.baseUrl}/files/${id}/download`
    },

    // Time Tracking
    timeTracking: {
        start: (taskId) => apiClient.post('/time-tracking/start', { taskId }),
        stop: () => apiClient.post('/time-tracking/stop'),
        logManual: (data) => apiClient.post('/time-tracking/manual', data),
        getActive: () => apiClient.get('/time-tracking/active'),
        getMy: () => apiClient.get('/time-tracking/my'),
        getByTask: (taskId) => apiClient.get(`/time-tracking/tasks/${taskId}`),
        getReport: (params) => apiClient.get('/time-tracking/report', params)
    },

    // Activity
    activity: {
        getAll: (params) => apiClient.get('/activity', params),
        getMy: () => apiClient.get('/activity/my'),
        getByProject: (projectId) => apiClient.get(`/activity/projects/${projectId}`),
        getByTask: (taskId) => apiClient.get(`/activity/tasks/${taskId}`)
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, apiClient, API };
}


