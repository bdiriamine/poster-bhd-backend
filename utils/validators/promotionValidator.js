const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createPromotionValidator = [
  check('name')
    .notEmpty()
    .withMessage('Promotion name is required.')
    .isLength({ min: 3 })
    .withMessage('Promotion name must be at least 3 characters long.'),
    
  check('discountPercentage')
    .notEmpty()
    .withMessage('Discount percentage is required.')
    .isFloat({ gt: 0, lt: 100 })
    .withMessage('Discount percentage must be between 0 and 100.'),
    
  check('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date.'),
    
  check('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date.')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date.');
      }
      return true;
    }),
    
  validatorMiddleware,
];