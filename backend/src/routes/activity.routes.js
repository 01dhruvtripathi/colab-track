const express = require('express');
const { ActivityLog, User, Project, Task, Workspace } = require('../models');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

// Get all activities (with filters)
router.get('/', authMiddleware, (req, res) => {
  const { 
    type, 
    entityType, 
    entityId, 
    userId, 
    workspaceId,
    limit = 50,
    offset = 0 
  } = req.query;

  let activities = ActivityLog.findAll({});

  // Apply filters
  if (type) {
    activities = activities.filter(a => a.type === type);
  }
  if (entityType) {
    activities = activities.filter(a => a.entityType === entityType);
  }
  if (entityId) {
    activities = activities.filter(a => a.entityId === entityId);
  }
  if (userId) {
    activities = activities.filter(a => a.userId === parseInt(userId));
  }
  if (workspaceId) {
    activities = activities.filter(a => a.workspaceId === workspaceId);
  }

  // Pagination
  const total = activities.length;
  activities = activities.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  // Enrich with user info
  const enrichedActivities = activities.map(activity => {
    const user = User.findById(activity.userId);
    return {
      ...activity,
      user: user ? { id: user.id, username: user.username, email: user.email } : null
    };
  });

  res.json({
    success: true,
    data: enrichedActivities,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + parseInt(limit) < total
    }
  });
});

// Get user's activity feed
router.get('/my', authMiddleware, (req, res) => {
  const { limit = 30 } = req.query;

  const activities = ActivityLog.findByUser(req.userId).slice(0, parseInt(limit));

  // Enrich with entity details
  const enrichedActivities = activities.map(activity => {
    let entity = null;
    
    switch (activity.entityType) {
      case 'project':
        entity = Project.findById(activity.entityId);
        break;
      case 'task':
        entity = Task.findById(activity.entityId);
        break;
      case 'workspace':
        entity = Workspace.findById(activity.entityId);
        break;
    }

    return {
      ...activity,
      entity
    };
  });

  res.json({
    success: true,
    data: enrichedActivities
  });
});

// Get project activity log
router.get('/projects/:id', authMiddleware, (req, res) => {
  const project = Project.findById(req.params.id);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found' }
    });
  }

  const activities = ActivityLog.findByEntity('project', req.params.id);

  // Enrich with user info
  const enrichedActivities = activities.map(activity => {
    const user = User.findById(activity.userId);
    return {
      ...activity,
      user: user ? { id: user.id, username: user.username } : null
    };
  });

  res.json({
    success: true,
    data: {
      project,
      activities: enrichedActivities
    }
  });
});

// Get task activity log
router.get('/tasks/:id', authMiddleware, (req, res) => {
  const task = Task.findById(req.params.id);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { message: 'Task not found' }
    });
  }

  const activities = ActivityLog.findByEntity('task', req.params.id);

  // Enrich with user info
  const enrichedActivities = activities.map(activity => {
    const user = User.findById(activity.userId);
    return {
      ...activity,
      user: user ? { id: user.id, username: user.username } : null
    };
  });

  res.json({
    success: true,
    data: {
      task,
      activities: enrichedActivities
    }
  });
});

// Get workspace activity log
router.get('/workspaces/:id', authMiddleware, (req, res) => {
  const workspace = Workspace.findById(req.params.id);
  
  if (!workspace) {
    return res.status(404).json({
      success: false,
      error: { message: 'Workspace not found' }
    });
  }

  // Check access
  if (!workspace.members.includes(req.userId) && workspace.ownerId !== req.userId) {
    return res.status(403).json({
      success: false,
      error: { message: 'Access denied to this workspace' }
    });
  }

  let activities = ActivityLog.findAll({});
  activities = activities.filter(a => a.workspaceId === req.params.id);

  // Enrich with user info
  const enrichedActivities = activities.map(activity => {
    const user = User.findById(activity.userId);
    return {
      ...activity,
      user: user ? { id: user.id, username: user.username } : null
    };
  });

  res.json({
    success: true,
    data: {
      workspace,
      activities: enrichedActivities
    }
  });
});

// Get activity types
router.get('/types', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      types: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'STATUS_CHANGE',
        'ASSIGN',
        'UNASSIGN',
        'COMMENT',
        'UPLOAD',
        'ARCHIVE',
        'RESTORE',
        'MEMBER_ADD',
        'MEMBER_REMOVE'
      ],
      entityTypes: [
        'project',
        'task',
        'workspace',
        'team',
        'file',
        'comment'
      ]
    }
  });
});

// Get activity summary (admin)
router.get('/summary', authMiddleware, requireRole(['ADMIN']), (req, res) => {
  const { days = 7 } = req.query;
  
  const since = new Date();
  since.setDate(since.getDate() - parseInt(days));

  let activities = ActivityLog.findAll({});
  activities = activities.filter(a => new Date(a.createdAt) >= since);

  // Count by type
  const byType = {};
  activities.forEach(a => {
    byType[a.type] = (byType[a.type] || 0) + 1;
  });

  // Count by entity type
  const byEntityType = {};
  activities.forEach(a => {
    byEntityType[a.entityType] = (byEntityType[a.entityType] || 0) + 1;
  });

  // Count by user
  const byUser = {};
  activities.forEach(a => {
    if (!byUser[a.userId]) {
      const user = User.findById(a.userId);
      byUser[a.userId] = {
        user: user ? { id: user.id, username: user.username } : null,
        count: 0
      };
    }
    byUser[a.userId].count++;
  });

  // Most active users
  const mostActive = Object.values(byUser)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({
    success: true,
    data: {
      totalActivities: activities.length,
      period: `Last ${days} days`,
      byType,
      byEntityType,
      mostActiveUsers: mostActive
    }
  });
});

// Export activity log (admin)
router.get('/export', authMiddleware, requireRole(['ADMIN']), (req, res) => {
  const { startDate, endDate, format = 'json' } = req.query;

  let activities = ActivityLog.findAll({});

  // Filter by date range
  if (startDate) {
    const start = new Date(startDate);
    activities = activities.filter(a => new Date(a.createdAt) >= start);
  }
  if (endDate) {
    const end = new Date(endDate);
    activities = activities.filter(a => new Date(a.createdAt) <= end);
  }

  // Enrich with user info
  const enrichedActivities = activities.map(activity => {
    const user = User.findById(activity.userId);
    return {
      ...activity,
      username: user ? user.username : 'Unknown'
    };
  });

  if (format === 'csv') {
    const headers = ['ID', 'Type', 'Entity Type', 'Entity ID', 'User', 'Description', 'Created At'];
    const rows = enrichedActivities.map(a => [
      a.id,
      a.type,
      a.entityType,
      a.entityId,
      a.username,
      a.description || '',
      a.createdAt
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=activity_log.csv');
    return res.send(csv);
  }

  res.json({
    success: true,
    data: enrichedActivities,
    exportedAt: new Date().toISOString()
  });
});

module.exports = router;
