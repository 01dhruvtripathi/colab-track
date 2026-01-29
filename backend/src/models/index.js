/**
 * In-Memory Database Models for Colab Track
 * Simulates database operations without external dependencies
 */
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// In-memory data stores
const data = {
  users: new Map(),
  workspaces: new Map(),
  projects: new Map(),
  tasks: new Map(),
  teams: new Map(),
  comments: new Map(),
  notifications: new Map(),
  files: new Map(),
  timeTracking: new Map(),
  activityLogs: new Map()
};

// ID counters
let idCounters = {
  users: 0,
  workspaces: 0,
  projects: 0,
  tasks: 0,
  teams: 0,
  comments: 0,
  notifications: 0,
  files: 0,
  timeTracking: 0,
  activityLogs: 0
};

// Helper to generate IDs
const generateId = (entity) => ++idCounters[entity];

// User Model
const User = {
  findAll: () => Array.from(data.users.values()).map(u => ({ ...u, password: undefined })),
  findById: (id) => {
    const user = data.users.get(parseInt(id));
    if (user) return { ...user, password: undefined };
    return null;
  },
  findByEmail: (email) => Array.from(data.users.values()).find(u => u.email === email),
  create: async (userData) => {
    const id = generateId('users');
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = {
      id,
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      avatar: userData.avatar || null,
      role: userData.role || 'VIEWER',
      enabled: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    data.users.set(id, user);
    return { ...user, password: undefined };
  },
  update: (id, updates) => {
    const user = data.users.get(parseInt(id));
    if (!user) return null;
    const updated = { ...user, ...updates, updatedAt: new Date() };
    data.users.set(parseInt(id), updated);
    return { ...updated, password: undefined };
  },
  delete: (id) => data.users.delete(parseInt(id)),
  validatePassword: async (user, password) => bcrypt.compare(password, user.password)
};

// Workspace Model
const Workspace = {
  findAll: (userId) => Array.from(data.workspaces.values())
    .filter(w => w.ownerId === userId || (w.members && w.members.includes(userId))),
  findById: (id) => data.workspaces.get(parseInt(id)),
  create: (workspaceData) => {
    const id = generateId('workspaces');
    const workspace = {
      id,
      name: workspaceData.name,
      description: workspaceData.description || '',
      ownerId: workspaceData.ownerId,
      members: [workspaceData.ownerId],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    data.workspaces.set(id, workspace);
    return workspace;
  },
  update: (id, updates) => {
    const workspace = data.workspaces.get(parseInt(id));
    if (!workspace) return null;
    const updated = { ...workspace, ...updates, updatedAt: new Date() };
    data.workspaces.set(parseInt(id), updated);
    return updated;
  },
  delete: (id) => data.workspaces.delete(parseInt(id)),
  addMember: (workspaceId, userId) => {
    const workspace = data.workspaces.get(parseInt(workspaceId));
    if (workspace && !workspace.members.includes(userId)) {
      workspace.members.push(userId);
      data.workspaces.set(parseInt(workspaceId), workspace);
    }
    return workspace;
  }
};

// Project Model
const Project = {
  findAll: (workspaceId) => Array.from(data.projects.values())
    .filter(p => !workspaceId || p.workspaceId === parseInt(workspaceId)),
  findById: (id) => data.projects.get(parseInt(id)),
  create: (projectData) => {
    const id = generateId('projects');
    const project = {
      id,
      name: projectData.name,
      description: projectData.description || '',
      status: projectData.status || 'ACTIVE',
      workspaceId: projectData.workspaceId,
      ownerId: projectData.ownerId,
      members: [projectData.ownerId],
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    data.projects.set(id, project);
    return project;
  },
  update: (id, updates) => {
    const project = data.projects.get(parseInt(id));
    if (!project) return null;
    const updated = { ...project, ...updates, updatedAt: new Date() };
    data.projects.set(parseInt(id), updated);
    return updated;
  },
  delete: (id) => data.projects.delete(parseInt(id)),
  updateProgress: (projectId) => {
    const tasks = Task.findByProject(projectId);
    if (tasks.length === 0) return;
    const completed = tasks.filter(t => t.status === 'DONE').length;
    const progress = Math.round((completed / tasks.length) * 100);
    Project.update(projectId, { progress });
  }
};

// Task Model
const Task = {
  findAll: (filters = {}) => {
    let tasks = Array.from(data.tasks.values());
    if (filters.projectId) tasks = tasks.filter(t => t.projectId === parseInt(filters.projectId));
    if (filters.assigneeId) tasks = tasks.filter(t => t.assigneeId === parseInt(filters.assigneeId));
    if (filters.status) tasks = tasks.filter(t => t.status === filters.status);
    return tasks;
  },
  findByProject: (projectId) => Array.from(data.tasks.values())
    .filter(t => t.projectId === parseInt(projectId)),
  findById: (id) => data.tasks.get(parseInt(id)),
  create: (taskData) => {
    const id = generateId('tasks');
    const task = {
      id,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'TODO',
      priority: taskData.priority || 'MEDIUM',
      projectId: taskData.projectId,
      assigneeId: taskData.assigneeId || null,
      createdBy: taskData.createdBy,
      parentTaskId: taskData.parentTaskId || null,
      dueDate: taskData.dueDate || null,
      timeSpent: 0,
      tags: taskData.tags || [],
      checklist: taskData.checklist || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    data.tasks.set(id, task);
    Project.updateProgress(task.projectId);
    return task;
  },
  update: (id, updates) => {
    const task = data.tasks.get(parseInt(id));
    if (!task) return null;
    const updated = { ...task, ...updates, updatedAt: new Date() };
    data.tasks.set(parseInt(id), updated);
    Project.updateProgress(task.projectId);
    return updated;
  },
  delete: (id) => {
    const task = data.tasks.get(parseInt(id));
    if (task) {
      data.tasks.delete(parseInt(id));
      Project.updateProgress(task.projectId);
    }
    return !!task;
  }
};

// Team Model
const Team = {
  findAll: (workspaceId) => Array.from(data.teams.values())
    .filter(t => !workspaceId || t.workspaceId === parseInt(workspaceId)),
  findById: (id) => data.teams.get(parseInt(id)),
  create: (teamData) => {
    const id = generateId('teams');
    const team = {
      id,
      name: teamData.name,
      description: teamData.description || '',
      workspaceId: teamData.workspaceId,
      leaderId: teamData.leaderId,
      members: [teamData.leaderId],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    data.teams.set(id, team);
    return team;
  },
  update: (id, updates) => {
    const team = data.teams.get(parseInt(id));
    if (!team) return null;
    const updated = { ...team, ...updates, updatedAt: new Date() };
    data.teams.set(parseInt(id), updated);
    return updated;
  },
  delete: (id) => data.teams.delete(parseInt(id)),
  addMember: (teamId, userId) => {
    const team = data.teams.get(parseInt(teamId));
    if (team && !team.members.includes(userId)) {
      team.members.push(userId);
      data.teams.set(parseInt(teamId), team);
    }
    return team;
  }
};

// Comment Model
const Comment = {
  findByTask: (taskId) => Array.from(data.comments.values())
    .filter(c => c.taskId === parseInt(taskId)),
  findById: (id) => data.comments.get(parseInt(id)),
  create: (commentData) => {
    const id = generateId('comments');
    const comment = {
      id,
      taskId: commentData.taskId,
      userId: commentData.userId,
      content: commentData.content,
      parentCommentId: commentData.parentCommentId || null,
      mentions: commentData.mentions || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    data.comments.set(id, comment);
    return comment;
  },
  update: (id, updates) => {
    const comment = data.comments.get(parseInt(id));
    if (!comment) return null;
    const updated = { ...comment, ...updates, updatedAt: new Date() };
    data.comments.set(parseInt(id), updated);
    return updated;
  },
  delete: (id) => data.comments.delete(parseInt(id))
};

// Notification Model
const Notification = {
  findByUser: (userId, unreadOnly = false) => {
    let notifications = Array.from(data.notifications.values())
      .filter(n => n.userId === parseInt(userId));
    if (unreadOnly) notifications = notifications.filter(n => !n.read);
    return notifications.sort((a, b) => b.createdAt - a.createdAt);
  },
  findById: (id) => data.notifications.get(parseInt(id)),
  create: (notificationData) => {
    const id = generateId('notifications');
    const notification = {
      id,
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message || '',
      link: notificationData.link || null,
      read: false,
      createdAt: new Date()
    };
    data.notifications.set(id, notification);
    return notification;
  },
  markAsRead: (id) => {
    const notification = data.notifications.get(parseInt(id));
    if (notification) {
      notification.read = true;
      data.notifications.set(parseInt(id), notification);
    }
    return notification;
  },
  markAllAsRead: (userId) => {
    data.notifications.forEach((n, id) => {
      if (n.userId === parseInt(userId)) {
        n.read = true;
        data.notifications.set(id, n);
      }
    });
  },
  delete: (id) => data.notifications.delete(parseInt(id))
};

// File Model
const File = {
  findByTask: (taskId) => Array.from(data.files.values())
    .filter(f => f.taskId === parseInt(taskId)),
  findById: (id) => data.files.get(parseInt(id)),
  create: (fileData) => {
    const id = generateId('files');
    const file = {
      id,
      fileName: fileData.fileName,
      filePath: fileData.filePath,
      fileType: fileData.fileType,
      fileSize: fileData.fileSize,
      taskId: fileData.taskId,
      uploadedBy: fileData.uploadedBy,
      version: 1,
      parentFileId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    data.files.set(id, file);
    return file;
  },
  delete: (id) => data.files.delete(parseInt(id))
};

// TimeTracking Model
const TimeTracking = {
  findAll: (filters = {}) => {
    let entries = Array.from(data.timeTracking.values());
    if (filters.userId) entries = entries.filter(t => t.userId === parseInt(filters.userId));
    if (filters.taskId) entries = entries.filter(t => t.taskId === parseInt(filters.taskId));
    return entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  findByTask: (taskId) => Array.from(data.timeTracking.values())
    .filter(t => t.taskId === taskId || t.taskId === parseInt(taskId)),
  findByUser: (userId) => Array.from(data.timeTracking.values())
    .filter(t => t.userId === parseInt(userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  findById: (id) => data.timeTracking.get(id) || Array.from(data.timeTracking.values()).find(t => t.id === id),
  findActive: (userId) => Array.from(data.timeTracking.values())
    .find(t => t.userId === parseInt(userId) && t.isRunning === true),
  create: (trackingData) => {
    const id = trackingData.id || generateId('timeTracking');
    const tracking = {
      id,
      taskId: trackingData.taskId,
      userId: trackingData.userId,
      startTime: trackingData.startTime || new Date().toISOString(),
      endTime: trackingData.endTime || null,
      duration: trackingData.duration || 0,
      description: trackingData.description || '',
      isRunning: trackingData.isRunning || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.timeTracking.set(id, tracking);
    return tracking;
  },
  update: (id, updates) => {
    const tracking = data.timeTracking.get(id) || Array.from(data.timeTracking.values()).find(t => t.id === id);
    if (!tracking) return null;
    const updated = { ...tracking, ...updates, updatedAt: new Date().toISOString() };
    data.timeTracking.set(tracking.id, updated);
    return updated;
  },
  delete: (id) => {
    const tracking = data.timeTracking.get(id) || Array.from(data.timeTracking.values()).find(t => t.id === id);
    if (tracking) {
      data.timeTracking.delete(tracking.id);
      return true;
    }
    return false;
  }
};

// ActivityLog Model
const ActivityLog = {
  findAll: (filters = {}) => {
    let logs = Array.from(data.activityLogs.values());
    if (filters.userId) logs = logs.filter(l => l.userId === parseInt(filters.userId));
    if (filters.entityType) logs = logs.filter(l => l.entityType === filters.entityType);
    if (filters.entityId) logs = logs.filter(l => l.entityId === parseInt(filters.entityId));
    return logs.sort((a, b) => b.createdAt - a.createdAt);
  },
  create: (logData) => {
    const id = generateId('activityLogs');
    const log = {
      id,
      userId: logData.userId,
      entityType: logData.entityType,
      entityId: logData.entityId,
      action: logData.action,
      description: logData.description || '',
      metadata: logData.metadata || {},
      createdAt: new Date()
    };
    data.activityLogs.set(id, log);
    return log;
  }
};

// Seed initial data
const seed = async () => {
  // Create default admin user
  if (data.users.size === 0) {
    await User.create({
      email: 'admin@colabtrack.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'ADMIN'
    });
    
    // Create demo user
    await User.create({
      email: 'demo@colabtrack.com',
      password: 'demo123',
      name: 'Demo User',
      role: 'CONTRIBUTOR'
    });

    // Create a default workspace
    const workspace = Workspace.create({
      name: 'Default Workspace',
      description: 'Default workspace for getting started',
      ownerId: 1
    });
    Workspace.addMember(workspace.id, 2);

    // Create a sample project
    const project = Project.create({
      name: 'Sample Project',
      description: 'A sample project to demonstrate features',
      workspaceId: workspace.id,
      ownerId: 1
    });

    // Create sample tasks
    Task.create({
      title: 'Setup development environment',
      description: 'Install all required tools and dependencies',
      status: 'DONE',
      priority: 'HIGH',
      projectId: project.id,
      assigneeId: 1,
      createdBy: 1
    });

    Task.create({
      title: 'Design database schema',
      description: 'Create the database schema for the application',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project.id,
      assigneeId: 2,
      createdBy: 1
    });

    Task.create({
      title: 'Implement user authentication',
      description: 'Add login, logout, and registration functionality',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project.id,
      assigneeId: 1,
      createdBy: 1
    });

    // Create a sample team
    Team.create({
      name: 'Development Team',
      description: 'Core development team',
      workspaceId: workspace.id,
      leaderId: 1
    });

    console.log('✅ Database seeded with initial data');
    console.log('   Admin: admin@colabtrack.com / admin123');
    console.log('   Demo: demo@colabtrack.com / demo123');
  }
};

module.exports = {
  User,
  Workspace,
  Project,
  Task,
  Team,
  Comment,
  Notification,
  File,
  TimeTracking,
  ActivityLog,
  seed,
  data
};
