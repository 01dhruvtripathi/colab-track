const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { File, Task } = require('../models');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

// Get files for a task
router.get('/task/:taskId', authMiddleware, (req, res) => {
  const files = File.findByTask(req.params.taskId);
  res.json({
    success: true,
    data: files
  });
});

// Upload file
router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  try {
    const { taskId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' }
      });
    }

    const file = File.create({
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      taskId: taskId ? parseInt(taskId) : null,
      uploadedBy: req.userId
    });

    res.status(201).json({
      success: true,
      data: file,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Download file
router.get('/:id/download', authMiddleware, (req, res) => {
  const file = File.findById(req.params.id);
  
  if (!file) {
    return res.status(404).json({
      success: false,
      error: { message: 'File not found' }
    });
  }

  const filePath = path.join(__dirname, '..', '..', file.filePath);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: { message: 'File not found on server' }
    });
  }

  res.download(filePath, file.fileName);
});

// Delete file
router.delete('/:id', authMiddleware, (req, res) => {
  const file = File.findById(req.params.id);
  
  if (!file) {
    return res.status(404).json({
      success: false,
      error: { message: 'File not found' }
    });
  }

  if (file.uploadedBy !== req.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { message: 'Only file owner can delete' }
    });
  }

  // Delete file from disk
  const filePath = path.join(__dirname, '..', '..', file.filePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  File.delete(req.params.id);

  res.json({
    success: true,
    message: 'File deleted successfully'
  });
});

module.exports = router;
