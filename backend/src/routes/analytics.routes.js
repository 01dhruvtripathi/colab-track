const express = require('express');
const { Project, Task, User, Workspace, Team, ActivityLog } = require('../models');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', authMiddleware, (req, res) => {
  const projects = Project.findAll();
  const allTasks = Task.findAll({});
  const users = User.findAll();
  const workspaces = Workspace.findAll(req.userId);

  const taskStats = {
    total: allTasks.length,
    todo: allTasks.filter(t => t.status === 'TODO').length,
    inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
    review: allTasks.filter(t => t.status === 'REVIEW').length,
    done: allTasks.filter(t => t.status === 'DONE').length
  };

  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'ACTIVE').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    archived: projects.filter(p => p.status === 'ARCHIVED').length
  };

  // Calculate productivity metrics
  const completionRate = allTasks.length > 0 
    ? Math.round((taskStats.done / allTasks.length) * 100) 
    : 0;

  // Get recent activity
  const recentActivity = ActivityLog.findAll({}).slice(0, 10);

  res.json({
    success: true,
    data: {
      taskStats,
      projectStats,
      userCount: users.length,
      workspaceCount: workspaces.length,
      completionRate,
      recentActivity
    }
  });
});

// Get project analytics
router.get('/projects/:id', authMiddleware, (req, res) => {
  const project = Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found' }
    });
  }

  const tasks = Task.findByProject(req.params.id);
  
  const tasksByStatus = {
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    REVIEW: tasks.filter(t => t.status === 'REVIEW').length,
    DONE: tasks.filter(t => t.status === 'DONE').length
  };

  const tasksByPriority = {
    HIGH: tasks.filter(t => t.priority === 'HIGH').length,
    MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
    LOW: tasks.filter(t => t.priority === 'LOW').length
  };

  // Calculate overdue tasks
  const now = new Date();
  const overdueTasks = tasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
  ).length;

  // Get assignee workload
  const assigneeWorkload = {};
  tasks.forEach(task => {
    if (task.assigneeId) {
      if (!assigneeWorkload[task.assigneeId]) {
        const user = User.findById(task.assigneeId);
        assigneeWorkload[task.assigneeId] = {
          user: user,
          taskCount: 0,
          completedCount: 0
        };
      }
      assigneeWorkload[task.assigneeId].taskCount++;
      if (task.status === 'DONE') {
        assigneeWorkload[task.assigneeId].completedCount++;
      }
    }
  });

  res.json({
    success: true,
    data: {
      project,
      totalTasks: tasks.length,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      progress: project.progress,
      assigneeWorkload: Object.values(assigneeWorkload)
    }
  });
});

// Get user productivity
router.get('/users/:id/productivity', authMiddleware, (req, res) => {
  const userId = parseInt(req.params.id);
  const user = User.findById(userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { message: 'User not found' }
    });
  }

  const tasks = Task.findAll({ assigneeId: userId });
  
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'DONE').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    pending: tasks.filter(t => t.status === 'TODO').length
  };

  const completionRate = tasks.length > 0 
    ? Math.round((taskStats.completed / tasks.length) * 100) 
    : 0;

  // Get activity logs for user
  const activities = ActivityLog.findAll({ userId }).slice(0, 20);

  res.json({
    success: true,
    data: {
      user,
      taskStats,
      completionRate,
      recentActivities: activities
    }
  });
});

// Get team performance
router.get('/teams/:id/performance', authMiddleware, (req, res) => {
  const team = Team.findById(req.params.id);
  
  if (!team) {
    return res.status(404).json({
      success: false,
      error: { message: 'Team not found' }
    });
  }

  // Calculate team metrics
  const memberStats = team.members.map(memberId => {
    const user = User.findById(memberId);
    const tasks = Task.findAll({ assigneeId: memberId });
    
    return {
      user,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'DONE').length,
      completionRate: tasks.length > 0 
        ? Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100) 
        : 0
    };
  });

  const totalTasks = memberStats.reduce((sum, m) => sum + m.totalTasks, 0);
  const completedTasks = memberStats.reduce((sum, m) => sum + m.completedTasks, 0);

  res.json({
    success: true,
    data: {
      team,
      memberCount: team.members.length,
      totalTasks,
      completedTasks,
      teamCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      memberStats
    }
  });
});

// Get workload distribution
router.get('/workload', authMiddleware, (req, res) => {
  const users = User.findAll();
  const allTasks = Task.findAll({});

  const workload = users.map(user => {
    const userTasks = allTasks.filter(t => t.assigneeId === user.id);
    return {
      user,
      totalTasks: userTasks.length,
      highPriority: userTasks.filter(t => t.priority === 'HIGH').length,
      mediumPriority: userTasks.filter(t => t.priority === 'MEDIUM').length,
      lowPriority: userTasks.filter(t => t.priority === 'LOW').length,
      overdue: userTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
      ).length
    };
  }).filter(w => w.totalTasks > 0);

  // Sort by workload (total tasks)
  workload.sort((a, b) => b.totalTasks - a.totalTasks);

  res.json({
    success: true,
    data: workload
  });
});

module.exports = router;
