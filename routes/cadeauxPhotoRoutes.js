const express = require('express');

// Import CadeauxPhoto service functions
const {
  createCadeauxPhoto,
  deleteCadeauxPhoto,
  getCadeauxPhotos,
  getCadeauxPhotoById,
  updateCadeauxPhoto,
  resizeCadeauxPhotosImages,
  uploadCadeauxPhotosImages,
  getCadeauxPhotosBySousCategoriesName

} = require('../services/CadeauxPhotoService');

const {
  createCadeauxPhotoValidator,
  updateCadeauxPhotoValidator,
  getCadeauxPhotoValidator,
} = require('../utils/validators/cadeauxPhotoValidator');

// Import the authentication service
const authService = require('../services/authService');

// Create the router instance
const router = express.Router();

// Route for getting all CadeauxPhotos and creating a new CadeauxPhoto
router
  .route('/')
  .get(getCadeauxPhotos)
  .post(
    authService.protect,
    authService.allowedTo('admin'),
    createCadeauxPhotoValidator,
    uploadCadeauxPhotosImages,
    resizeCadeauxPhotosImages,
    createCadeauxPhoto,
    
  );

// Route for updating and deleting a specific CadeauxPhoto by ID
router
  .route('/:id')
  .get(getCadeauxPhotoValidator, getCadeauxPhotoById)
  .put(
    authService.protect,
    authService.allowedTo('admin'),
    updateCadeauxPhotoValidator,
    uploadCadeauxPhotosImages,
    resizeCadeauxPhotosImages,
    updateCadeauxPhoto
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteCadeauxPhoto
  );
  router.get('/sousCategorie/:sousCategorieName', getCadeauxPhotosBySousCategoriesName);
// Export the router
module.exports = router;