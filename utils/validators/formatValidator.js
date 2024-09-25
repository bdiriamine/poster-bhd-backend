const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.getFormatValidator = [
  check('id').isMongoId().withMessage('Invalid Format id format'),
  validatorMiddleware,
];

exports.createFormatValidator = [
  check('type')
      .isIn(['portrait', 'paysage', 'carré', 'panorama'])
      .withMessage('Type must be one of the following: portrait, paysage, carré, panorama.')
      .notEmpty().withMessage('Type is required.'),


  validatorMiddleware,
];

exports.updateFormatValidator = [
    check('id')
      .isMongoId().withMessage('Invalid Format ID format.'),
    body('type')
      .optional()
      .isIn(['portrait', 'paysage', 'carré', 'panorama'])
      .withMessage('Type must be one of the following: portrait, paysage, carré, panorama.'),


    validatorMiddleware,
];


exports.deleteFormatValidator = [
  check('id').isMongoId().withMessage('Invalid Format id format'),
  validatorMiddleware,
];
