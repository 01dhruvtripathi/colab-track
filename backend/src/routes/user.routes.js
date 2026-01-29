const express = require('express');
const { User } = require('../models');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

// Get all users
router.get('/', authMiddleware, (req, res) => {
  const users = User.findAll();
  res.json({
    success: true,
    data: users
  });
});

// Get user by ID
router.get('/:id', authMiddleware, (req, res) => {
  const user = User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { message: 'User not found' }
    });
  }
  res.json({
    success: true,
    data: user
  });
});

// Update user
router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  
  // Users can only update themselves unless admin
  if (parseInt(id) !== req.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { message: 'Cannot update other users' }
    });
  }

  const { name, avatar } = req.body;
  const user = User.update(id, { name, avatar });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { message: 'User not found' }
    });
  }

  res.json({
    success: true,
    data: user,
    message: 'User updated successfully'
  });
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), (req, res) => {
  const deleted = User.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: { message: 'User not found' }
    });
  }
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Update user role (admin only)
router.patch('/:id/role', authMiddleware, requireRole('ADMIN'), (req, res) => {
  const { role } = req.body;
  const validRoles = ['ADMIN', 'MANAGER', 'CONTRIBUTOR', 'VIEWER'];
  
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid role' }
    });
  }

  const user = User.update(req.params.id, { role });
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { message: 'User not found' }
    });
  }

  res.json({
    success: true,
    data: user,
    message: 'Role updated successfully'
  });
});

module.exports = router;
