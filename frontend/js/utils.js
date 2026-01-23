// Utility Functions
const Utils = {
    // Date formatting
    formatDate(date, format = CONFIG.DATE_FORMAT) {
        if (!date) return '';
        const d = new Date(date);
        
        const formats = {
            'YYYY-MM-DD': () => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            },
            'MM/DD/YYYY': () => {
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const year = d.getFullYear();
                return `${month}/${day}/${year}`;
            },
            'relative': () => {
                const now = new Date();
                const diff = now - d;
                const seconds = Math.floor(diff / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);

                if (days > 7) return this.formatDate(date, 'MM/DD/YYYY');
                if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
                if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
                return 'Just now';
            }
        };

        return formats[format] ? formats[format]() : d.toLocaleDateString();
    },

    formatDateTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleString();
    },

    // Time formatting
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    },

    // File size formatting
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Deep clone object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Check if object is empty
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    // Sanitize HTML
    sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },

    // Parse mentions from text
    parseMentions(text) {
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;
        
        while ((match = mentionRegex.exec(text)) !== null) {
            mentions.push(match[1]);
        }
        
        return mentions;
    },

    // Highlight mentions in text
    highlightMentions(text) {
        return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    },

    // Show toast notification
    showToast(message, type = 'info', duration = CONFIG.NOTIFICATION_TIMEOUT) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        }[type] || 'fa-info-circle';

        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${this.sanitizeHtml(message)}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // Show modal
    showModal(content, title = '') {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) return;

        modalBody.innerHTML = title ? `<h2>${title}</h2>${content}` : content;
        modal.classList.add('active');
    },

    // Hide modal
    hideModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // Show loading spinner
    showLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        }
    },

    // Show empty state
    showEmptyState(element, message = 'No items found', icon = 'fa-inbox') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.innerHTML = `
                <div class="empty-state">
                    <i class="fas ${icon}"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    },

    // Format priority
    formatPriority(priority) {
        const priorities = {
            low: { label: 'Low', class: 'success' },
            medium: { label: 'Medium', class: 'warning' },
            high: { label: 'High', class: 'error' },
            urgent: { label: 'Urgent', class: 'error' }
        };
        return priorities[priority] || { label: priority, class: '' };
    },

    // Format status
    formatStatus(status) {
        const statuses = {
            todo: { label: 'To Do', class: 'todo' },
            'in-progress': { label: 'In Progress', class: 'in-progress' },
            review: { label: 'Review', class: 'review' },
            done: { label: 'Done', class: 'done' }
        };
        return statuses[status] || { label: status, class: '' };
    },

    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate URL
    validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard', 'success');
            return true;
        } catch (error) {
            console.error('Failed to copy:', error);
            return false;
        }
    },

    // Download file
    downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Add CSS for slideOut animation
if (!document.getElementById('utils-styles')) {
    const style = document.createElement('style');
    style.id = 'utils-styles';
    style.textContent = `
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}


