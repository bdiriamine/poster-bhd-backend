const { check, validationResult } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
// Create CalendriePhoto Validator
exports.createCalendriePhotoValidator = [
  check('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('L\'année doit être un nombre valide entre 1900 et l\'année suivante.'),
  
  check('paperQuality')
    .notEmpty()
    .withMessage('La qualité du papier est requise.')
    .isString()
    .withMessage('La qualité du papier doit être une chaîne de caractères.'),

  check('numberOfPhotos')
    .isInt({ min: 1 })
    .withMessage('Le nombre de photos doit être un entier positif.')
    .notEmpty()
    .withMessage('Le nombre de photos est requis.'),
  validatorMiddleware
];

// Update CalendriePhoto Validator
exports.updateCalendriePhotoValidator = [
  check('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('L\'année doit être un nombre valide entre 1900 et l\'année suivante.'),
  
  check('paperQuality')
    .optional()
    .isString()
    .withMessage('La qualité du papier doit être une chaîne de caractères.'),

  check('numberOfPhotos')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le nombre de photos doit être un entier positif.'),

  // Custom validator middleware to handle validation errors
  validatorMiddleware
];

// Validator for getting and deleting CalendriePhoto
exports.getCalendriePhotoValidator = [
  check('id')
    .isMongoId()
    .withMessage('L\'ID de CalendriePhoto doit être un ID MongoDB valide.'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: errors.array().map(error => error.msg).join(', '),
      });
    }
    next();
  }
];
exports.deleteCalendriePhotoValidator = [
  check('id').isMongoId().withMessage('Invalid CalendriePhoto id format'),
  validatorMiddleware,
];