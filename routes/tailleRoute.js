const express = require('express');
const {
  createTaille,
  getTaillesWithPromotions,
  addPromotionToTaille,
  applyPromotionToSubcategory,
  getTailleWithPromotion,
  updateTaille,
  deleteTaille,
  setFormatIdToBody,
  createFilterObj,
  resizeTailleImages,
  uploadTailleImages,
  removePromotionFromTaille,
} = require('../services/tailleService');

const authService = require('../services/authService');

const router = express.Router({ mergeParams: true }); // Allow merging params

// Routes for Taille, nested under Format
router
  .route('/')
  .post(
    uploadTailleImages,
    resizeTailleImages,
    authService.protect,
    authService.allowedTo('admin'),
    setFormatIdToBody, // Ensure the format ID is set
    createTaille // Create Taille
  )
  .get(createFilterObj,getTaillesWithPromotions); // Get all Tailles with filtering

  router
  .route('/:id/promotions/:promotionId')
  .post(addPromotionToTaille); // Add promotion to a specific taille
  router.post('/:promotionId/subcategories/:subcategoryId', async (req, res, next) => {
    try {
      const taille = await applyPromotionToSubcategory(req.params.subcategoryId, req.params.promotionId);
      res.status(200).json({ status: 'success', data: taille });
    } catch (err) {
      next(err);
    }
  });
router
  .route('/:id')
  .get(getTailleWithPromotion) // Get a specific Taille
  .put(
    uploadTailleImages,
    resizeTailleImages,
    authService.protect,
    authService.allowedTo('admin'),
    updateTaille // Update Taille
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteTaille // Delete Taille
  );
  router.delete('/:id/promotions',removePromotionFromTaille);

module.exports = router;