const { body, param } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
// Validator for creating a new CartesPhoto
exports.createCartesPhotoValidator = [
  body('numberOfCards')
    .isNumeric()
    .withMessage('Number of cards must be a number')
    .notEmpty()
    .withMessage('Number of cards is required'),

  body('paperQuality')
    .isString()
    .withMessage('Paper quality must be a string')
    .notEmpty()
    .withMessage('Paper quality is required'),

  body('occasion')
    .isString()
    .withMessage('Occasion must be a string')
    .notEmpty()
    .withMessage('Occasion is required'),
    validatorMiddleware

  // You can add more validation for other fields if necessary
];

// Validator for updating a CartesPhoto
exports.updateCartesPhotoValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid CartesPhoto ID'),

  body('numberOfCards')
    .optional()
    .isNumeric()
    .withMessage('Number of cards must be a number'),

  body('paperQuality')
    .optional()
    .isString()
    .withMessage('Paper quality must be a string'),

  body('occasion')
    .optional()
    .isString()
    .withMessage('Occasion must be a string'),
    validatorMiddleware
];

// Validator for getting a CartesPhoto by ID
exports.getCartesPhotoValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid CartesPhoto ID'),
];
