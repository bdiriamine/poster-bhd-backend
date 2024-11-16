const CalendriePhoto = require("../models/CalendriePhoto");
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');
const factory = require('./handlersFactory');
const Product = require('../models/productModel');
const Promotion = require('../models/promotionModel');
const SousCategorie = require("../models/SousCategorieModel");

const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

exports.uploadCalendrieImages = uploadMixOfImages([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 5,
  },
]);

exports.resizeCalendrieImages = asyncHandler(async (req, res, next) => {
  try {
    // Check if there are files to process
    if (!req.files || (!req.files.imageCover && !req.files.images)) {
      return next(); // No files to process, proceed to the next middleware
    }

    // Process imageCover
    if (req.files.imageCover) {
        const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;
      
        await sharp(req.files.imageCover[0].buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 95 })
          .toFile(`uploads/products/${imageCoverFileName}`);
      
        req.body.imageCover = imageCoverFileName; // Set only if a new image is uploaded
      }

    // Process other images
    if (req.files.images) {
      req.body.images = [];
      await Promise.all(
        req.files.images.map(async (img, index) => {
          const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

          await sharp(img.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 95 })
            .toFile(`uploads/products/${imageName}`);

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
const setImageURL = (product) => {
  const baseURL = process.env.BASE_URL ;
  if (product.imageCover && !product.imageCover.startsWith('http')) {
    product.imageCover = `${baseURL}/products/${product.imageCover}`;
  }
};

// Create CalendriePhoto

exports.createCalendriePhoto = asyncHandler(async (req, res, next) => {
  try {
    const baseURL = process.env.BASE_URL; // Ensure this is set correctly in your environment variables

    // Check if imageCover is present and set the full URL
    if (req.body.imageCover) {
      // Set the correct path for the uploaded image
      req.body.imageCover = `${baseURL}/products/${req.body.imageCover}`;
    }

    // Set promotions to null if not provided or if it is "null" as a string
    req.body.promotions = req.body.promotions === "null" ? null : req.body.promotions;
    // Create a new product
    const newCalendriePhoto = await CalendriePhoto.create(req.body);
    if (req.body.sousCategories) {
      const subcategoryId = req.body.sousCategories;

      // Find the subcategory by its ID and push the new product's ID into its products array
      const subcategory = await SousCategorie.findById(subcategoryId);

      if (subcategory) {
        subcategory.produits.push(newCalendriePhoto._id); // Add the product ID to the subcategory's products array
        await subcategory.save(); // Save the updated subcategory
      } else {
        return res.status(404).json({
          status: 'fail',
          message: 'Subcategory not found',
        });
      }
    }
    if (req.body.promotions) {
      const promotionsId = req.body.promotions;

      // Find the subcategory by its ID and push the new product's ID into its products array
      const promotion = await Promotion.findById(promotionsId);

      if (promotion) {
        promotion.produits.push(newCalendriePhoto._id); // Add the product ID to the subcategory's products array
        await promotion.save(); // Save the updated subcategory
      } else {
        return res.status(404).json({
          status: 'fail',
          message: 'promotion not found',
        });
      }
    }
    // Set the image cover URL
    setImageURL(newCalendriePhoto);

    // Save the updated product
    await newCalendriePhoto.save();

    // If there is a promotion, handle it (existing logic)

    res.status(201).json({
      status: 'success',
      data: newCalendriePhoto,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    next(error);
  }
});

// Fetch all CalendriePhotos
exports.getCalendriePhotos = asyncHandler(async (req, res) => { 
  try {
    // Initialize filter for sousCategory
    let sousCategoryFilter = {};
    if (req.query.sousCategoryName) {
      sousCategoryFilter = { name: req.query.sousCategoryName }; // Use this for matching
    }

    const documents = await CalendriePhoto.aggregate([
      {
        $lookup: {
          from: 'souscategories',
          localField: 'sousCategories', // Field in CalendriePhoto
          foreignField: '_id', // Field in SousCategory
          as: 'sousCategories',
        },
      },
      { $unwind: { path: '$sousCategories', preserveNullAndEmptyArrays: true } }, // Unwind to match with each CalendriePhoto

      // Match the sousCategory based on the query parameter
      {
        $match: {
          ...(req.query.sousCategoryName ? { 'sousCategories.name': req.query.sousCategoryName } : {})
        },
      },

      // Join with promotions and formats
      {
        $lookup: {
          from: 'promotions',
          localField: 'promotions',
          foreignField: '_id',
          as: 'promotions',
        },
      },
      { $unwind: { path: '$promotions', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'formats',
          localField: 'formats',
          foreignField: '_id',
          as: 'formats',
        },
      },
      { $unwind: { path: '$formats', preserveNullAndEmptyArrays: true } },

      // Populate formats.tailles
      {
        $lookup: {
          from: 'tailles',
          localField: 'formats.tailles',
          foreignField: '_id',
          as: 'formats.tailles',
        },
      },

      // Group the results
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          slug: { $first: '$slug' },
          price: { $first: '$price' },
          type:{ $first: '$__t' },
          description: { $first: '$description' },
          promotions: { $first: '$promotions' },
          imageCover: { $first: '$imageCover' },
          numberOfPhotos:{$first : '$numberOfPhotos'},
          formats: { $push: '$formats' },
          sousCategories: { $first: '$sousCategories' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
        },
      },

      // Calculate the discounted price
      {
        $addFields: {
          priceAfterDiscount : {
            $cond: {
              if: { $ne: ['$promotions', null] },
              then: {
                $subtract: [
                  '$price',
                  {
                    $multiply: [
                      '$price',
                      { $divide: ['$promotions.discountPercentage', 100] },
                    ],
                  },
                ],
              },
              else: '$price',
            },
          },
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: documents,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});

exports.getCalendriePhotoById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    const calendriePhoto = await CalendriePhoto.findById(id).populate('promotions sousCategories formats');
    
    if (!calendriePhoto) {
      return res.status(404).json({
        status: 'fail',
        message: 'CalendriePhoto not found',
      });
    }

    // Calculate the price after discount
    if (calendriePhoto.promotions && calendriePhoto.promotions.discountPercentage) {
      const currentDate = new Date();
      const isPromotionActive = currentDate >= new Date(calendriePhoto.promotions.startDate) &&
                                currentDate <= new Date(calendriePhoto.promotions.endDate);

      if (isPromotionActive) {
        const discountAmount = (calendriePhoto.price * calendriePhoto.promotions.discountPercentage) / 100;
        calendriePhoto.priceAfterDiscount = (calendriePhoto.price - discountAmount).toFixed(2);
      } else {
        calendriePhoto.priceAfterDiscount = calendriePhoto.price;
      }
    } else {
      calendriePhoto.priceAfterDiscount = calendriePhoto.price;
    }

    // Set image URLs
    setImageURL(calendriePhoto);

    res.status(200).json({
      status: 'success',
      data: calendriePhoto,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});
// Update CalendriePhoto
exports.updateCalendriePhoto = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, price, description, numberOfPhotos, year, paperQuality, sousCategories } = req.body;

    // Debugging log
    console.log('Request body:', req.body);

    // Find the CalendriePhoto by ID
    let calendriePhoto = await CalendriePhoto.findById(id);
    if (!calendriePhoto) {
      return res.status(404).json({ status: 'fail', message: 'CalendriePhoto not found' });
    }

    // Update fields
    calendriePhoto.name = name || calendriePhoto.name;
    calendriePhoto.slug = slug || calendriePhoto.slug;
    calendriePhoto.price = price || calendriePhoto.price;
    calendriePhoto.description = description || calendriePhoto.description;
    calendriePhoto.numberOfPhotos = numberOfPhotos || calendriePhoto.numberOfPhotos; // Update numberOfPhotos
    calendriePhoto.year = year || calendriePhoto.year;
    calendriePhoto.paperQuality = paperQuality || calendriePhoto.paperQuality;

    // Handle image cover
    if (req.body.imageCover) {
      const oldImagePath = path.join(uploadDir, calendriePhoto.imageCover);
      if (calendriePhoto.imageCover && fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // Remove old file
      }
      calendriePhoto.imageCover = req.body.imageCover; // Set new cover image
    }

    // Ensure the imageCover has the base URL
    setImageURL(calendriePhoto);

    // Update sousCategories (assuming the logic is correct)
    // Save the old sousCategories for comparison
    const oldSousCategories = calendriePhoto.sousCategories;
    if (oldSousCategories) {
      await SousCategorie.updateMany(
        { _id: { $in: oldSousCategories } },
        { $pull: { produits: calendriePhoto._id } } // Remove reference from old sousCategories
      );
    }

    calendriePhoto.sousCategories = Array.isArray(sousCategories)
      ? sousCategories.map(subCat => subCat._id || subCat)
      : sousCategories || calendriePhoto.sousCategories;

    if (calendriePhoto.sousCategories) {
      await SousCategorie.updateMany(
        { _id: { $in: calendriePhoto.sousCategories } },
        { $addToSet: { produits: calendriePhoto._id } } // Add reference to new sousCategories
      );
    }

    // Save the updated CalendriePhoto
    const updatedCalendriePhoto = await calendriePhoto.save();

    res.status(200).json({
      status: 'success',
      data: updatedCalendriePhoto,
    });
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});

// Delete CalendriePhoto
exports.deleteCalendriePhoto = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    await CalendriePhoto.findByIdAndDelete(id);

    res.status(204).json({
      status: 'success',
      message: 'CalendriePhoto deleted successfully',
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});