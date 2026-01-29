const express = require('express');
const { Task, Project, Notification, ActivityLog, User } = require('../models');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Get all tasks
router.get('/', authMiddleware, (req, res) => {
  const { projectId, assigneeId, status } = req.query;
  const tasks = Task.findAll({ 
    projectId: projectId ? parseInt(projectId) : undefined,
    assigneeId: assigneeId ? parseInt(assigneeId) : undefined,
    status 
  });
  res.json({
    success: true,
    data: tasks
  });
});

// Get my tasks
router.get('/my', authMiddleware, (req, res) => {
  const tasks = Task.findAll({ assigneeId: req.userId });
  res.json({
    success: true,
    data: tasks
  });
});

// Get task by ID
router.get('/:id', authMiddleware, (req, res) => {
  const task = Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { message: 'Task not found' }
    });
  }

  // Get assignee info
  const assignee = task.assigneeId ? User.findById(task.assigneeId) : null;
  const creator = User.findById(task.createdBy);

  res.json({
    success: true,
    data: { ...task, assignee, creator }
  });
});

// Create task
router.post('/', authMiddleware, (req, res) => {
  const { title, description, projectId, assigneeId, priority, status, dueDate, tags, checklist } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Task title and project ID are required' }
    });
  }

  const project = Project.findById(projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found' }
    });
  }

  const task = Task.create({
    title,
    description,
    projectId: parseInt(projectId),
    assigneeId: assigneeId ? parseInt(assigneeId) : null,
    priority,
    status,
    dueDate,
    tags,
    checklist,
    createdBy: req.userId
  });

  // Create notification if assigned
  if (assigneeId && assigneeId !== req.userId) {
    Notification.create({
      userId: assigneeId,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `You have been assigned to task "${title}"`,
      link: `/tasks/${task.id}`
    });

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(`user:${assigneeId}`).emit('notification:new', { type: 'TASK_ASSIGNED', taskId: task.id });
  }

  // Log activity
  ActivityLog.create({
    userId: req.userId,
    entityType: 'TASK',
    entityId: task.id,
    action: 'CREATE',
    description: `Created task "${title}"`
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.to(`project:${projectId}`).emit('task:created', task);

  res.status(201).json({
    success: true,
    data: task,
    message: 'Task created successfully'
  });
});

// Update task
router.put('/:id', authMiddleware, (req, res) => {
  const task = Task.findById(req.params.id);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { message: 'Task not found' }
    });
  }

  const { title, description, status, priority, assigneeId, dueDate, tags, checklist } = req.body;
  const updates = {};
  
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (assigneeId !== undefined) updates.assigneeId = assigneeId ? parseInt(assigneeId) : null;
  if (dueDate !== undefined) updates.dueDate = dueDate;
  if (tags !== undefined) updates.tags = tags;
  if (checklist !== undefined) updates.checklist = checklist;

  const updated = Task.update(req.params.id, updates);

  // Handle assignee change notification
  if (assigneeId && assigneeId !== task.assigneeId) {
    Notification.create({
      userId: assigneeId,
      type: 'TASK_ASSIGNED',
      title: 'Task Assigned',
      message: `You have been assigned to task "${updated.title}"`,
      link: `/tasks/${task.id}`
    });

    const io = req.app.get('io');
    io.to(`user:${assigneeId}`).emit('notification:new', { type: 'TASK_ASSIGNED', taskId: task.id });
  }

  // Handle status change notification
  if (status && status !== task.status && task.assigneeId) {
    Notification.create({
      userId: task.createdBy,
      type: 'TASK_STATUS_CHANGED',
      title: 'Task Status Updated',
      message: `Task "${updated.title}" status changed to ${status}`,
      link: `/tasks/${task.id}`
    });
  }

  // Log activity
  ActivityLog.create({
    userId: req.userId,
    entityType: 'TASK',
    entityId: task.id,
    action: 'UPDATE',
    description: `Updated task "${updated.title}"`,
    metadata: { changes: updates }
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.to(`project:${task.projectId}`).emit('task:updated', updated);

  res.json({
    success: true,
    data: updated,
    message: 'Task updated successfully'
  });
});

// Delete task
router.delete('/:id', authMiddleware, (req, res) => {
  const task = Task.findById(req.params.id);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { message: 'Task not found' }
    });
  }

  Task.delete(req.params.id);

  // Log activity
  ActivityLog.create({
    userId: req.userId,
    entityType: 'TASK',
    entityId: parseInt(req.params.id),
    action: 'DELETE',
    description: `Deleted task "${task.title}"`
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.to(`project:${task.projectId}`).emit('task:deleted', { id: req.params.id });

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
});

// Update task status (quick action)
router.patch('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid status' }
    });
  }

  const task = Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { message: 'Task not found' }
    });
  }

  const updated = Task.update(req.params.id, { status });

  // Log activity
  ActivityLog.create({
    userId: req.userId,
    entityType: 'TASK',
    entityId: task.id,
    action: 'STATUS_CHANGE',
    description: `Changed task "${task.title}" status to ${status}`
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.to(`project:${task.projectId}`).emit('task:updated', updated);

  res.json({
    success: true,
    data: updated,
    message: 'Task status updated'
  });
});

// Update task checklist item
router.patch('/:id/checklist/:index', authMiddleware, (req, res) => {
  const { completed } = req.body;
  const task = Task.findById(req.params.id);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { message: 'Task not found' }
    });
  }

  const index = parseInt(req.params.index);
  if (task.checklist && task.checklist[index]) {
    task.checklist[index].completed = completed;
    const updated = Task.update(req.params.id, { checklist: task.checklist });

    res.json({
      success: true,
      data: updated,
      message: 'Checklist updated'
    });
  } else {
    res.status(404).json({
      success: false,
      error: { message: 'Checklist item not found' }
    });
  }
});

module.exports = router;
