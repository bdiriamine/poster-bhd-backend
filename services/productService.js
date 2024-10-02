const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');
const factory = require('./handlersFactory');
const Product = require('../models/productModel');
const Promotion = require('../models/promotionModel');

const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

exports.uploadProductImages = uploadMixOfImages([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 5,
  },
]);

exports.resizeProductImages = asyncHandler(async (req, res, next) => {
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

      req.body.imageCover = imageCoverFileName;
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

// @desc    Get list of products
// @route   GET /api/v1/products
// @access  Public
const populateOptions = { path: 'sousCategorie', select: 'name -_id' };
const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate('promotions'); // Make sure to populate promotions

  if (!product) {
    throw new Error('Product not found');
  }

  // Calculate the discounted price if there are active promotions
  let discountedPrice = product.price; // Default to the original price

  // Get current date
  const now = new Date();

  const promotion = product.promotions;
  if (promotion && promotion.startDate <= now && promotion.endDate >= now) {
    const discountPercentage = promotion.discountPercentage;
    discountedPrice = product.price - (product.price * (discountPercentage / 100));
  }

  // Return the product with the discounted price
  return {
    ...product.toObject(), // Convert Mongoose document to plain object
    discountedPrice
  };
}

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('sousCategorie', 'name') // Adjust to select only necessary fields
      .populate('promotions'); // Populate promotions

    const now = new Date(); // Get the current date

    const productsWithDiscounts = products.map(product => {
      // Default to original price if there's no promotion
      let discountedPrice = product.price;

      // Check if there's an active promotion
      const promotion = product.promotions;
      if (promotion && promotion.startDate <= now && promotion.endDate >= now) {
        const discountPercentage = promotion.discountPercentage;
        discountedPrice = product.price - (product.price * (discountPercentage / 100));
      }

      // Return the product with the discounted price
      return {
        ...product.toObject(), // Convert Mongoose document to plain object
        discountedPrice
      };
    });

    res.status(200).json({ status: 'success', data: productsWithDiscounts });
  } catch (err) {
    next(err);
  }
};

// @desc    Get specific product by id
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = factory.getOne(Product, 'sousCategorie');

// @desc    Create product
// @route   POST  /api/v1/products
// @access  Private
exports.createProduct = factory.createOne(Product);

// @desc    Update specific product
// @route   PUT /api/v1/products/:id
// @access  Private
exports.updateProduct = factory.updateOne(Product);

// @desc    Delete specific product
// @route   DELETE /api/v1/products/:id
// @access  Private
exports.deleteProduct = factory.deleteOne(Product);

// Function to get product by ID with discounted price

// New function to handle the request and response
exports.handleGetProductById = async (req, res, next) => {
  try {
    const dataProduct = await getProductById(req.params.id);
    const responseData = {
      _id: dataProduct._id,
      name: dataProduct.name,
      slug: dataProduct.slug,
      price: dataProduct.price,
      description: dataProduct.description,
      sousCategorie: dataProduct.sousCategorie,
      promotions: dataProduct.promotions,
      imageCover: dataProduct.imageCover,
      formats: dataProduct.formats,
      createdAt: dataProduct.createdAt,
      updatedAt: dataProduct.updatedAt,
      discountedPrice: dataProduct.discountedPrice // Ensure discountedPrice is included
    };
    console.log('Data Product:', dataProduct); // Debugging output
    res.status(200).json({ status: 'success', data: responseData }); // Ensure discountedPrice is included
  } catch (err) {
    next(err);
  }
};