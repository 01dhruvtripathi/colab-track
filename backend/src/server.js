require('dotenv').config();
const { app, httpServer } = require('./app');

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, () => {
  console.log(`🚀 Colab Track Backend running on port ${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket enabled for real-time features`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
