const { body, param, validationResult } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
// Validator for creating a new LivrePhoto
const createLivrePhotoValidator = [
  body('numberOfPages')
    .isNumeric()
    .withMessage('Le nombre de pages doit être un nombre')
    .notEmpty()
    .withMessage('Le nombre de pages est requis')
    .isInt({ min: 1 })
    .withMessage('Un livre doit avoir au moins 1 page'),
  
  body('coverType')
    .isString()
    .withMessage('Le type de couverture doit être une chaîne')
    .notEmpty()
    .withMessage('Le type de couverture est requis')
    .isIn(['hardcover', 'softcover'])
    .withMessage('Le type de couverture doit être "hardcover" ou "softcover"'),

  body('paperQuality')
    .isString()
    .withMessage('La qualité du papier doit être une chaîne')
    .notEmpty()
    .withMessage('La qualité du papier est requise'),

  // Custom validation to ensure no duplicate titles if needed
  // body('title').custom(async (value) => {
  //   const existingLivrePhoto = await LivrePhoto.findOne({ title: value });
  //   if (existingLivrePhoto) {
  //     return Promise.reject('Ce titre existe déjà');
  //   }
  // }),
  validatorMiddleware
];

// Validator for getting a LivrePhoto by ID
const getLivrePhotoValidator = [
  param('id')
    .isMongoId()
    .withMessage('ID invalide, assurez-vous d\'utiliser un ID Mongo valide')
];

// Validator for updating a LivrePhoto
const updateLivrePhotoValidator = [
  param('id')
    .isMongoId()
    .withMessage('ID invalide, assurez-vous d\'utiliser un ID Mongo valide'),

  body('numberOfPages')
    .optional()
    .isNumeric()
    .withMessage('Le nombre de pages doit être un nombre')
    .isInt({ min: 1 })
    .withMessage('Un livre doit avoir au moins 1 page'),

  body('coverType')
    .optional()
    .isString()
    .withMessage('Le type de couverture doit être une chaîne')
    .isIn(['hardcover', 'softcover'])
    .withMessage('Le type de couverture doit être "hardcover" ou "softcover"'),

  body('paperQuality')
    .optional()
    .isString()
    .withMessage('La qualité du papier doit être une chaîne'),
    validatorMiddleware
];

// Validator for deleting a LivrePhoto
const deleteLivrePhotoValidator = [
  param('id')
    .isMongoId()
    .withMessage('ID invalide, assurez-vous d\'utiliser un ID Mongo valide'),
    validatorMiddleware
];

// Middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  createLivrePhotoValidator,
  getLivrePhotoValidator,
  updateLivrePhotoValidator,
  deleteLivrePhotoValidator,
  validate, // Export the validation middleware
};