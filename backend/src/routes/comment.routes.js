const express = require('express');
const { Comment, Task, User, Notification } = require('../models');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Get comments for a task
router.get('/task/:taskId', authMiddleware, (req, res) => {
  const comments = Comment.findByTask(req.params.taskId);
  
  // Add user info to comments
  const enrichedComments = comments.map(comment => ({
    ...comment,
    user: User.findById(comment.userId)
  }));

  res.json({
    success: true,
    data: enrichedComments
  });
});

// Create comment
router.post('/', authMiddleware, (req, res) => {
  const { taskId, content, parentCommentId, mentions } = req.body;

  if (!taskId || !content) {
    return res.status(400).json({
      success: false,
      error: { message: 'Task ID and content are required' }
    });
  }

  const task = Task.findById(taskId);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: { message: 'Task not found' }
    });
  }

  const comment = Comment.create({
    taskId: parseInt(taskId),
    userId: req.userId,
    content,
    parentCommentId: parentCommentId ? parseInt(parentCommentId) : null,
    mentions: mentions || []
  });

  // Create notifications for mentions
  if (mentions && mentions.length > 0) {
    mentions.forEach(mentionedUserId => {
      if (mentionedUserId !== req.userId) {
        Notification.create({
          userId: mentionedUserId,
          type: 'MENTION',
          title: 'You were mentioned',
          message: `${req.user.name} mentioned you in a comment`,
          link: `/tasks/${taskId}`
        });

        // Emit real-time notification
        const io = req.app.get('io');
        io.to(`user:${mentionedUserId}`).emit('notification:new', { type: 'MENTION', taskId });
      }
    });
  }

  // Notify task assignee about new comment
  if (task.assigneeId && task.assigneeId !== req.userId) {
    Notification.create({
      userId: task.assigneeId,
      type: 'COMMENT',
      title: 'New Comment',
      message: `${req.user.name} commented on task "${task.title}"`,
      link: `/tasks/${taskId}`
    });

    const io = req.app.get('io');
    io.to(`user:${task.assigneeId}`).emit('notification:new', { type: 'COMMENT', taskId });
  }

  // Emit real-time update
  const io = req.app.get('io');
  io.to(`project:${task.projectId}`).emit('comment:created', {
    ...comment,
    user: req.user
  });

  res.status(201).json({
    success: true,
    data: { ...comment, user: req.user },
    message: 'Comment added successfully'
  });
});

// Update comment
router.put('/:id', authMiddleware, (req, res) => {
  const comment = Comment.findById(req.params.id);
  
  if (!comment) {
    return res.status(404).json({
      success: false,
      error: { message: 'Comment not found' }
    });
  }

  if (comment.userId !== req.userId) {
    return res.status(403).json({
      success: false,
      error: { message: 'Can only edit your own comments' }
    });
  }

  const { content } = req.body;
  const updated = Comment.update(req.params.id, { content });

  res.json({
    success: true,
    data: { ...updated, user: req.user },
    message: 'Comment updated successfully'
  });
});

// Delete comment
router.delete('/:id', authMiddleware, (req, res) => {
  const comment = Comment.findById(req.params.id);
  
  if (!comment) {
    return res.status(404).json({
      success: false,
      error: { message: 'Comment not found' }
    });
  }

  if (comment.userId !== req.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { message: 'Can only delete your own comments' }
    });
  }

  Comment.delete(req.params.id);

  res.json({
    success: true,
    message: 'Comment deleted successfully'
  });
});

module.exports = router;
