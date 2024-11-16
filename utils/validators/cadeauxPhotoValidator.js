const { body, param ,check} = require('express-validator');

// Validator for creating a new CadeauxPhoto
exports.createCadeauxPhotoValidator = [
  check('occasion')
    .isString()
    .withMessage('Occasion must be a string')
    .notEmpty()
    .withMessage('Occasion is required'),

    check('personalizedMessage')
    .isString()
    .withMessage('Personalized message must be a string')
    .notEmpty()
    .withMessage('Personalized message is required'),

    check('wrappingType')
    .isString()
    .withMessage('Wrapping type must be a string')
    .notEmpty()
    .withMessage('Wrapping type is required'),

    check('giftSize')
    .isString()
    .withMessage('Gift size must be a string')
    .notEmpty()
    .withMessage('Gift size is required'),

    check('numberOfPhoto')
    .isInt({ min: 1 })
    .withMessage('Number of photos must be a positive integer')
    .notEmpty()
    .withMessage('Number of photos is required'),

];

// Validator for updating CadeauxPhoto
exports.updateCadeauxPhotoValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid CadeauxPhoto ID'),

  body('occasion')
    .optional()
    .isString()
    .withMessage('Occasion must be a string'),

  body('personalizedMessage')
    .optional()
    .isString()
    .withMessage('Personalized message must be a string'),

  body('wrappingType')
    .optional()
    .isString()
    .withMessage('Wrapping type must be a string'),

  body('giftSize')
    .optional()
    .isString()
    .withMessage('Gift size must be a string'),

  body('numberOfPhoto')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Number of photos must be a positive integer'),


];

// Validator for getting CadeauxPhoto by ID
exports.getCadeauxPhotoValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid CadeauxPhoto ID'),
];