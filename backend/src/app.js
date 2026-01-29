const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const teamRoutes = require('./routes/team.routes');
const commentRoutes = require('./routes/comment.routes');
const notificationRoutes = require('./routes/notification.routes');
const fileRoutes = require('./routes/file.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const timeTrackingRoutes = require('./routes/timeTracking.routes');
const activityRoutes = require('./routes/activity.routes');

// Import middlewares
const errorMiddleware = require('./middlewares/error.middleware');

// Initialize database with seed data
const db = require('./models');
db.seed();

const app = express();
const httpServer = createServer(app);

// Socket.io setup for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join:project', (projectId) => {
    socket.join(`project:${projectId}`);
    console.log(`Socket ${socket.id} joined project ${projectId}`);
  });

  socket.on('join:workspace', (workspaceId) => {
    socket.join(`workspace:${workspaceId}`);
    console.log(`Socket ${socket.id} joined workspace ${workspaceId}`);
  });

  socket.on('join:user', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined user channel ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, error: { message: 'Too many requests' } }
});
app.use('/api/', limiter);

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check (before API routes)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'colab-track-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'colab-track-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/time-tracking', timeTrackingRoutes);
app.use('/api/activity', activityRoutes);

// API docs endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Colab Track API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'User login',
        'POST /api/auth/logout': 'User logout',
        'GET /api/auth/me': 'Get current user'
      },
      users: {
        'GET /api/users': 'List all users',
        'GET /api/users/:id': 'Get user by ID',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user'
      },
      workspaces: {
        'GET /api/workspaces': 'List workspaces',
        'POST /api/workspaces': 'Create workspace',
        'GET /api/workspaces/:id': 'Get workspace',
        'PUT /api/workspaces/:id': 'Update workspace',
        'DELETE /api/workspaces/:id': 'Delete workspace'
      },
      projects: {
        'GET /api/projects': 'List projects',
        'POST /api/projects': 'Create project',
        'GET /api/projects/:id': 'Get project',
        'PUT /api/projects/:id': 'Update project',
        'DELETE /api/projects/:id': 'Delete project'
      },
      tasks: {
        'GET /api/tasks': 'List tasks',
        'POST /api/tasks': 'Create task',
        'GET /api/tasks/:id': 'Get task',
        'PUT /api/tasks/:id': 'Update task',
        'DELETE /api/tasks/:id': 'Delete task'
      },
      teams: {
        'GET /api/teams': 'List teams',
        'POST /api/teams': 'Create team',
        'GET /api/teams/:id': 'Get team',
        'PUT /api/teams/:id': 'Update team',
        'DELETE /api/teams/:id': 'Delete team'
      }
    }
  });
});

// Serve frontend for all other routes (after API routes)
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'index.html'));
});

// Error handling
app.use(errorMiddleware);

module.exports = { app, httpServer };
