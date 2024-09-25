const express = require('express');

const {
  getFormatValidator,
  createFormatValidator,
  updateFormatValidator,
  deleteFormatValidator,
} = require('../utils/validators/formatValidator');

const {
  getFormats,
  getFormat,
  createFormat,
  updateFormat,
  deleteFormat,
} = require('../services/formatService');

const authService = require('../services/authService');

const tailleRoute = require('./tailleRoute');

const router = express.Router();

// Nested route
router.use('/:formatId/tailles', tailleRoute);

router
  .route('/')
  .get(getFormats)
  .post(
    authService.protect,
    authService.allowedTo('admin'),
    createFormatValidator,
    createFormat
  );
router
  .route('/:id')
  .get(getFormatValidator, getFormat)
  .put(
    authService.protect,
    authService.allowedTo('admin' ),
    updateFormatValidator,
    updateFormat
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteFormatValidator,
    deleteFormat
  );

module.exports = router;
