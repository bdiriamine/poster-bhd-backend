const express = require('express');


// const {
// createLivrePhotoValidator,
// deleteLivrePhotoValidator,
// getLivrePhotoValidator,
// updateLivrePhotoValidator,
// validate
// } = require('../utils/validators/livrePhotoValidator'); // Make sure to implement these validators

const {
createLivrePhoto,
getLivrePhotos,uploadLivreImages ,
deleteLivrePhoto,updateLivrePhoto,
resizeLivreImages,
getLivrePhotoById} = require('../services/livrePhotoService');

const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(getLivrePhotos)
  .post(
    authService.protect,
    authService.allowedTo('admin'),
    uploadLivreImages,resizeLivreImages,createLivrePhoto 
  );

router
  .route('/:id')
  .get(getLivrePhotoById)
  .put( authService.protect,
    authService.allowedTo('admin'),uploadLivreImages, resizeLivreImages,updateLivrePhoto)
  .delete( authService.protect,
    authService.allowedTo('admin'),deleteLivrePhoto);



module.exports = router;