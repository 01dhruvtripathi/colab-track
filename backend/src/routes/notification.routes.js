const express = require('express');
const { Notification } = require('../models');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Get all notifications for current user
router.get('/', authMiddleware, (req, res) => {
  const { unreadOnly } = req.query;
  const notifications = Notification.findByUser(req.userId, unreadOnly === 'true');
  
  res.json({
    success: true,
    data: notifications,
    unreadCount: notifications.filter(n => !n.read).length
  });
});

// Get unread count
router.get('/unread-count', authMiddleware, (req, res) => {
  const notifications = Notification.findByUser(req.userId, true);
  res.json({
    success: true,
    data: { count: notifications.length }
  });
});

// Mark notification as read
router.patch('/:id/read', authMiddleware, (req, res) => {
  const notification = Notification.findById(req.params.id);
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      error: { message: 'Notification not found' }
    });
  }

  if (notification.userId !== req.userId) {
    return res.status(403).json({
      success: false,
      error: { message: 'Access denied' }
    });
  }

  const updated = Notification.markAsRead(req.params.id);

  res.json({
    success: true,
    data: updated
  });
});

// Mark all notifications as read
router.post('/mark-all-read', authMiddleware, (req, res) => {
  Notification.markAllAsRead(req.userId);

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// Delete notification
router.delete('/:id', authMiddleware, (req, res) => {
  const notification = Notification.findById(req.params.id);
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      error: { message: 'Notification not found' }
    });
  }

  if (notification.userId !== req.userId) {
    return res.status(403).json({
      success: false,
      error: { message: 'Access denied' }
    });
  }

  Notification.delete(req.params.id);

  res.json({
    success: true,
    message: 'Notification deleted'
  });
});

module.exports = router;
