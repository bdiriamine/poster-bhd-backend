const factory = require('./handlersFactory');
const Taille = require('../models/tailleModel');
const Format = require('../models/formatModel');
const Promotion = require('../models/promotionModel');
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');

const uploadDir = path.join(__dirname, '..', 'uploads', 'tailles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Upload directory created:", uploadDir);
} else {
    console.log("Upload directory already exists:", uploadDir);
}

exports.uploadTailleImages = uploadMixOfImages([
  {
    name: 'imageTaille',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 5,
  },
]);

exports.resizeTailleImages = asyncHandler(async (req, res, next) => {
  try {
    // Check if there are files to process
    if (!req.files || (!req.files.imageTaille && !req.files.images)) {
      return next(); // No files to process, proceed to the next middleware
    }

    // Process imageTaille
    if (req.files.imageTaille) {
      const imageTailleFileName = `tailles-${uuidv4()}-${Date.now()}-cover.jpeg`;

      await sharp(req.files.imageTaille[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 95 })
        .toFile(`uploads/tailles/${imageTailleFileName}`);

      req.body.imageTaille = imageTailleFileName; // Set only if a new image is uploaded
    }

    // Process other images
    if (req.files.images) {
      req.body.images = [];
      await Promise.all(
        req.files.images.map(async (img, index) => {
          const imageName = `tailles-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

          await sharp(img.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 95 })
            .toFile(`uploads/tailles/${imageName}`);

          req.body.images.push(imageName);
        })
      );
    }

    next();
  } catch (error) {
    console.error("Error processing images:", error);
    return res.status(500).json({ status: 'error', message: 'Image processing failed.' });
  }
});
const setImageURL = (taille) => {
  const baseURL = process.env.BASE_URL;
  if (taille.imageTaille && !taille.imageTaille.startsWith('http')) {
    taille.imageTaille = `${baseURL}/tailles/${taille.imageTaille}`;
  }
};


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
    const baseURL = process.env.BASE_URL;
    if (req.body.imageTaille) {
      req.body.imageTaille = `${baseURL}/tailles/${req.body.imageTaille}`;
    }

    const taille = await Taille.create(req.body); // Create new Taille

    // If a formatId is provided, add the Taille ID to the corresponding Format document
    if (req.body.format) {
      await Format.findByIdAndUpdate(
        req.body.format,
        { $addToSet: { tailles: taille._id } }, // Use $addToSet to avoid duplicates
        { new: true }
      );
    }
    setImageURL(taille)
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
  try {
    const { id, promotionId } = req.params;

    // Find the 'taille' by ID and check if it already has a promotion
    let taille = await Taille.findById(id);

    if (!taille) {
      return res.status(404).json({ status: 'fail', message: 'Taille not found' });
    }

    // Remove the current promotion if it exists
    if (taille.promotion) {
      await Promotion.updateOne({ _id: taille.promotion }, { $pull: { tailles: id } });
      taille.promotion = null; // Clear the promotion reference in the 'taille'
    }

    // Add the new promotion
    taille.promotion = promotionId;
    await taille.save();

    // Add the taille reference to the promotion's tailles array
    await Promotion.findByIdAndUpdate(promotionId, { $addToSet: { tailles: id } });

    res.status(200).json({ status: 'success', data: taille });
  } catch (err) {
    next(err);
  }
};

exports.getTaillesWithPromotions = async (req, res, next) => {
  try {
    const tailles = await Taille.find()
      .populate('promotion'); // Populate promotions

    const now = new Date(); // Get the current date

    const taillésWithDiscounts = tailles.map(taille => {
      // Default to original price
      let discountedPrice = taille.price; 

      // Get the active promotion
      const activePromotion = taille.promotion;

      // Check if there is an active promotion
      if (activePromotion && activePromotion.startDate <= now && activePromotion.endDate >= now) {
        const discountPercentage = activePromotion.discountPercentage;
        discountedPrice = taille.price - (taille.price * (discountPercentage / 100));
      }

      // Return taille with discounted price
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
    const activePromotion = taille.promotion;
    if (activePromotion && activePromotion.startDate <= now && activePromotion.endDate >= now) {
      const discountPercentage = activePromotion.discountPercentage;
      discountedPrice = taille.price - (taille.price * (discountPercentage / 100));
    }

    // Return taille with discounted price
    res.status(200).json({
      status: 'success',
      data: {
        ...taille.toObject(),
        discountedPrice
      }
    });
  } catch (err) {
    next(err);
  }
};

// Apply a promotion to a subcategory
exports.applyPromotionToSubcategory = async (subcategoryId, promotionId) => {
  const promotion = await Promotion.findById(promotionId);
  if (!promotion) {
    throw new Error('Promotion not found');
  }

  // Find all tailles associated with the subcategory
  const tailles = await Taille.find({ subcategory: subcategoryId }); // Adjust the query as needed

  // Apply the promotion to each taille
  for (const taille of tailles) {
    taille.promotion = promotion._id; // Assuming a single promotion
    await taille.save(); // Save the updated taille
  }

  return tailles; // Return the updated tailles
};

exports.removePromotionFromTaille = async (req, res, next) => {
  try {
    // Step 1: Find the Taille and get the current promotion ID
    const taille = await Taille.findById(req.params.id);
    if (!taille) {
      return res.status(404).json({ status: 'fail', message: 'Taille not found' });
    }

    const promotionId = taille.promotion; // Get the current promotion ID associated with the Taille

    // Step 2: Remove the promotion from the Taille
    taille.promotion = undefined; // Remove the promotion reference
    await taille.save(); // Save the updated Taille

    // Step 3: If a promotion was associated, update the Promotion document to remove this Taille
    if (promotionId) {
      const promotion = await Promotion.findById(promotionId);
      if (promotion && promotion.tailles) {
        promotion.tailles = promotion.tailles.filter(tailleId => tailleId.toString() !== req.params.id);
        await promotion.save(); // Save the updated Promotion
      }
    }

    res.status(200).json({
      status: 'success',
      data: taille
    });
  } catch (error) {
    next(error);
  }
};

// Update a specific Taille
exports.updateTaille = factory.updateOne(Taille);

// Delete a specific Taille
exports.deleteTaille = factory.deleteOne(Taille);