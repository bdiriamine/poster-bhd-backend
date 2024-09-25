const express = require('express');
const {
  createTaille,
  getTailles,
  getTaillesForFormat,
  getTaille,
  updateTaille,
  deleteTaille,
  setFormatIdToBody,
  createFilterObj,
} = require('../services/tailleService');

const authService = require('../services/authService');

const router = express.Router({ mergeParams: true }); // Allow merging params

// Routes for Taille, nested under Format
router
  .route('/')
  .post(
    authService.protect,
    authService.allowedTo('admin'),
    setFormatIdToBody, // Ensure the format ID is set
    createTaille // Create Taille
  )
  .get(createFilterObj, getTailles); // Get all Tailles with filtering

router
  .route('/:id')
  .get(getTaille) // Get a specific Taille
  .put(
    authService.protect,
    authService.allowedTo('admin'),
    updateTaille // Update Taille
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteTaille // Delete Taille
  );

module.exports = router;