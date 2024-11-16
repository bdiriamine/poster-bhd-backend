const TiragePhoto = require("../models/tiragePhotoModel");
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

exports.uploadTiragePhoto = uploadMixOfImages([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 5,
  },
]);

exports.resizeTiragePhoto = asyncHandler(async (req, res, next) => {
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

exports.createTiragePhoto = async (req, res, next) => {
  try {
    const baseURL = process.env.BASE_URL;

    // Set the image cover URL if it exists
    if (req.body.imageCover) {
      req.body.imageCover = `${baseURL}/products/${req.body.imageCover}`;
    }

    // Set promotions to null if not provided or if it is "null" as a string
    req.body.promotions = req.body.promotions === "null" ? null : req.body.promotions;

    // Optionally, set nameTirage directly without requiring it to be an array
    if (req.body.nameTirage) {
      req.body.nameTirage = req.body.nameTirage; // Just set sizes directly
    }

    // Create the TiragePhoto (product)
    const savedTiragePhoto = await TiragePhoto.create(req.body);

    // After the TiragePhoto is created, update the related subcategory
    if (req.body.sousCategories) {
      const subcategoryId = req.body.sousCategories;

      const subcategory = await SousCategorie.findById(subcategoryId);

      if (subcategory) {
        subcategory.produits.push(savedTiragePhoto._id); // Add the product ID to the subcategory's products array
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
        promotion.produits.push(savedTiragePhoto._id); // Add the product ID to the promotion's products array
        await promotion.save(); // Save the updated promotion
      } else {
        return res.status(404).json({
          status: 'fail',
          message: 'Promotion not found',
        });
      }
    }

    // Set the image URL for the response
    setImageURL(savedTiragePhoto);

    res.status(201).json({
      status: 'success',
      data: savedTiragePhoto,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getTiragePhotos = async (req, res) => {
  try {
    const tiragePhoto = await TiragePhoto.find().populate('promotions');

    const updatedTiragePhoto = tiragePhoto.map((tiragePhoto) => {
      const promotion = tiragePhoto.promotions;

      if (promotion && promotion.discountPercentage) {
        const discount = promotion.discountPercentage / 100;
        tiragePhoto.priceAfterDiscount = tiragePhoto.price - (tiragePhoto.price * discount);
      } else {
        tiragePhoto.priceAfterDiscount = tiragePhoto.price; // No discount
      }

      setImageURL(tiragePhoto);

      return tiragePhoto;
    });

    res.status(200).json({
      status: 'success',
      data: updatedTiragePhoto,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getTiragePhotoById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const tiragePhoto = await TiragePhoto.findById(id).populate('promotions');

    if (!tiragePhoto) {
      return res.status(404).json({
        status: 'fail',
        message: 'TiragePhoto not found',
      });
    }

    const promotion = tiragePhoto.promotions;
    if (promotion && promotion.discountPercentage) {
      const discount = promotion.discountPercentage / 100;
      tiragePhoto.priceAfterDiscount = tiragePhoto.price - (tiragePhoto.price * discount);
    } else {
      tiragePhoto.priceAfterDiscount = tiragePhoto.price;
    }

    setImageURL(tiragePhoto);

    res.status(200).json({
      status: 'success',
      data: tiragePhoto,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});

exports.updateTiragePhoto = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      price,
      description,
      numberOfPhotos,
      promotions,
      sousCategories,
      formats,
      nameTirage // Ensure single size field
    } = req.body;

    let tiragePhoto = await TiragePhoto.findById(id);
    if (!tiragePhoto) {
      return res.status(404).json({ status: 'fail', message: 'TiragePhoto not found' });
    }

    // Update the imageCover if a new one is uploaded
    if (req.body.imageCover) {
      const oldImagePath = path.join(uploadDir, tiragePhoto.imageCover);
      if (tiragePhoto.imageCover && fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // Remove old file
      }
      tiragePhoto.imageCover = req.body.imageCover;
    }

    // Update fields
    tiragePhoto.name = name || tiragePhoto.name;
    tiragePhoto.slug = slug || tiragePhoto.slug;
    tiragePhoto.price = price || tiragePhoto.price;
    tiragePhoto.description = description || tiragePhoto.description;
    tiragePhoto.numberOfPhotos = numberOfPhotos || tiragePhoto.numberOfPhotos;

    // Update size
    if (nameTirage) {
      tiragePhoto.nameTirage = nameTirage; // Use the correct field name
    }

    // Ensure promotions, sousCategories, and formats are arrays of ObjectIds
    tiragePhoto.promotions = Array.isArray(promotions) 
      ? promotions.map(promo => promo._id || promo) 
      : promotions === "null" ? null : tiragePhoto.promotions;

    const oldSousCategories = tiragePhoto.sousCategories; // Save old sousCategories for comparison
    tiragePhoto.sousCategories = Array.isArray(sousCategories) 
      ? sousCategories.map(subCat => subCat._id || subCat) 
      : sousCategories || tiragePhoto.sousCategories;

      tiragePhoto.formats = Array.isArray(formats) 
      ? formats.map(format => format._id || format) 
      : formats || tiragePhoto.formats;

    // Ensure the imageCover has the base URL
    setImageURL(tiragePhoto);

    // Save the updated TiragePhoto
    console.log("Before save:", tiragePhoto.size); // Log the size before saving
    const updatedTiragePhoto = await tiragePhoto.save();

    // Update the corresponding SousCategories
    if (oldSousCategories) {
      await SousCategorie.updateMany(
        { _id: { $in: oldSousCategories } },
        { $pull: { produits: updatedTiragePhoto._id } }
      );
    }

    if (tiragePhoto.sousCategories) {
      await SousCategorie.updateMany(
        { _id: { $in: tiragePhoto.sousCategories } },
        { $addToSet: { produits: updatedTiragePhoto._id } }
      );
    }

    res.status(200).json({
      status: 'success',
      data: updatedTiragePhoto,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message || 'An error occurred while updating the TiragePhoto',
    });
  }
});

exports.deleteTiragePhoto = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    await TiragePhoto.findByIdAndDelete(id);

    res.status(204).json({
      status: 'success',
      message: 'TiragePhoto deleted successfully',
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
});