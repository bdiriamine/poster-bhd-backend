const CartesPhoto = require("../models/CartesPhotos"); // Import your CartesPhoto model
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');
const SousCategorie = require("../models/SousCategorieModel");
const Promotion = require("../models/promotionModel");

const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware to upload images
exports.uploadCartesPhotosImages = uploadMixOfImages([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 5,
  },
]);

// Middleware to resize images
exports.resizeCartesPhotosImages = asyncHandler(async (req, res, next) => {
  try {
    // Check if there are files to process
    if (!req.files || (!req.files.imageCover && !req.files.images)) {
      return next(); // No files to process, proceed to the next middleware
    }

    // Process imageCover
    if (req.files.imageCover) {
      const imageCoverFileName = `cartes-${uuidv4()}-${Date.now()}-cover.jpeg`;

      await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 95 })
        .toFile(`uploads/products/${imageCoverFileName}`);

      req.body.imageCover = imageCoverFileName; // Set the imageCover if a new image is uploaded
    }

    // Process other images
    if (req.files.images) {
      req.body.images = [];
      await Promise.all(
        req.files.images.map(async (img, index) => {
          const imageName = `cartes-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

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

// Create CartesPhoto
exports.createCartesPhoto = async (req, res) => {
  try {
    const baseURL = process.env.BASE_URL; // Ensure this is set correctly in your environment variables

    // Check if imageCover is present and set the full URL
    if (req.body.imageCover) {
      // Set the correct path for the uploaded image
      req.body.imageCover = `${baseURL}/products/${req.body.imageCover}`;
    }

    // Set promotions to null if not provided or if it is "null" as a string
    req.body.promotions = req.body.promotions === "null" ? null : req.body.promotions;
    const newCartesPhoto = await CartesPhoto.create(req.body);
    if (req.body.sousCategories) {
      const subcategoryId = req.body.sousCategories;

      // Find the subcategory by its ID and push the new product's ID into its products array
      const subcategory = await SousCategorie.findById(subcategoryId);

      if (subcategory) {
        subcategory.produits.push(newCartesPhoto._id); // Add the product ID to the subcategory's products array
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
        promotion.produits.push(newCartesPhoto._id); // Add the product ID to the subcategory's products array
        await promotion.save(); // Save the updated subcategory
      } else {
        return res.status(404).json({
          status: 'fail',
          message: 'promotion not found',
        });
      }
    }
 
    setImageURL(newCartesPhoto); 
    await newCartesPhoto.save();
    res.status(201).json({
      status: 'success',
      data: {
        cartesPhoto: newCartesPhoto
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Fetch all CartesPhotos
exports.getCartesPhotos = asyncHandler(async (req, res) => {
  try {
    const cartesPhotos = await CartesPhoto.find().populate('promotions sousCategories formats');

    // Calculate the price after discount for each product
    cartesPhotos.forEach(photo => {
      if (photo.promotions && photo.promotions.discountPercentage) {
        const currentDate = new Date();
        const isPromotionActive = currentDate >= new Date(photo.promotions.startDate) &&
                                  currentDate <= new Date(photo.promotions.endDate);

        // Only apply discount if the promotion is active
        if (isPromotionActive) {
          const discountAmount = (photo.price * photo.promotions.discountPercentage) / 100;
          photo.priceAfterDiscount = (photo.price - discountAmount).toFixed(2); // round to 2 decimal places
        } else {
          photo.priceAfterDiscount = photo.price; // No discount if promotion is not active
        }
      } else {
        photo.priceAfterDiscount = photo.price; // No discount if no promotion is applied
      }

      // Set image URLs
      setImageURL(photo);
    });

    res.status(200).json({
      status: 'success',
      data: cartesPhotos,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});

// Fetch CartesPhoto by ID
exports.getCartesPhotoById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const cartesPhoto = await CartesPhoto.findById(id).populate('promotions sousCategories formats');

    if (!cartesPhoto) {
      return res.status(404).json({
        status: 'fail',
        message: 'CartesPhoto not found',
      });
    }

    // Calculate the price after discount
    if (cartesPhoto.promotions && cartesPhoto.promotions.discountPercentage) {
      const currentDate = new Date();
      const isPromotionActive = currentDate >= new Date(cartesPhoto.promotions.startDate) &&
                                currentDate <= new Date(cartesPhoto.promotions.endDate);

      if (isPromotionActive) {
        const discountAmount = (cartesPhoto.price * cartesPhoto.promotions.discountPercentage) / 100;
        cartesPhoto.priceAfterDiscount = (cartesPhoto.price - discountAmount).toFixed(2);
      } else {
        cartesPhoto.priceAfterDiscount = cartesPhoto.price;
      }
    } else {
      cartesPhoto.priceAfterDiscount = cartesPhoto.price;
    }

    // Set image URLs
    setImageURL(cartesPhoto);

    res.status(200).json({
      status: 'success',
      data: cartesPhoto,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});

// Update CartesPhoto
exports.updateCartesPhoto = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, price, description, numberOfCards, paperQuality, occasion, numberOfPhotos, sousCategories } = req.body; // Include numberOfPhoto and sousCategories

    let cartesPhoto = await CartesPhoto.findById(id);
    if (!cartesPhoto) {
      return res.status(404).json({ status: 'fail', message: 'CartesPhoto not found' });
    }

    // Save the old sousCategories for comparison
    const oldSousCategories = cartesPhoto.sousCategories;

    // Update fields
    cartesPhoto.name = name || cartesPhoto.name;
    cartesPhoto.slug = slug || cartesPhoto.slug;
    cartesPhoto.price = price || cartesPhoto.price;
    cartesPhoto.description = description || cartesPhoto.description;
    cartesPhoto.numberOfCards = numberOfCards || cartesPhoto.numberOfCards;
    cartesPhoto.paperQuality = paperQuality || cartesPhoto.paperQuality;
    cartesPhoto.occasion = occasion || cartesPhoto.occasion;
    cartesPhoto.numberOfPhotos = numberOfPhotos || cartesPhoto.numberOfPhotos; // Add the number of photos

    // Update imageCover
    if (req.body.imageCover) {
      const oldImagePath = path.join(uploadDir, cartesPhoto.imageCover);
      if (cartesPhoto.imageCover && fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      cartesPhoto.imageCover = req.body.imageCover;
      setImageURL(cartesPhoto);
    }

    // Handle sousCategories update
    if (oldSousCategories) {
      await SousCategorie.updateMany(
        { _id: { $in: oldSousCategories } },
        { $pull: { produits: cartesPhoto._id } }
      );
    }

    cartesPhoto.sousCategories = Array.isArray(sousCategories) 
      ? sousCategories.map(subCat => subCat._id || subCat)
      : sousCategories || cartesPhoto.sousCategories;

    if (cartesPhoto.sousCategories) {
      await SousCategorie.updateMany(
        { _id: { $in: cartesPhoto.sousCategories } },
        { $addToSet: { produits: cartesPhoto._id } }
      );
    }

    const updatedCartesPhoto = await cartesPhoto.save();

    res.status(200).json({
      status: 'success',
      data: updatedCartesPhoto,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});

// Delete CartesPhoto
exports.deleteCartesPhoto = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    await CartesPhoto.findByIdAndDelete(id);

    res.status(204).json({
      status: 'success',
      message: 'CartesPhoto deleted successfully',
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});

// Helper function to set image URLs
const setImageURL = (product) => {
  const baseURL = process.env.BASE_URL ;
  if (product.imageCover && !product.imageCover.startsWith('http')) {
    product.imageCover = `${baseURL}/products/${product.imageCover}`;
  }
};