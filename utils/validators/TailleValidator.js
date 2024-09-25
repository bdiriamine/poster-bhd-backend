const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.getTailleValidator = [
  check('id').isMongoId().withMessage('Invalid Taille id format'),
  validatorMiddleware,
];

exports.createTailleValidator = [
    body('width')
    .isNumeric().withMessage('Width must be a number.')
    .isFloat({ gt: 0 }).withMessage('Width must be positive.'),
  
  body('height')
    .isNumeric().withMessage('Height must be a number.')
    .isFloat({ gt: 0 }).withMessage('Height must be positive.'),
  
  body('prix')
    .isNumeric().withMessage('Price must be a number.')
    .isFloat({ gt: 0 }).withMessage('Price must be positive.'),
  
  body('unit')
    .optional()
    .isIn(['cm', 'm', 'inches']).withMessage('Invalid unit. Must be cm, m, or inches.'),
  check('format')
    .notEmpty()
    .withMessage('taille must be belong to format')
    .isMongoId()
    .withMessage('Invalid format id format'),

  validatorMiddleware,
];

exports.updateTailleValidator = [
  check('id')
    .isMongoId().withMessage('Invalid Taille ID format.'), // Validate MongoDB ObjectId
  body('width')
    .optional()
    .isNumeric().withMessage('Width must be a number.')
    .isFloat({ gt: 0 }).withMessage('Width must be positive.'),
  body('height')
    .optional()
    .isNumeric().withMessage('Height must be a number.')
    .isFloat({ gt: 0 }).withMessage('Height must be positive.'),
  body('prix')
    .optional()
    .isNumeric().withMessage('Price must be a number.')
    .isFloat({ gt: 0 }).withMessage('Price must be positive.'),
  body('unit')
    .optional()
    .isIn(['cm', 'm', 'inches']).withMessage('Invalid unit. Must be cm, m, or inches.'),
    validatorMiddleware,
];


exports.deleteTailleValidator = [
  check('id').isMongoId().withMessage('Invalid Taille id format'),
  validatorMiddleware,
];
