const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Format = require('../../models/formatModel');

exports.getFormatValidator = [
  check('id').isMongoId().withMessage('Invalid Format id format'),
  validatorMiddleware,
];

exports.createFormatValidator = [
  check('type')
    .notEmpty().withMessage('Type is required.')
    .custom(async (value) => {
      const existingFormat = await Format.findOne({ type: value });
      if (existingFormat) {
        throw new Error('Type must be unique.');
      }
      return true; // Indicates the validation passed
    }),

  validatorMiddleware,
];

exports.updateFormatValidator = [
    check('id')
      .isMongoId().withMessage('Invalid Format ID format.'),
    body('type')
      .optional(),


    validatorMiddleware,
];


exports.deleteFormatValidator = [
  check('id').isMongoId().withMessage('Invalid Format id format'),
  validatorMiddleware,
];
