// Authentication Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Check for existing session
        const token = localStorage.getItem('auth_token');
        if (token) {
            this.validateToken(token);
        }
    }

    async validateToken(token) {
        try {
            const response = await API.users.getProfile();
            if (response.success) {
                this.currentUser = response.data;
                this.isAuthenticated = true;
                apiClient.setToken(token);
                return true;
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            this.logout();
        }
        return false;
    }

    async login(credentials) {
        try {
            const response = await API.auth.login(credentials);
            if (response.success && response.data.token) {
                apiClient.setToken(response.data.token);
                this.currentUser = response.data.user;
                this.isAuthenticated = true;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                return { success: true, user: this.currentUser };
            }
            return { success: false, error: response.error || 'Login failed' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async register(userData) {
        try {
            const response = await API.auth.register(userData);
            if (response.success && response.data.token) {
                apiClient.setToken(response.data.token);
                this.currentUser = response.data.user;
                this.isAuthenticated = true;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                return { success: true, user: this.currentUser };
            }
            return { success: false, error: response.error || 'Registration failed' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await API.auth.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.currentUser = null;
            this.isAuthenticated = false;
            apiClient.setToken(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        }
    }

    getCurrentUser() {
        if (!this.currentUser) {
            const stored = localStorage.getItem('user');
            if (stored) {
                this.currentUser = JSON.parse(stored);
            }
        }
        return this.currentUser;
    }

    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }

    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        // Admin has all permissions
        if (user.role === CONFIG.USER_ROLES.ADMIN) return true;
        
        // Check user permissions
        return user.permissions && user.permissions.includes(permission);
    }

    requireAuth() {
        if (!this.isAuthenticated) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }
}

// Create singleton instance
const authManager = new AuthManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}


