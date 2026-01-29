const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { TimeTracking, Task, User, Project } = require('../models');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Get all time entries for user
router.get('/my', authMiddleware, (req, res) => {
  const entries = TimeTracking.findByUser(req.userId);
  
  // Enrich with task and project info
  const enrichedEntries = entries.map(entry => {
    const task = Task.findById(entry.taskId);
    const project = task ? Project.findById(task.projectId) : null;
    return {
      ...entry,
      task,
      project
    };
  });

  res.json({
    success: true,
    data: enrichedEntries
  });
});

// Get time entries for a task
router.get('/tasks/:taskId', authMiddleware, (req, res) => {
  const task = Task.findById(req.params.taskId);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { message: 'Task not found' }
    });
  }

  const entries = TimeTracking.findByTask(req.params.taskId);
  
  // Enrich with user info
  const enrichedEntries = entries.map(entry => {
    const user = User.findById(entry.userId);
    return {
      ...entry,
      user
    };
  });

  // Calculate total time
  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

  res.json({
    success: true,
    data: {
      task,
      entries: enrichedEntries,
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(2)
    }
  });
});

// Start time tracking (timer)
router.post('/start', authMiddleware, (req, res) => {
  const { taskId, description } = req.body;

  if (!taskId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Task ID is required' }
    });
  }

  const task = Task.findById(taskId);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { message: 'Task not found' }
    });
  }

  // Check if user has an active timer
  const activeEntry = TimeTracking.findActive(req.userId);
  if (activeEntry) {
    return res.status(400).json({
      success: false,
      error: { message: 'You already have an active timer' }
    });
  }

  const entry = TimeTracking.create({
    id: uuidv4(),
    taskId,
    userId: req.userId,
    description: description || '',
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null,
    isRunning: true
  });

  res.status(201).json({
    success: true,
    message: 'Timer started',
    data: entry
  });
});

// Stop time tracking
router.post('/stop', authMiddleware, (req, res) => {
  const activeEntry = TimeTracking.findActive(req.userId);
  
  if (!activeEntry) {
    return res.status(400).json({
      success: false,
      error: { message: 'No active timer found' }
    });
  }

  const endTime = new Date();
  const startTime = new Date(activeEntry.startTime);
  const duration = Math.round((endTime - startTime) / 60000); // Duration in minutes

  const updatedEntry = TimeTracking.update(activeEntry.id, {
    endTime: endTime.toISOString(),
    duration,
    isRunning: false
  });

  res.json({
    success: true,
    message: 'Timer stopped',
    data: {
      ...updatedEntry,
      durationMinutes: duration,
      durationFormatted: `${Math.floor(duration / 60)}h ${duration % 60}m`
    }
  });
});

// Add manual time entry
router.post('/manual', authMiddleware, (req, res) => {
  const { taskId, date, duration, description } = req.body;

  if (!taskId || !duration) {
    return res.status(400).json({
      success: false,
      error: { message: 'Task ID and duration are required' }
    });
  }

  const task = Task.findById(taskId);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { message: 'Task not found' }
    });
  }

  const entryDate = date ? new Date(date) : new Date();

  const entry = TimeTracking.create({
    id: uuidv4(),
    taskId,
    userId: req.userId,
    description: description || '',
    startTime: entryDate.toISOString(),
    endTime: entryDate.toISOString(),
    duration: parseInt(duration),
    isRunning: false
  });

  res.status(201).json({
    success: true,
    message: 'Time entry added',
    data: entry
  });
});

// Update time entry
router.put('/:id', authMiddleware, (req, res) => {
  const entry = TimeTracking.findById(req.params.id);
  
  if (!entry) {
    return res.status(404).json({
      success: false,
      error: { message: 'Time entry not found' }
    });
  }

  // Only owner can update
  if (entry.userId !== req.userId) {
    return res.status(403).json({
      success: false,
      error: { message: 'You can only update your own time entries' }
    });
  }

  const { duration, description, date } = req.body;

  const updatedEntry = TimeTracking.update(req.params.id, {
    duration: duration !== undefined ? parseInt(duration) : entry.duration,
    description: description !== undefined ? description : entry.description,
    startTime: date ? new Date(date).toISOString() : entry.startTime
  });

  res.json({
    success: true,
    message: 'Time entry updated',
    data: updatedEntry
  });
});

// Delete time entry
router.delete('/:id', authMiddleware, (req, res) => {
  const entry = TimeTracking.findById(req.params.id);
  
  if (!entry) {
    return res.status(404).json({
      success: false,
      error: { message: 'Time entry not found' }
    });
  }

  // Only owner can delete
  if (entry.userId !== req.userId) {
    return res.status(403).json({
      success: false,
      error: { message: 'You can only delete your own time entries' }
    });
  }

  TimeTracking.delete(req.params.id);

  res.json({
    success: true,
    message: 'Time entry deleted'
  });
});

// Get time report
router.get('/report', authMiddleware, (req, res) => {
  const { startDate, endDate, projectId, userId } = req.query;

  let entries = TimeTracking.findAll({});

  // Filter by date range
  if (startDate) {
    const start = new Date(startDate);
    entries = entries.filter(e => new Date(e.startTime) >= start);
  }
  if (endDate) {
    const end = new Date(endDate);
    entries = entries.filter(e => new Date(e.startTime) <= end);
  }

  // Filter by project
  if (projectId) {
    entries = entries.filter(e => {
      const task = Task.findById(e.taskId);
      return task && task.projectId === projectId;
    });
  }

  // Filter by user
  if (userId) {
    entries = entries.filter(e => e.userId === parseInt(userId));
  }

  // Calculate totals
  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

  // Group by project
  const byProject = {};
  entries.forEach(entry => {
    const task = Task.findById(entry.taskId);
    if (task) {
      const project = Project.findById(task.projectId);
      const projectName = project ? project.name : 'Unknown';
      if (!byProject[projectName]) {
        byProject[projectName] = { totalMinutes: 0, entries: [] };
      }
      byProject[projectName].totalMinutes += entry.duration || 0;
      byProject[projectName].entries.push(entry);
    }
  });

  // Group by user
  const byUser = {};
  entries.forEach(entry => {
    const user = User.findById(entry.userId);
    const userName = user ? user.username : 'Unknown';
    if (!byUser[userName]) {
      byUser[userName] = { totalMinutes: 0, entries: [] };
    }
    byUser[userName].totalMinutes += entry.duration || 0;
    byUser[userName].entries.push(entry);
  });

  res.json({
    success: true,
    data: {
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(2),
      entriesCount: entries.length,
      byProject,
      byUser
    }
  });
});

// Get active timer
router.get('/active', authMiddleware, (req, res) => {
  const activeEntry = TimeTracking.findActive(req.userId);
  
  if (!activeEntry) {
    return res.json({
      success: true,
      data: null,
      message: 'No active timer'
    });
  }

  const task = Task.findById(activeEntry.taskId);
  const project = task ? Project.findById(task.projectId) : null;
  const elapsedMinutes = Math.round((new Date() - new Date(activeEntry.startTime)) / 60000);

  res.json({
    success: true,
    data: {
      ...activeEntry,
      task,
      project,
      elapsedMinutes,
      elapsedFormatted: `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m`
    }
  });
});

module.exports = router;
