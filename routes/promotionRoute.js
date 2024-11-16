const express = require('express');
const {
  createPromotionValidator,
  updatePromotionValidator,
  deletePromotionValidator
} = require('../utils/validators/promotionValidator');
const {
  createPromotion,
  getPromotions,
  getPromotion,
  updatePromotion,
  deletePromotion,
  applyPromotionToProduct,
  removePromotionFromProduct,
  getAllPromotionsWithDetails
} = require('../services/promotionService');
const authService = require('../services/authService');
const router = express.Router({ mergeParams: true });

// Route to get all promotions or create a promotion (requires admin auth)
router
  .route('/')
  .get(getAllPromotionsWithDetails) // Get all promotions
  .post(
    authService.protect,
    authService.allowedTo('admin'),
    createPromotionValidator, // Validate promotion creation
    createPromotion // Create a promotion
  );

// Route to handle promotion by ID (GET, UPDATE, DELETE)
router
  .route('/:id')
  .get(getPromotion) // Get a single promotion by ID
  .put(
    authService.protect,
    authService.allowedTo('admin'),
    updatePromotionValidator, // Validate promotion update
    updatePromotion // Update the promotion
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deletePromotionValidator, // Validate promotion deletion
    deletePromotion // Delete the promotion
  );

// Apply promotion to product
router.route(
  '/:promotionId/products/:productId',
).post(
  authService.protect,
  authService.allowedTo('admin'),
  applyPromotionToProduct // Link promotion to product
)
.delete(
  authService.protect,
  authService.allowedTo('admin'),
  removePromotionFromProduct // Unlink promotion from product
);;

module.exports = router;