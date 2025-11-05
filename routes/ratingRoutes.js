const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authenticateToken } = require('../middleware/authMiddleware');
const catchAsync = require('../utils/catchAsync');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

const ratePlayerRules = [
  body('score')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 10 }).withMessage('Rating must be an integer between 1 and 10')
];

router.post(
  '/rate/:id', 
  authenticateToken, 
  ratePlayerRules, 
  validate, 
  catchAsync(ratingController.ratePlayer)
);

module.exports = router;

