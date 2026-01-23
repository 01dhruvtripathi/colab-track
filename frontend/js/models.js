// Data Models
class User {
    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.name = data.name;
        this.avatar = data.avatar;
        this.role = data.role;
        this.permissions = data.permissions || [];
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
}

class Workspace {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.ownerId = data.ownerId;
        this.members = data.members || [];
        this.settings = data.settings || {};
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
}

class Project {
    constructor(data) {
        this.id = data.id;
        this.workspaceId = data.workspaceId;
        this.name = data.name;
        this.description = data.description;
        this.status = data.status || 'active';
        this.ownerId = data.ownerId;
        this.members = data.members || [];
        this.goals = data.goals || [];
        this.milestones = data.milestones || [];
        this.timeline = data.timeline || {};
        this.progress = data.progress || 0;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    getProgressPercentage() {
        return Math.round(this.progress * 100);
    }
}

class Task {
    constructor(data) {
        this.id = data.id;
        this.projectId = data.projectId;
        this.title = data.title;
        this.description = data.description;
        this.status = data.status || CONFIG.TASK_STATUSES.TODO;
        this.priority = data.priority || CONFIG.TASK_PRIORITIES.MEDIUM;
        this.assigneeId = data.assigneeId;
        this.assignee = data.assignee;
        this.dueDate = data.dueDate;
        this.dependencies = data.dependencies || [];
        this.subtasks = data.subtasks || [];
        this.checklist = data.checklist || [];
        this.tags = data.tags || [];
        this.comments = data.comments || [];
        this.attachments = data.attachments || [];
        this.timeSpent = data.timeSpent || 0;
        this.createdBy = data.createdBy;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    isOverdue() {
        if (!this.dueDate) return false;
        return new Date(this.dueDate) < new Date() && this.status !== CONFIG.TASK_STATUSES.DONE;
    }

    isHighPriority() {
        return this.priority === CONFIG.TASK_PRIORITIES.HIGH || 
               this.priority === CONFIG.TASK_PRIORITIES.URGENT;
    }

    getCompletionPercentage() {
        if (this.checklist.length === 0) return 0;
        const completed = this.checklist.filter(item => item.completed).length;
        return Math.round((completed / this.checklist.length) * 100);
    }
}

class Team {
    constructor(data) {
        this.id = data.id;
        this.workspaceId = data.workspaceId;
        this.name = data.name;
        this.description = data.description;
        this.members = data.members || [];
        this.leaderId = data.leaderId;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
}

class Comment {
    constructor(data) {
        this.id = data.id;
        this.taskId = data.taskId;
        this.userId = data.userId;
        this.user = data.user;
        this.content = data.content;
        this.mentions = data.mentions || [];
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
}

class Notification {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.type = data.type;
        this.title = data.title;
        this.message = data.message;
        this.read = data.read || false;
        this.link = data.link;
        this.createdAt = data.createdAt;
    }
}

class FileAttachment {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.size = data.size;
        this.type = data.type;
        this.url = data.url;
        this.uploadedBy = data.uploadedBy;
        this.version = data.version || 1;
        this.versions = data.versions || [];
        this.createdAt = data.createdAt;
    }

    getFormattedSize() {
        return Utils.formatFileSize(this.size);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        User,
        Workspace,
        Project,
        Task,
        Team,
        Comment,
        Notification,
        FileAttachment
    };
}


