const CadeauxPhoto = require('../models/cadeauxPhotoModel'); // Import your CadeauxPhoto model
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');

const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

exports.uploadCadeauxPhotosImages = uploadMixOfImages([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 5,
  },
]);

exports.resizeCadeauxPhotosImages = asyncHandler(async (req, res, next) => {
  try {
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
  const baseURL = process.env.BASE_URL;
  if (product.imageCover && !product.imageCover.startsWith('http')) {
    product.imageCover = `${baseURL}/products/${product.imageCover}`;
  }
};

// Create CadeauxPhoto
const { validationResult } = require('express-validator');
const SousCategorie = require('../models/SousCategorieModel');

exports.createCadeauxPhoto = async (req, res, next) => {
  try {
    const baseURL = process.env.BASE_URL; // Ensure this is set correctly in your environment variables
    if (!req.body.numberOfPhotos || req.body.numberOfPhotos <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'CadeauxPhoto must specify a valid number of photos greater than 0',
      });
    }
    // Check if imageCover is present and set the full URL
    if (req.body.imageCover) {
      // Set the correct path for the uploaded image
      req.body.imageCover = `${baseURL}/products/${req.body.imageCover}`;
    }

    // Set promotions to null if not provided or if it is "null" as a string
    req.body.promotions = req.body.promotions === "null" ? null : req.body.promotions;
    const newCadeauxPhoto = await CadeauxPhoto.create(req.body);
    if (req.body.sousCategories) {
      const subcategoryId = req.body.sousCategories;

      // Find the subcategory by its ID and push the new product's ID into its products array
      const subcategory = await SousCategorie.findById(subcategoryId);

      if (subcategory) {
        subcategory.produits.push(newCadeauxPhoto._id); // Add the product ID to the subcategory's products array
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
      const promotion = await SousCategorie.findById(promotionsId);

      if (promotion) {
        promotion.produits.push(newCadeauxPhoto._id); // Add the product ID to the subcategory's products array
        await promotion.save(); // Save the updated subcategory
      } else {
        return res.status(404).json({
          status: 'fail',
          message: 'Promotion not found',
        });
      }
    }
    setImageURL(newCadeauxPhoto);
    await newCadeauxPhoto.save();

    // Call setImageURL to ensure image URLs are correct
  

    res.status(201).json({
      status: 'success',
      data: newCadeauxPhoto, // Use newCadeauxPhoto instead of savedLivrePhoto
    });
  } catch (err) {
    console.error('Error creating CadeauxPhoto:', err); // Log the error for debugging
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};
// Fetch all CadeauxPhotos
exports.getCadeauxPhotos = asyncHandler(async (req, res) => {
  try {
    const cadeauxPhotos = await CadeauxPhoto.find().populate('promotions sousCategories formats');

    cadeauxPhotos.forEach(photo => {
      if (photo.promotions && photo.promotions.discountPercentage) {
        const currentDate = new Date();
        const isPromotionActive =
          currentDate >= new Date(photo.promotions.startDate) &&
          currentDate <= new Date(photo.promotions.endDate);

        if (isPromotionActive) {
          const discountAmount = (photo.price * photo.promotions.discountPercentage) / 100;
          photo.priceAfterDiscount = (photo.price - discountAmount).toFixed(2);
        } else {
          photo.priceAfterDiscount = photo.price;
        }
      } else {
        photo.priceAfterDiscount = photo.price;
      }

      setImageURL(photo); // Ensure base URL is set for image paths
    });

    res.status(200).json({
      status: 'success',
      data: cadeauxPhotos,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});

// Fetch CadeauxPhoto by ID
exports.getCadeauxPhotoById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const cadeauxPhoto = await CadeauxPhoto.findById(id).populate('promotions sousCategories formats');

    if (!cadeauxPhoto) {
      return res.status(404).json({
        status: 'fail',
        message: 'CadeauxPhoto not found',
      });
    }

    if (cadeauxPhoto.promotions && cadeauxPhoto.promotions.discountPercentage) {
      const currentDate = new Date();
      const isPromotionActive =
        currentDate >= new Date(cadeauxPhoto.promotions.startDate) &&
        currentDate <= new Date(cadeauxPhoto.promotions.endDate);

      if (isPromotionActive) {
        const discountAmount = (cadeauxPhoto.price * cadeauxPhoto.promotions.discountPercentage) / 100;
        cadeauxPhoto.priceAfterDiscount = (cadeauxPhoto.price - discountAmount).toFixed(2);
      } else {
        cadeauxPhoto.priceAfterDiscount = cadeauxPhoto.price;
      }
    } else {
      cadeauxPhoto.priceAfterDiscount = cadeauxPhoto.price;
    }

    setImageURL(cadeauxPhoto); // Add base URL to image paths

    res.status(200).json({
      status: 'success',
      data: cadeauxPhoto,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});

// Update CadeauxPhoto
exports.updateCadeauxPhoto = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      price,
      description,
      category,
      occasion,
      sousCategories,
      promotion,
      personalizedMessage,
      wrappingType,
      giftSize,
      numberOfPhotos
    } = req.body;

    console.log(req.body); // Log the request body to debug

    let cadeauxPhoto = await CadeauxPhoto.findById(id);
    if (!cadeauxPhoto) {
      return res.status(404).json({ status: 'fail', message: 'CadeauxPhoto not found' });
    }

    // Update basic fields
    cadeauxPhoto.name = name || cadeauxPhoto.name;
    cadeauxPhoto.slug = slug || cadeauxPhoto.slug;
    cadeauxPhoto.price = price || cadeauxPhoto.price;
    cadeauxPhoto.description = description || cadeauxPhoto.description;
    cadeauxPhoto.category = category || cadeauxPhoto.category;
    cadeauxPhoto.occasion = occasion || cadeauxPhoto.occasion;
    cadeauxPhoto.personalizedMessage = personalizedMessage || cadeauxPhoto.personalizedMessage;
    cadeauxPhoto.wrappingType = wrappingType || cadeauxPhoto.wrappingType;
    cadeauxPhoto.giftSize = giftSize || cadeauxPhoto.giftSize;

    // Update numberOfPhotos only if provided
    if (numberOfPhotos !== undefined) { // Check if numberOfPhotos is explicitly provided
      cadeauxPhoto.numberOfPhotos = numberOfPhotos;
    }

    // Handle imageCover update
    if (req.body.imageCover) {
      const oldImagePath = path.join(uploadDir, cadeauxPhoto.imageCover);
      if (cadeauxPhoto.imageCover && fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // Remove old image file
      }
      cadeauxPhoto.imageCover = req.body.imageCover; // Set new image cover
    }

    // Ensure the imageCover URL is properly set with base URL
    setImageURL(cadeauxPhoto);

    // Update the sousCategories if provided
    if (sousCategories) {
      // (your existing logic for updating sousCategories)
    }

    // Handle promotions update (if provided)
    if (promotion) {
      // (your existing logic for updating promotions)
    }

    // Save the updated CadeauxPhoto
    const updatedCadeauxPhoto = await cadeauxPhoto.save();

    res.status(200).json({
      status: 'success',
      data: updatedCadeauxPhoto,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});

// Delete CadeauxPhoto
exports.deleteCadeauxPhoto = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    await CadeauxPhoto.findByIdAndDelete(id);

    res.status(204).json({
      status: 'success',
      message: 'CadeauxPhoto deleted successfully',
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});

// Helper function to set image URLs
exports.getCadeauxPhotosBySousCategoriesName = asyncHandler(async (req, res) => {
  try {
    const { sousCategorieName } = req.params; // Get the subcategory name from the request parameters

    // Find the subcategory by its name
    const subcategory = await SousCategorie.findOne({ name: sousCategorieName });

    if (!subcategory) {
      return res.status(404).json({
        status: 'fail',
        message: 'SousCategorie not found',
      });
    }

    // Fetch CadeauxPhotos associated with this subcategory
    const cadeauxPhotos = await CadeauxPhoto.find({ sousCategories: subcategory._id }).populate('promotions sousCategories formats');

    // Process each photo for discounts if applicable
    cadeauxPhotos.forEach(photo => {
      if (photo.promotions && photo.promotions.discountPercentage) {
        const currentDate = new Date();
        const isPromotionActive =
          currentDate >= new Date(photo.promotions.startDate) &&
          currentDate <= new Date(photo.promotions.endDate);

        if (isPromotionActive) {
          const discountAmount = (photo.price * photo.promotions.discountPercentage) / 100;
          photo.priceAfterDiscount = (photo.price - discountAmount).toFixed(2);
        } else {
          photo.priceAfterDiscount = photo.price;
        }
      } else {
        photo.priceAfterDiscount = photo.price;
      }

      setImageURL(photo); // Ensure base URL is set for image paths
    });

    res.status(200).json({
      status: 'success',
      data: cadeauxPhotos,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});
