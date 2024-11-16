const express = require('express');

// Import the calendriePhoto service functions
const {
createCalendriePhoto,
deleteCalendriePhoto,getCalendriePhotos,
resizeCalendrieImages,updateCalendriePhoto,
uploadCalendrieImages,
getCalendriePhotoById
} = require('../services/CalendriePhotoService');
const {
  createCalendriePhotoValidator,
  updateCalendriePhotoValidator,
  getCalendriePhotoValidator,
} = require('../utils/validators/calendriePhotoValidator');
// Import the authentication service
const authService = require('../services/authService');

// Create the router instance
const router = express.Router();

// Route for getting all calendriePhotos and creating a new calendriePhoto
router
  .route('/')
  .get(getCalendriePhotos) // Public route to fetch all calendriePhotos
  .post(
    authService.protect,
    authService.allowedTo('admin'),
    uploadCalendrieImages,
    resizeCalendrieImages,
    createCalendriePhotoValidator,
    createCalendriePhoto ,

  );

// Route for updating and deleting a specific calendriePhoto by ID
router
  .route('/:id')
  .get(getCalendriePhotoById)
  .put(
    authService.protect, // Protect the route to ensure only authenticated users can access
    authService.allowedTo('admin'), // Allow only admins to update a calendriePhoto
    uploadCalendrieImages,
    resizeCalendrieImages,
    updateCalendriePhotoValidator,
    updateCalendriePhoto 
  )
  .delete(
    authService.protect, // Protect the route to ensure only authenticated users can access
    authService.allowedTo('admin'), // Allow only admins to delete a calendriePhoto
    deleteCalendriePhoto // Controller function to delete a specific calendriePhoto
  );

// Export the router
module.exports = router;