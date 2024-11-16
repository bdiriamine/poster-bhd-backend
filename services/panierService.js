const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');
const factory = require('./handlersFactory');
const Panier = require('../models/panierModel');
const Product = require('../models/productModel');
const { Result } = require('express-validator');

const uploadDir = path.join(__dirname, '..', 'uploads', 'command');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Upload directory created:", uploadDir);
} else {
    console.log("Upload directory already exists:", uploadDir);
}

// Resize and save images from Base64 strings
exports.resizePanierImages = asyncHandler(async (req, res, next) => {  
  try {
      // Ensure uploadDir exists
      if (!fs.existsSync(uploadDir)) {
          console.error("Upload directory does not exist:", uploadDir);
          return res.status(500).json({ status: 'error', message: 'Upload directory not found.' });
      }

      // Initialize an array for processed images
      const processedImages = [];

      // Check if req.body.images is an array or a single Base64 image string
      const images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];

      await Promise.all(
          images.map(async (base64Image, index) => {
              if (typeof base64Image === 'string' && base64Image.startsWith('data:image/')) {
                  const base64Data = base64Image.split(',')[1];
                  const imageName = `command-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;
                  const outputPath = path.join(uploadDir, imageName);
                  const buffer = Buffer.from(base64Data, 'base64');

                  console.log("Processing image:", imageName, "Output path:", outputPath);

                  await sharp(buffer)
                      .resize(2000, 1333)
                      .toFormat('jpeg')
                      .jpeg({ quality: 95 })
                      .toFile(outputPath)
                      .catch(err => {
                          console.error(`Failed to process image ${imageName}:`, err);
                          throw new Error('Image processing failed');
                      });

                  // Prepend the base URL to the saved image path
                  const imageUrl = `${imageName}`;
                  processedImages.push(imageUrl);
                  console.log("Image saved:", imageUrl);
              } else {
                  console.warn("Invalid image data at index:", index);
              }
          })
      );

      // Update req.body.images with processed image URLs
      req.body.images = processedImages;

      // Log the processed request body
      console.log("Processed request body:", req.body);

      next();
  } catch (error) {
      console.error("Error processing images:", error);
      return res.status(500).json({ status: 'error', message: 'Image processing failed.' });
  }
});

exports.uploadPanierImages = uploadMixOfImages([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 300,
  },
]);

const setImageURL = (product) => {
  const baseURL = process.env.BASE_URL;
  if (product.images && Array.isArray(product.images)) {
      product.images = product.images.map(image => `${baseURL}/command/${image}`);
  }
};
// @desc    Get list of products
// @route   GET /api/v1/products
// @access  Public

const getPanierById = async (id) => {
  const panier = await Panier.findById(id)
  

  if (!panier) {
    throw new Error('Product not found');
  }

  // Calculate the discounted price if there are active promotions


  // Get current date
  const now = new Date();

  
  // Return the product with the discounted price
  return {
    ...panier.toObject(), // Convert Mongoose document to plain object

  };
}

exports.getProducts = factory.getAll(Panier)

// async (req, res, next) => {
//   try {
//     // Create a filter object
//     let filter = {};

//     // Check if the category name is provided in the query
//     if (req.query.categoryName) {
//       // Use the category name to filter the products by category
//       filter['sousCategories.category.name'] = req.query.categoryName;
//       console.log(filter);
//     }

//     // Fetch products based on the filter
//     const products = await Product.find(filter)
//       .populate({
//         path: 'sousCategories',
//         populate: {
//           path: 'category',
//           select: 'name', // Select only the category name
//         },
//       })
//       .populate('promotions'); // Populate promotions

//     const now = new Date(); // Get the current date

//     // Calculate the discounted prices for products with active promotions
//     const productsWithDiscounts = products.map((product) => {
//       // Default to original price if there's no promotion
//       let discountedPrice = product.price;

//       // Check if there's an active promotion
//       const promotion = product.promotions;
//       if (promotion && promotion.startDate <= now && promotion.endDate >= now) {
//         const discountPercentage = promotion.discountPercentage;
//         discountedPrice =
//           product.price - product.price * (discountPercentage / 100);
//       }

//       // Return the product with the discounted price
//       return {
//         ...product.toObject(), // Convert Mongoose document to plain object
//         discountedPrice,
//       };
//     });

//     // Respond with the filtered and processed products
//     res.status(200).json({ status: 'success', data: productsWithDiscounts });
//   } catch (err) {
//     next(err);
//   }
// };

// @desc    Get specific product by id
// @route   GET /api/v1/products/:id
// @access  Public
exports.getPaniers = factory.getOne(Panier);

// @desc    Create product
// @route   POST  /api/v1/products
// @access  Private
exports.getPanierByUserId = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  try {
    const paniers = await Panier.find({ user: userId }).populate('product tailles'); // Populate related data if necessary

    if (!paniers.length) {
      return res.status(404).json({ status: 'error', message: 'No paniers found for this user' });
    }

    res.status(200).json({ 
      status: 'success', 
      Result: paniers.length,
      data: paniers
    });
  } catch (error) {
    console.error('Error retrieving paniers by userId:', error);
    next(error);
  }
});

exports.createPanier = asyncHandler(async (req, res, next) => {
  try {
      const { user, product, tailles, quantite } = req.body;
      const baseURL = process.env.BASE_URL;
      
      // Set image URLs correctly
      if (req.body.imageCover) {
          req.body.imageCover = `${baseURL}/command/${req.body.imageCover}`;
      }
      
      if (req.body.images && Array.isArray(req.body.images)) {
          req.body.images = req.body.images.map(image => `${baseURL}/command/${image}`);
      }

      // Find the product to calculate total price
      const foundProduct = await Product.findById(product);
      if (!foundProduct) {
          return res.status(404).json({ status: 'error', message: 'Product not found' });
      }

      // Calculate total price based on quantity
      const totalPrice = foundProduct.discountedPrice * quantite;

      const newPanier = await Panier.create({
          user,
          product,
          tailles,
          quantite,
          totalPrice,
          ...req.body, // Include other properties from the body
      });

      res.status(201).json({
          status: 'success',
          data: newPanier,
      });
  } catch (error) {
      console.error('Error creating panier:', error);
      next(error);
  }
});

// @desc    Update specific panier
// @route   PUT /api/v1/paniers/:id
// @access  Private
exports.updatePanier = asyncHandler(async (req, res, next) => {
  try {
    const panierId = req.params.id;

    // Find the existing panier before updating
    const existingPanier = await Panier.findById(panierId);
    if (!existingPanier) {
      return res.status(404).json({ status: 'error', message: 'Panier not found' });
    }

    // Create an update object that keeps the existing images and updates only quantite and totalPrice
    const updates = {
      quantite: req.body.quantite !== undefined ? req.body.quantite : existingPanier.quantite,
      totalPrice: req.body.totalPrice !== undefined ? req.body.totalPrice : existingPanier.totalPrice,
      images: existingPanier.images, // Preserve the existing images
    };

    // Update the panier with the new data
    const updatedPanier = await Panier.findByIdAndUpdate(panierId, updates, {
      new: true,
      runValidators: true,
    });

    // Optionally set the image URL
    setImageURL(updatedPanier);

    res.status(200).json({ status: 'success', data: updatedPanier });
  } catch (error) {
    console.error('Error updating panier:', error);
    next(error);
  }
});

// @desc    Delete specific product
// @route   DELETE /api/v1/products/:id
// @access  Private
exports.deletePanier = factory.deleteOne(Panier);


// Function to get product by ID with discounted price

// New function to handle the request and response
exports.handleGetPanierById = asyncHandler(async (req, res, next) => { 
  const { id } = req.params; 
  const { quantite, totalPrice } = req.body; 
  const newImageFile = req.file; // Assuming you’re using multer with a single file

  try {
    // Find the panier by ID
    const panier = await Panier.findById(id);

    if (!panier) {
      return res.status(404).json({ status: 'error', message: 'Panier not found' });
    }

    // Update only `quantite` and `totalPrice`
    panier.quantite = quantite !== undefined ? quantite : panier.quantite;
    panier.totalPrice = totalPrice !== undefined ? totalPrice : panier.totalPrice;

    // Only update `images` if a new image file is provided
    if (newImageFile) {
      panier.images = `/uploads/${newImageFile.filename}`;
    }

    // Save the updated panier
    await panier.save();

    // Send response with existing `images` if it wasn't changed
    res.status(200).json({
      status: 'success',
      data: {
        _id: panier._id,
        quantite: panier.quantite,
        totalPrice: panier.totalPrice,
        images: panier.images, // Keep original images if no new image provided
      },
    });
  } catch (error) {
    console.error("Error updating panier:", error);
    next(error);
  }
});