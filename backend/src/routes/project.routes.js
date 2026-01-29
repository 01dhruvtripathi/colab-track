const express = require('express');
const { Project, Task, ActivityLog } = require('../models');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Get all projects
router.get('/', authMiddleware, (req, res) => {
  const { workspaceId } = req.query;
  const projects = Project.findAll(workspaceId);
  res.json({
    success: true,
    data: projects
  });
});

// Get project by ID
router.get('/:id', authMiddleware, (req, res) => {
  const project = Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found' }
    });
  }

  // Get tasks count
  const tasks = Task.findByProject(project.id);
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: tasks.filter(t => t.status === 'DONE').length
  };

  res.json({
    success: true,
    data: { ...project, taskStats }
  });
});

// Create project
router.post('/', authMiddleware, (req, res) => {
  const { name, description, workspaceId } = req.body;

  if (!name || !workspaceId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Project name and workspace ID are required' }
    });
  }

  const project = Project.create({
    name,
    description,
    workspaceId: parseInt(workspaceId),
    ownerId: req.userId
  });

  // Log activity
  ActivityLog.create({
    userId: req.userId,
    entityType: 'PROJECT',
    entityId: project.id,
    action: 'CREATE',
    description: `Created project "${name}"`
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.to(`workspace:${workspaceId}`).emit('project:created', project);

  res.status(201).json({
    success: true,
    data: project,
    message: 'Project created successfully'
  });
});

// Update project
router.put('/:id', authMiddleware, (req, res) => {
  const project = Project.findById(req.params.id);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found' }
    });
  }

  const { name, description, status } = req.body;
  const updated = Project.update(req.params.id, { name, description, status });

  // Log activity
  ActivityLog.create({
    userId: req.userId,
    entityType: 'PROJECT',
    entityId: project.id,
    action: 'UPDATE',
    description: `Updated project "${updated.name}"`
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.to(`project:${req.params.id}`).emit('project:updated', updated);

  res.json({
    success: true,
    data: updated,
    message: 'Project updated successfully'
  });
});

// Delete project
router.delete('/:id', authMiddleware, (req, res) => {
  const project = Project.findById(req.params.id);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found' }
    });
  }

  if (project.ownerId !== req.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { message: 'Only project owner can delete' }
    });
  }

  Project.delete(req.params.id);

  // Log activity
  ActivityLog.create({
    userId: req.userId,
    entityType: 'PROJECT',
    entityId: parseInt(req.params.id),
    action: 'DELETE',
    description: `Deleted project "${project.name}"`
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.to(`workspace:${project.workspaceId}`).emit('project:deleted', { id: req.params.id });

  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
});

// Get project tasks
router.get('/:id/tasks', authMiddleware, (req, res) => {
  const project = Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found' }
    });
  }

  const tasks = Task.findByProject(req.params.id);
  res.json({
    success: true,
    data: tasks
  });
});

// Archive project
router.post('/:id/archive', authMiddleware, (req, res) => {
  const project = Project.findById(req.params.id);
  
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { message: 'Project not found' }
    });
  }

  const updated = Project.update(req.params.id, { status: 'ARCHIVED' });

  // Log activity
  ActivityLog.create({
    userId: req.userId,
    entityType: 'PROJECT',
    entityId: project.id,
    action: 'ARCHIVE',
    description: `Archived project "${project.name}"`
  });

  res.json({
    success: true,
    data: updated,
    message: 'Project archived successfully'
  });
});

module.exports = router;
