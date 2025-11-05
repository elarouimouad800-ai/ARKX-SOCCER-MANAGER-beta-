const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const catchAsync = require('../utils/catchAsync');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

const updateProfileRules = [
  body('player')
    .optional()
    .notEmpty().withMessage('Player name is required')
    .trim()
    .escape(),
  body('height')
    .optional()
    .isFloat({ min: 1.0, max: 2.5 }).withMessage('Height must be a number (e.g., 1.75)'),
  body('position')
    .optional()
    .isIn(['attacker', 'midfielder', 'defender', 'goalkeeper']).withMessage('Invalid position'),
  body('preferredFoot')
    .optional()
    .isIn(['Right', 'Left', 'Both']).withMessage('Invalid preferred foot'),
  body('profilePicUrl')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Invalid image URL')
    .trim(),
  body('status')
    .optional()
    .isIn(['Ready', 'Not Ready']).withMessage('Invalid status')
];

router.get('/', authenticateToken, catchAsync(playerController.getAllPlayers));
router.get('/me', authenticateToken, catchAsync(playerController.getMyProfile));

router.put(
  '/me', 
  authenticateToken, 
  updateProfileRules, 
  validate, 
  catchAsync(playerController.updateMyProfile)
);

router.delete('/me', authenticateToken, catchAsync(playerController.deleteMyProfile));

router.put(
  '/:id', 
  [authenticateToken, isAdmin], 
  updateProfileRules, 
  validate, 
  catchAsync(playerController.updateUser)
);

router.delete(
  '/:id', 
  [authenticateToken, isAdmin], 
  catchAsync(playerController.deleteUser)
);

module.exports = router;

