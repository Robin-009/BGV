const { ValidationError } = require('../utils/errors');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
      .join(', ');
    return next(new ValidationError(message));
  }
  req.body = result.data;
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join('.') || 'query'}: ${i.message}`)
      .join(', ');
    return next(new ValidationError(message));
  }
  req.query = result.data;
  next();
};

module.exports = { validate, validateQuery };
