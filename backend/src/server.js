const env = require('./config/env');
const app = require('./app');

const PORT = env.port;

const server = app.listen(PORT, () => {
  console.log(`[server] DAS API running on port ${PORT} (${env.nodeEnv})`);
  console.log(`[server] Health: http://localhost:${PORT}/api/v1/health`);
});

process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received — shutting down gracefully');
  server.close(() => {
    console.log('[server] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[server] SIGINT received — shutting down gracefully');
  server.close(() => {
    console.log('[server] HTTP server closed');
    process.exit(0);
  });
});

module.exports = server;
