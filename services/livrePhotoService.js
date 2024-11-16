const LivrePhoto = require("../models/livrePhotoModel");
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

exports.uploadLivreImages = uploadMixOfImages([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 5,
  },
]);

exports.resizeLivreImages = asyncHandler(async (req, res, next) => {
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

exports.createLivrePhoto = async (req, res, next) => {
  try {
    const baseURL = process.env.BASE_URL;

    // Set the image cover URL if it exists
    if (req.body.imageCover) {
      req.body.imageCover = `${baseURL}/products/${req.body.imageCover}`;
    }

    // Set promotions to null if not provided or if it is "null" as a string
    req.body.promotions = req.body.promotions === "null" ? null : req.body.promotions;

    // Optionally, set sizes directly without requiring it to be an array
    if (req.body.sizes) {
      req.body.sizes = req.body.sizes; // Just set sizes directly
    }

    // Create the LivrePhoto (product)
    const savedLivrePhoto = await LivrePhoto.create(req.body);

    // After the LivrePhoto is created, update the related subcategory
    if (req.body.sousCategories) {
      const subcategoryId = req.body.sousCategories;

      const subcategory = await SousCategorie.findById(subcategoryId);

      if (subcategory) {
        subcategory.produits.push(savedLivrePhoto._id); // Add the product ID to the subcategory's products array
        await subcategory.save(); // Save the updated subcategory
      } else {
        return res.status(404).json({
          status: 'fail',
          message: 'Subcategory not found',
        });
      }
    }

    if (req.body.promotions) {
      const promotionsid = req.body.promotions;

      const promotion = await Promotion.findById(promotionsid);

      if (promotion) {
        promotion.produits.push(savedLivrePhoto._id); // Add the product ID to the promotion's products array
        await promotion.save(); // Save the updated promotion
      } else {
        return res.status(404).json({
          status: 'fail',
          message: 'Promotion not found',
        });
      }
    }

    // Set the image URL for the response
    setImageURL(savedLivrePhoto);

    res.status(201).json({
      status: 'success',
      data: savedLivrePhoto,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getLivrePhotos = async (req, res) => {
  try {
    const livrePhotos = await LivrePhoto.find().populate('promotions');

    livrePhotos.forEach(photo => {
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
      data: livrePhotos,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getLivrePhotoById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const livrePhoto = await LivrePhoto.findById(id).populate('promotions');

    if (!livrePhoto) {
      return res.status(404).json({
        status: 'fail',
        message: 'LivrePhoto not found',
      });
    }

    const promotion = livrePhoto.promotions;
    if (promotion && promotion.discountPercentage) {
      const discount = promotion.discountPercentage / 100;
      livrePhoto.priceAfterDiscount = livrePhoto.price - (livrePhoto.price * discount);
    } else {
      livrePhoto.priceAfterDiscount = livrePhoto.price;
    }

    setImageURL(livrePhoto);

    res.status(200).json({
      status: 'success',
      data: livrePhoto,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});

exports.updateLivrePhoto = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      price,
      description,
      paperQuality,
      coverType,
      numberOfPages,
      numberOfPhotos,
      promotions,
      sousCategories,
      formats,
      size // Ensure single size field
    } = req.body;

    let livrePhoto = await LivrePhoto.findById(id);
    if (!livrePhoto) {
      return res.status(404).json({ status: 'fail', message: 'LivrePhoto not found' });
    }

    // Update the imageCover if a new one is uploaded
    if (req.body.imageCover) {
      const oldImagePath = path.join(uploadDir, livrePhoto.imageCover);
      if (livrePhoto.imageCover && fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // Remove old file
      }
      livrePhoto.imageCover = req.body.imageCover;
    }

    // Update fields
    livrePhoto.name = name || livrePhoto.name;
    livrePhoto.slug = slug || livrePhoto.slug;
    livrePhoto.price = price || livrePhoto.price;
    livrePhoto.description = description || livrePhoto.description;
    livrePhoto.paperQuality = paperQuality || livrePhoto.paperQuality;
    livrePhoto.coverType = coverType || livrePhoto.coverType;
    livrePhoto.numberOfPages = numberOfPages || livrePhoto.numberOfPages;
    livrePhoto.numberOfPhotos = numberOfPhotos || livrePhoto.numberOfPhotos;

    // Update size
    if (size) {
      livrePhoto.size = size; // Use the correct field name
    }

    // Ensure promotions, sousCategories, and formats are arrays of ObjectIds
    livrePhoto.promotions = Array.isArray(promotions) 
      ? promotions.map(promo => promo._id || promo) 
      : promotions === "null" ? null : livrePhoto.promotions;

    const oldSousCategories = livrePhoto.sousCategories; // Save old sousCategories for comparison
    livrePhoto.sousCategories = Array.isArray(sousCategories) 
      ? sousCategories.map(subCat => subCat._id || subCat) 
      : sousCategories || livrePhoto.sousCategories;

    livrePhoto.formats = Array.isArray(formats) 
      ? formats.map(format => format._id || format) 
      : formats || livrePhoto.formats;

    // Ensure the imageCover has the base URL
    setImageURL(livrePhoto);

    // Save the updated LivrePhoto
    console.log("Before save:", livrePhoto.size); // Log the size before saving
    const updatedLivrePhoto = await livrePhoto.save();

    // Update the corresponding SousCategories
    if (oldSousCategories) {
      await SousCategorie.updateMany(
        { _id: { $in: oldSousCategories } },
        { $pull: { produits: updatedLivrePhoto._id } }
      );
    }

    if (livrePhoto.sousCategories) {
      await SousCategorie.updateMany(
        { _id: { $in: livrePhoto.sousCategories } },
        { $addToSet: { produits: updatedLivrePhoto._id } }
      );
    }

    res.status(200).json({
      status: 'success',
      data: updatedLivrePhoto,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message || 'An error occurred while updating the LivrePhoto',
    });
  }
});

exports.deleteLivrePhoto = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    await LivrePhoto.findByIdAndDelete(id);

    res.status(204).json({
      status: 'success',
      message: 'LivrePhoto deleted successfully',
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});