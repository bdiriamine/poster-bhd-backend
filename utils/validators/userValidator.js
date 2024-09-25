const slugify = require('slugify');
const bcrypt = require('bcryptjs');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const User = require('../../models/userModel');

exports.createUserValidator = [
  check('name')
    .notEmpty()
    .withMessage('User required')
    .isLength({ min: 3 })
    .withMessage('Too short User name')
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check('email')
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid email address')
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error('E-mail already in use'));
        }
      })
    ),

  check('password')
    .notEmpty()
    .withMessage('Password required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error('Password Confirmation incorrect');
      }
      return true;
    }),

  check('passwordConfirm')
    .notEmpty()
    .withMessage('Password confirmation required'),

  check('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid phone number'),

  check('profileImg').optional(),
  check('role').optional(),

  validatorMiddleware,
];

exports.getUserValidator = [
  check('id').isMongoId().withMessage('Invalid User id format'),
  validatorMiddleware,
];

exports.updateUserValidator = [
  check('id').isMongoId().withMessage('Invalid User id format'),
  body('name')
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .custom((val, { req }) => {
      return User.findOne({ email: val }).then((user) => {
        if (user && user._id.toString() !== req.params.id) {
          return Promise.reject(new Error('E-mail already in use'));
        }
      });
    }),
  check('phone')
    .optional()
    .custom((val) => {
      // Regex to validate international phone numbers
      const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
      if (!phoneRegex.test(val)) {
        throw new Error('Invalid phone number');
      }
      return true;
    }),
  check('profileImg').optional(),
  check('role').optional(),
  check('active').optional(),
  validatorMiddleware,
];


exports.changeUserPasswordValidator = [
  check('id').isMongoId().withMessage('Invalid User id format'),
  body('currentPassword')
    .notEmpty()
    .withMessage('You must enter your current password'),
  body('passwordConfirm')
    .notEmpty()
    .withMessage('You must enter the password confirm'),
  body('password')
    .notEmpty()
    .withMessage('You must enter a new password')
    .custom(async (val, { req }) => {
      // Verify current password
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new Error('There is no user for this id');
      }
      const isCorrectPassword = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!isCorrectPassword) {
        throw new Error('Incorrect current password');
      }

      // Verify password confirmation
      if (val !== req.body.passwordConfirm) {
        throw new Error('Password Confirmation incorrect');
      }
      return true;
    }),
  validatorMiddleware,
];

exports.deleteUserValidator = [
  check('id').isMongoId().withMessage('Invalid User id format'),
  validatorMiddleware,
];

exports.updateLoggedUserValidator = [
  body('name')
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('email')
    .optional() // Make this optional to allow not changing the email
    .isEmail()
    .withMessage('Invalid email address')
    .custom((val, { req }) => {
      return User.findOne({ email: val }).then((user) => {
        if (user && user._id.toString() !== req.user.id) { // Check if the user exists and is not the one being updated
          return Promise.reject(new Error('E-mail already in use'));
        }
      });
    }),
  check('phone')
    .optional()
    .isMobilePhone(['ar-EG', 'ar-SA'])
    .withMessage('Invalid phone number only accepted for Egypt and Saudi Arabia'),

  validatorMiddleware,
];