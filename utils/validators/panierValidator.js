// validators/panierValidator.js
const { body } = require('express-validator');

// exports.createPanierValidator = [
//   body('user')
//     .notEmpty()
//     .withMessage('User ID is required')
//     .isMongoId()
//     .withMessage('Invalid User ID format'),
//   body('product')
//     .notEmpty()
//     .withMessage('Product ID is required')
//     .isMongoId()
//     .withMessage('Invalid Product ID format'),
//   body('quantite')
//     .notEmpty()
//     .withMessage('Quantity is required')
//     .isInt({ min: 1 })
//     .withMessage('Quantity must be at least 1'),
// ];

// exports.updatePanierValidator = [
//   body('quantite')
//     .optional()
//     .isInt({ min: 1 })
//     .withMessage('Quantity must be at least 1'),
// ];