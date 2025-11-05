const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const catchAsync = require('../utils/catchAsync');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	max: 10,
	message: 'Too many login/register attempts, please try again after 10 minutes',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

const registerRules = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isString().withMessage('Must be a string')
    .trim()
    .escape(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('player')
    .notEmpty().withMessage('Player name is required')
    .trim()
    .escape(),
  body('height')
    .notEmpty().withMessage('Height is required')
    .isFloat({ min: 1.0, max: 2.5 }).withMessage('Height must be a number (e.g., 1.75)'),
  body('position')
    .isIn(['attacker', 'midfielder', 'defender', 'goalkeeper']).withMessage('Invalid position'),
  body('preferredFoot')
    .isIn(['Right', 'Left', 'Both']).withMessage('Invalid preferred foot'),
  body('profilePicUrl')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Invalid image URL')
    .trim()
];

const loginRules = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .trim()
    .escape(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

router.post(
  '/register', 
  authLimiter, 
  registerRules, 
  validate, 
  catchAsync(authController.register)
);

router.post(
  '/login', 
  authLimiter, 
  loginRules, 
  validate, 
  catchAsync(authController.login)
);

module.exports = router;

