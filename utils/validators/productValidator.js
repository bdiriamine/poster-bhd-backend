const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const slugify = require('slugify');
exports.getProductValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid Product ID format.'),
  validatorMiddleware,
];

exports.createProductValidator = [
  check('name')
    .notEmpty()
    .withMessage('Category required')
    .isLength({ min: 3 })
    .withMessage('Too short category name')
    .isLength({ max: 32 })
    .withMessage('Too long category name')
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
    
  check('price')
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number.'),
    
  check('description')
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ min: 3 })
    .withMessage('Description must be at least 10 characters long.'),
    
  check('imageCover')
    .notEmpty()
    .withMessage('Product image cover is required.'),
    
  body('priceAfterDiscount')
    .optional()
    .isFloat({ gte: 0 })
    .withMessage('Price after discount must be a non-negative number.')
    .custom((value, { req }) => {
      if (value > req.body.price) {
        throw new Error('Price after discount must be less than or equal to the original price.');
      }
      return true;
    }),

  validatorMiddleware,
];

exports.updateProductValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid Product ID format.'),
    
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty.'),
    
  body('slug')
    .optional()
    .notEmpty()
    .withMessage('Slug cannot be empty.')
    .isLowercase()
    .withMessage('Slug must be in lowercase.'),
    
  body('price')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number.'),
    
  body('description')
    .optional()
    .notEmpty()
    .withMessage('Description cannot be empty.')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long.'),
    
  body('imageCover')
    .optional()
    .notEmpty()
    .withMessage('Product image cover cannot be empty.'),
    
  body('priceAfterDiscount')
    .optional()
    .isFloat({ gte: 0 })
    .withMessage('Price after discount must be a non-negative number.')
    .custom((value, { req }) => {
      if (value > req.body.price) {
        throw new Error('Price after discount must be less than or equal to the original price.');
      }
      return true;
    }),

  validatorMiddleware,
];

exports.deleteProductValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid Product ID format.'),
  validatorMiddleware,
];
