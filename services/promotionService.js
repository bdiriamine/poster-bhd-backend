const Promotion = require('../models/promotionModel');
const Product = require('../models/productModel');
const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactory');

// Create a new promotion
exports.createPromotion = asyncHandler(async (req, res, next) => {
  const promotion = await Promotion.create(req.body);
  res.status(201).json({ status: 'success', data: promotion });
});

// Get all promotions with populated products and tailles
exports.getAllPromotionsWithDetails = asyncHandler(async (req, res) => {
  const promotions = await Promotion.find()
    .populate('produits')
    .populate('tailles'); // Populate 'produits' and 'tailles' fields
  res.status(200).json({ status: 'success', data: promotions });
});

// Apply a promotion to a product
exports.applyPromotionToProduct = asyncHandler(async (req, res, next) => { 
  const { productId, promotionId } = req.params;

  // Find the product and promotion
  const product = await Product.findById(productId);
  const newPromotion = await Promotion.findById(promotionId);

  if (!product || !newPromotion) {
    return res.status(404).json({ status: 'error', message: 'Product or Promotion not found' });
  }

  // If the product already has a promotion, remove the product from the old promotion's 'produits' array
  if (product.promotions) {
    const oldPromotion = await Promotion.findById(product.promotions);
    if (oldPromotion) {
      oldPromotion.produits = oldPromotion.produits.filter(id => id.toString() !== productId);
      await oldPromotion.save();
    }
  }

  // Assign the new promotion to the product
  product.promotions = newPromotion._id;
  await product.save();

  // Add product to new promotion's 'produits' array (if not already present)
  if (!newPromotion.produits.includes(productId)) {
    newPromotion.produits.push(productId);
    await newPromotion.save();
  }

  res.status(200).json({ status: 'success', data: product });
});
exports.removePromotionFromProduct = async (req, res, next) => {
  try {
    const { promotionId, productId } = req.params;

    // Find the product by ID and update its promotion field to null
    const product = await Product.findByIdAndUpdate(
      productId,
      { promotions: null },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find the promotion and remove the product from the promotion's 'produits' array
    const promotion = await Promotion.findById(promotionId);
    if (promotion) {
      promotion.produits = promotion.produits.filter(id => id.toString() !== productId);
      await promotion.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Promotion removed from product and promotion',
      data: product
    });
  } catch (err) {
    next(err);
  }
};
// Update a promotion
exports.updatePromotion = asyncHandler(async (req, res, next) => {
  const promotionId = req.params.id;
  const updatedPromotion = await Promotion.findByIdAndUpdate(
    promotionId,
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedPromotion) {
    return res.status(404).json({ status: 'error', message: 'Promotion not found' });
  }

  res.status(200).json({ status: 'success', data: updatedPromotion });
});

// Delete a promotion
exports.deletePromotion = asyncHandler(async (req, res, next) => {
  const promotionId = req.params.id;
  const promotion = await Promotion.findByIdAndDelete(promotionId);

  if (!promotion) {
    return res.status(404).json({ status: 'error', message: 'Promotion not found' });
  }

  // Remove promotion reference from products
  await Product.updateMany(
    { promotions: promotionId },
    { $pull: { promotions: promotionId } }
  );

  res.status(200).json({ status: 'success', message: 'Promotion deleted successfully' });
});

// Get all promotions
exports.getPromotions = factory.getAll(Promotion);

// Get a specific promotion by ID
exports.getPromotion = factory.getOne(Promotion);