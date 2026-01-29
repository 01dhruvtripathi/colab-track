const express = require('express');
const { Workspace, User } = require('../models');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Get all workspaces for current user
router.get('/', authMiddleware, (req, res) => {
  const workspaces = Workspace.findAll(req.userId);
  res.json({
    success: true,
    data: workspaces
  });
});

// Get workspace by ID
router.get('/:id', authMiddleware, (req, res) => {
  const workspace = Workspace.findById(req.params.id);
  if (!workspace) {
    return res.status(404).json({
      success: false,
      error: { message: 'Workspace not found' }
    });
  }

  // Check access
  if (workspace.ownerId !== req.userId && !workspace.members.includes(req.userId)) {
    return res.status(403).json({
      success: false,
      error: { message: 'Access denied' }
    });
  }

  res.json({
    success: true,
    data: workspace
  });
});

// Create workspace
router.post('/', authMiddleware, (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: { message: 'Workspace name is required' }
    });
  }

  const workspace = Workspace.create({
    name,
    description,
    ownerId: req.userId
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.to(`user:${req.userId}`).emit('workspace:created', workspace);

  res.status(201).json({
    success: true,
    data: workspace,
    message: 'Workspace created successfully'
  });
});

// Update workspace
router.put('/:id', authMiddleware, (req, res) => {
  const workspace = Workspace.findById(req.params.id);
  
  if (!workspace) {
    return res.status(404).json({
      success: false,
      error: { message: 'Workspace not found' }
    });
  }

  if (workspace.ownerId !== req.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { message: 'Only workspace owner can update' }
    });
  }

  const { name, description } = req.body;
  const updated = Workspace.update(req.params.id, { name, description });

  // Emit real-time update
  const io = req.app.get('io');
  io.to(`workspace:${req.params.id}`).emit('workspace:updated', updated);

  res.json({
    success: true,
    data: updated,
    message: 'Workspace updated successfully'
  });
});

// Delete workspace
router.delete('/:id', authMiddleware, (req, res) => {
  const workspace = Workspace.findById(req.params.id);
  
  if (!workspace) {
    return res.status(404).json({
      success: false,
      error: { message: 'Workspace not found' }
    });
  }

  if (workspace.ownerId !== req.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { message: 'Only workspace owner can delete' }
    });
  }

  Workspace.delete(req.params.id);

  // Emit real-time update
  const io = req.app.get('io');
  io.to(`workspace:${req.params.id}`).emit('workspace:deleted', { id: req.params.id });

  res.json({
    success: true,
    message: 'Workspace deleted successfully'
  });
});

// Add member to workspace
router.post('/:id/members', authMiddleware, (req, res) => {
  const workspace = Workspace.findById(req.params.id);
  
  if (!workspace) {
    return res.status(404).json({
      success: false,
      error: { message: 'Workspace not found' }
    });
  }

  if (workspace.ownerId !== req.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { message: 'Only workspace owner can add members' }
    });
  }

  const { userId, email } = req.body;
  let memberUserId = userId;

  if (email) {
    const user = User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    memberUserId = user.id;
  }

  const updated = Workspace.addMember(req.params.id, memberUserId);

  // Emit real-time update
  const io = req.app.get('io');
  io.to(`workspace:${req.params.id}`).emit('workspace:member-added', { workspaceId: req.params.id, userId: memberUserId });

  res.json({
    success: true,
    data: updated,
    message: 'Member added successfully'
  });
});

// Get workspace members
router.get('/:id/members', authMiddleware, (req, res) => {
  const workspace = Workspace.findById(req.params.id);
  
  if (!workspace) {
    return res.status(404).json({
      success: false,
      error: { message: 'Workspace not found' }
    });
  }

  const members = workspace.members.map(id => User.findById(id)).filter(Boolean);

  res.json({
    success: true,
    data: members
  });
});

module.exports = router;
