const factory = require('./handlersFactory');
const Taille = require('../models/tailleModel');
const Format = require('../models/formatModel');
const Promotion = require('../models/promotionModel');

// Middleware to set the formatId in the request body
exports.setFormatIdToBody = (req, res, next) => {
  if (!req.body.format) req.body.format = req.params.formatId; // Set format ID
  next();
};

// Middleware to create filter object for fetching Tailles
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.formatId) filterObject = { format: req.params.formatId }; // Filter by format ID
  req.filterObj = filterObject;
  next();
};
// Create a new Taille and associate it with a Format
exports.createTaille = async (req, res) => {
  try {
    const taille = await Taille.create(req.body); // Create new Taille

    // If a formatId is provided, add the Taille ID to the corresponding Format document
    if (req.body.format) {
      await Format.findByIdAndUpdate(
        req.body.format,
        { $addToSet: { tailles: taille._id } }, // Use $addToSet to avoid duplicates
        { new: true }
      );
    }

    res.status(201).json({
      status: 'success',
      data: { taille },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

exports.addPromotionToTaille = async (req, res, next) => {
  const { id, promotionId } = req.params;
  try {
    const taille = await Taille.findById(id);
    if (!taille) {
      return res.status(404).json({ status: 'fail', message: 'Taille not found' });
    }
    taille.promotion = promotionId;
    console.log( taille.promotion)
    console.log( taille)
    await taille.save();
    res.status(200).json({ status: 'success', data: taille });
  } catch (error) {
    next(error);
  }
};
exports.getTaillesWithPromotions = async (req, res, next) => {
  try {
    const tailles = await Taille.find()
      .populate('promotion'); // Adjust according to your schema

    const now = new Date(); // Get the current date

    const taillésWithDiscounts = tailles.map(taille => {
      // Default to original price (if applicable)
      let discountedPrice = taille.price; // Adjust this if you have a specific price field

      // Assuming each taille has a single promotion
      const activePromotion = taille.promotion; // Get the promotion directly

      // Check if there is an active promotion
      if (activePromotion && activePromotion.startDate <= now && activePromotion.endDate >= now) {
        const discountPercentage = activePromotion.discountPercentage;
        discountedPrice = taille.price - (taille.price * (discountPercentage / 100));
      }

      // Return taille with discounted price
      console.log(taille)
      return {
        ...taille.toObject(), // Convert Mongoose document to plain object
        discountedPrice
      };
    });

    res.status(200).json({ status: 'success', data: taillésWithDiscounts });
  } catch (err) {
    next(err);
  }
};
exports.getTailleWithPromotion = async (req, res, next) => {
  try {
    const tailleId = req.params.id; // Get taille ID from request parameters

    const taille = await Taille.findById(tailleId)
      .populate('promotion') // Populate promotion
      .populate('format'); 

    if (!taille) {
      return res.status(404).json({ status: 'error', message: 'Taille not found' });
    }

    const now = new Date(); // Get the current date
    let discountedPrice = taille.price; // Default to original price

    // Check if there is an active promotion
    const activePromotion = taille.promotion; // Get the promotion directly
    if (activePromotion && activePromotion.startDate <= now && activePromotion.endDate >= now) {
      const discountPercentage = activePromotion.discountPercentage;
      discountedPrice = taille.price - (taille.price * (discountPercentage / 100));
    }

    // Return taille with discounted price
    res.status(200).json({
      status: 'success',
      data: {
        ...taille.toObject(), // Convert Mongoose document to plain object
        discountedPrice
      }
    });
  } catch (err) {
    next(err);
  }
};
// Function to apply a promotion to a subcategory
exports.applyPromotionToSubcategory = async (subcategoryId, promotionId) => {
  // Find the promotion by ID
  const promotion = await Promotion.findById(promotionId);
  if (!promotion) {
    throw new Error('Promotion not found');
  }

  // Find all tailles associated with the subcategory
  const tailles = await Taille.find({ subcategory: subcategoryId }); // Adjust the query as needed

  // Apply the promotion to each taille
  for (const taille of tailles) {
    taille.promotions.push(promotion._id); // Assuming `promotions` is an array in the Taille model
    await taille.save();
  }

  return tailles; // Return the updated tailles
};

// Update a specific Taille
exports.updateTaille = factory.updateOne(Taille);

// Delete a specific Taille
exports.deleteTaille = factory.deleteOne(Taille);