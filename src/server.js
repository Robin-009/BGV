require('./config/env');
const app = require('./app');
const { PORT } = require('./config/env');
const prisma = require('./config/database');

const server = app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
});

const shutdown = async (signal) => {
  console.log(`[server] ${signal} received — shutting down`);
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled rejection:', err);
  server.close(() => process.exit(1));
});
