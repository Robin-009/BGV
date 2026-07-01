const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Prisma: unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
  }

  // Prisma: record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
    });
  }

  // Zod validation errors bubbled up without middleware
  if (err.name === 'ZodError') {
    const message = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return res.status(400).json({ success: false, message });
  }

  console.error('[ERROR]', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

module.exports = { errorHandler };
