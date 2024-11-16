const express = require('express');

const {
createTiragePhoto,
deleteTiragePhoto,
getTiragePhotoById,
getTiragePhotos,
updateTiragePhoto,
resizeTiragePhoto,
uploadTiragePhoto} = require('../services/TiragePhotoService');

const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(getTiragePhotos)
  .post(
    authService.protect,
    authService.allowedTo('admin'),
    uploadTiragePhoto,resizeTiragePhoto,createTiragePhoto 
  );

router
  .route('/:id')
  .get(getTiragePhotoById)
  .put( authService.protect,
    authService.allowedTo('admin'),uploadTiragePhoto, resizeTiragePhoto,updateTiragePhoto)
  .delete( authService.protect,
    authService.allowedTo('admin'),deleteTiragePhoto);



module.exports = router;