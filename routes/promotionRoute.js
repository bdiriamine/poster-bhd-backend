const express = require('express');
const {
  createPromotionValidator,
} = require('../utils/validators/promotionValidator');
const {
  createPromotion,
  getAllPromotionsWithDetails,
  getPromotion,
  updatePromotion,
  deletePromotion,
  applyPromotionToProduct,
} = require('../services/promotionService');

const router = express.Router();

// Route to handle promotions
router
  .route('/')
  .get(getAllPromotionsWithDetails) // Get all promotions
  .post(createPromotionValidator, async (req, res, next) => {
    try {
      const promotion = await createPromotion(req.body);
      res.status(201).json({ status: 'success', data: promotion });
    } catch (err) {
      next(err);
    }
  });

// Route for individual promotion actions
router
  .route('/:id')
  .get(async (req, res, next) => {
    try {
      const promotion = await getPromotion(req.params.promotionId);
      res.status(200).json({ status: 'success', data: promotion });
    } catch (err) {
      next(err);
    }
  })
  .put(updatePromotion)
  .delete(deletePromotion);
  

// Apply promotion to product
router.post('/:promotionId/products/:productId', async (req, res, next) => {
  try {
    const product = await applyPromotionToProduct(req.params.productId, req.params.promotionId);
    res.status(200).json({ status: 'success', data: product });
  } catch (err) {
    next(err);
  }
});

module.exports = router;