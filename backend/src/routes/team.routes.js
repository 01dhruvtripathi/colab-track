const express = require('express');
const { Team, User, ActivityLog } = require('../models');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Get all teams
router.get('/', authMiddleware, (req, res) => {
  const { workspaceId } = req.query;
  const teams = Team.findAll(workspaceId ? parseInt(workspaceId) : undefined);
  res.json({
    success: true,
    data: teams
  });
});

// Get team by ID
router.get('/:id', authMiddleware, (req, res) => {
  const team = Team.findById(req.params.id);
  if (!team) {
    return res.status(404).json({
      success: false,
      error: { message: 'Team not found' }
    });
  }

  // Get member details
  const members = team.members.map(id => User.findById(id)).filter(Boolean);
  const leader = User.findById(team.leaderId);

  res.json({
    success: true,
    data: { ...team, members, leader }
  });
});

// Create team
router.post('/', authMiddleware, (req, res) => {
  const { name, description, workspaceId } = req.body;

  if (!name || !workspaceId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Team name and workspace ID are required' }
    });
  }

  const team = Team.create({
    name,
    description,
    workspaceId: parseInt(workspaceId),
    leaderId: req.userId
  });

  // Log activity
  ActivityLog.create({
    userId: req.userId,
    entityType: 'TEAM',
    entityId: team.id,
    action: 'CREATE',
    description: `Created team "${name}"`
  });

  // Emit real-time update
  const io = req.app.get('io');
  io.to(`workspace:${workspaceId}`).emit('team:created', team);

  res.status(201).json({
    success: true,
    data: team,
    message: 'Team created successfully'
  });
});

// Update team
router.put('/:id', authMiddleware, (req, res) => {
  const team = Team.findById(req.params.id);
  
  if (!team) {
    return res.status(404).json({
      success: false,
      error: { message: 'Team not found' }
    });
  }

  if (team.leaderId !== req.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { message: 'Only team leader can update' }
    });
  }

  const { name, description } = req.body;
  const updated = Team.update(req.params.id, { name, description });

  // Log activity
  ActivityLog.create({
    userId: req.userId,
    entityType: 'TEAM',
    entityId: team.id,
    action: 'UPDATE',
    description: `Updated team "${updated.name}"`
  });

  res.json({
    success: true,
    data: updated,
    message: 'Team updated successfully'
  });
});

// Delete team
router.delete('/:id', authMiddleware, (req, res) => {
  const team = Team.findById(req.params.id);
  
  if (!team) {
    return res.status(404).json({
      success: false,
      error: { message: 'Team not found' }
    });
  }

  if (team.leaderId !== req.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { message: 'Only team leader can delete' }
    });
  }

  Team.delete(req.params.id);

  // Log activity
  ActivityLog.create({
    userId: req.userId,
    entityType: 'TEAM',
    entityId: parseInt(req.params.id),
    action: 'DELETE',
    description: `Deleted team "${team.name}"`
  });

  res.json({
    success: true,
    message: 'Team deleted successfully'
  });
});

// Add member to team
router.post('/:id/members', authMiddleware, (req, res) => {
  const team = Team.findById(req.params.id);
  
  if (!team) {
    return res.status(404).json({
      success: false,
      error: { message: 'Team not found' }
    });
  }

  if (team.leaderId !== req.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { message: 'Only team leader can add members' }
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

  const updated = Team.addMember(req.params.id, parseInt(memberUserId));

  res.json({
    success: true,
    data: updated,
    message: 'Member added successfully'
  });
});

// Remove member from team
router.delete('/:id/members/:userId', authMiddleware, (req, res) => {
  const team = Team.findById(req.params.id);
  
  if (!team) {
    return res.status(404).json({
      success: false,
      error: { message: 'Team not found' }
    });
  }

  if (team.leaderId !== req.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { message: 'Only team leader can remove members' }
    });
  }

  const memberUserId = parseInt(req.params.userId);
  
  if (memberUserId === team.leaderId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Cannot remove team leader' }
    });
  }

  team.members = team.members.filter(id => id !== memberUserId);
  Team.update(req.params.id, { members: team.members });

  res.json({
    success: true,
    message: 'Member removed successfully'
  });
});

// Get team members
router.get('/:id/members', authMiddleware, (req, res) => {
  const team = Team.findById(req.params.id);
  
  if (!team) {
    return res.status(404).json({
      success: false,
      error: { message: 'Team not found' }
    });
  }

  const members = team.members.map(id => User.findById(id)).filter(Boolean);

  res.json({
    success: true,
    data: members
  });
});

module.exports = router;
