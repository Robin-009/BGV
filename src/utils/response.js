const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const paginated = (res, data, meta, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta,
  });
};

module.exports = { success, paginated };
