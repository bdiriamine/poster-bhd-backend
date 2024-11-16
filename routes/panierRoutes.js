const express = require('express');
// const {
//   getPanierValidator,
//   createPanierValidator,
//   updatePanierValidator,
//   deletePanierValidator,
// } = require('../utils/validators/panierValidator')

const {
  getPaniers,
  getPanierByUserId,
  handleGetPanierById ,
  createPanier,
  updatePanier,
  deletePanier,
  uploadPanierImages,
  resizePanierImages,
} = require('../services/panierService');

const authService = require('../services/authService');

const router = express.Router({ mergeParams: true });

// router
//   .route('/')
//   .get(getPaniers)
//   .post(
//     authService.protect,
//     authService.allowedTo('admin'),
//     uploadPanierImages,
//     resizePanierImages,
//     // createPanierValidator,
//     createPanier
//   );

  // Route to create a new panier
  router.post('/', authService.protect,
    authService.allowedTo('admin','user'),
    uploadPanierImages,
    resizePanierImages, 
    createPanier); 

router
  .route('/:id')
  .get(handleGetPanierById )  
  .put(
    authService.protect,
    authService.allowedTo('admin'),
    uploadPanierImages,
    resizePanierImages,
    // updatePanierValidator,
    updatePanier
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    // deletePanierValidator,
    deletePanier
  );

  router.get('/user/:userId', authService.protect, getPanierByUserId);


module.exports = router;
