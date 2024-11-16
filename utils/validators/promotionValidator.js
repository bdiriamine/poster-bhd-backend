const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createPromotionValidator = [
  check('name').notEmpty().withMessage('Promotion name is required'),
  check('discountPercentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  check('startDate').isISO8601().withMessage('Valid start date is required'),
  check('endDate')
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after the start date');
      }
      return true;
    }),
  validatorMiddleware,
];

exports.updatePromotionValidator = [
  check('name').optional().notEmpty().withMessage('Promotion name is required'),
  check('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  check('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  check('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after the start date');
      }
      return true;
    }),
  validatorMiddleware,
];

exports.deletePromotionValidator = [
  check('id').isMongoId().withMessage('Invalid Promotion ID format'),
  validatorMiddleware,
];
