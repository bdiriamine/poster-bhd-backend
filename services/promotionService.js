const Promotion = require('../models/promotionModel');
const factory = require('./handlersFactory');
const Product = require('../models/productModel'); // Import Product model
const Subcategory = require('../models/SousCategorieModel'); // Import Subcategory model
const Taille = require('../models/tailleModel');
const asyncHandler = require('express-async-handler');
// Create a new promotion
exports.createPromotion = async (data) => {
  const promotion = await Promotion.create(data);
  return promotion;
};
// Get all promotions with populated products and tailles
exports.getAllPromotionsWithDetails = asyncHandler(async (req, res) => {
    // Fetch all promotions and populate the 'produits' and 'tailles' fields
    const promotions = await Promotion.find()
      .populate('produits') // Populate the produits field
      .populate('tailles'); // Populate the tailles field
      res.status(200).json({ status: 'success', data: promotions });

  });
// Apply a promotion to a product
exports.applyPromotionToProduct = async (productId, promotionId) => {
  const promotion = await Promotion.findById(promotionId);
  if (!promotion) {
    throw new Error('Promotion not found.');
  }

  const product = await Product.findByIdAndUpdate(
    productId,
    {
      $addToSet: { promotions: promotionId } // Add promotionId to promotions array
    },
    { new: true }
  );

  if (!product) {
    throw new Error('Product not found.');
  }

  return product;
};

// Get all promotions
exports.getPromotions = factory.getAll(Promotion);

// Get a specific promotion by ID
exports.getPromotion = factory.getOne(Promotion);


exports.updatePromotion = async (req, res, next) => {
    const promotionId = req.params.id; // Get the promotion ID from request parameters
    const updateData = req.body; // Get the updated data from request body
  
    try {
      // Find the promotion and update it
      const updatedPromotion = await Promotion.findByIdAndUpdate(
        promotionId,
        updateData,
        { new: true, runValidators: true } // Options to return the updated document and run validations
      );
  
      if (!updatedPromotion) {
        return res.status(404).json({ status: 'error', message: 'Promotion not found' });
      }
  
      res.status(200).json({ status: 'success', data: updatedPromotion });
    } catch (err) {
      next(err);
    }
  };

exports.deletePromotion = async (req, res, next) => {
    const promotionId = req.params.id; // Get promotion ID from the request parameters
    console.log(promotionId)
    try {
      // Find the promotion and remove it
      const promotion = await Promotion.findByIdAndDelete(promotionId);
   
      console.log(promotion)
      if (!promotion) {
        return res.status(404).json({ status: 'error', message: 'Promotion not found' });
      }
  
      // Update products to remove the reference to the deleted promotion
      await Product.updateMany(
        { promotions: promotionId },
        { $pull: { promotions: promotionId } } // Remove the promotion ID from the promotions array
      );
  
      res.status(200).json({ status: 'success', message: 'Promotion deleted successfully' });
    } catch (err) {
      next(err);
    }
  };
  
  