const express = require('express');

// Import the CartesPhoto service functions
const {
createCartesPhoto,
deleteCartesPhoto,
getCartesPhotoById,
getCartesPhotos,
resizeCartesPhotosImages,
updateCartesPhoto,
uploadCartesPhotosImages
} = require('../services/CartesPhotosService');
const {
createCartesPhotoValidator,
updateCartesPhotoValidator
} = require('../utils/validators/cartesPhotoValidator');
// Import the authentication service
const authService = require('../services/authService');

// Create the router instance
const router = express.Router();

// Route for getting all cartesPhotos and creating a new cartesPhoto
router
  .route('/')
  .get(getCartesPhotos) // Public route to fetch all cartesPhotos
  .post(
    authService.protect,
    authService.allowedTo('admin'),
    uploadCartesPhotosImages,
    resizeCartesPhotosImages,
    createCartesPhotoValidator,
    createCartesPhoto
  );

// Route for updating and deleting a specific cartesPhoto by ID
router
  .route('/:id')
  .get(getCartesPhotoById)
  .put(
    authService.protect,
    authService.allowedTo('admin'),
    uploadCartesPhotosImages,
    resizeCartesPhotosImages,
    updateCartesPhotoValidator,
    updateCartesPhoto
  )
  .delete(
    authService.protect, // Protect the route to ensure only authenticated users can access
    authService.allowedTo('admin'), // Allow only admins to delete a cartesPhoto
    deleteCartesPhoto // Controller function to delete a specific cartesPhoto
  );

// Export the router
module.exports = router;