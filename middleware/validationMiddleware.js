const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map(err => ({ 
    [err.param || 'general']: err.msg 
  }));

  return res.status(400).json({
    message: "Validation Error",
    errors: extractedErrors,
  });
};

module.exports = { validate };

