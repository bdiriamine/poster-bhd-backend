const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');
const factory = require('./handlersFactory');
const Product = require('../models/productModel');
const Promotion = require('../models/promotionModel');
const SousCategorie = require('../models/SousCategorieModel');

const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Upload directory created:", uploadDir);
} else {
    console.log("Upload directory already exists:", uploadDir);
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
// @desc    Get list of products
// @route   GET /api/v1/products
// @access  Public

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

exports.getProducts = factory.forProducts(Product,"Product","sousCategories promotions")

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
exports.getProduct = factory.getOne(Product, 'sousCategories');

// @desc    Create product
// @route   POST  /api/v1/products
// @access  Private
exports.createProduct = asyncHandler(async (req, res, next) => {
  try {
    const baseURL = process.env.BASE_URL;
    if (req.body.imageCover) {
      req.body.imageCover = `${baseURL}/products/${req.body.imageCover}`;
    }

    const sousCategorie = await SousCategorie.findById(req.body.sousCategories);

    if (!sousCategorie) {
      return next(new AppError('Category or SubCategory not found', 404));
    }
  
    // Create the product
    const newProduct = await Product.create(req.body);
    setImageURL(newProduct);
    // Add the product to the subcategory
    sousCategorie.produits.push(newProduct._id);
    await sousCategorie.save();
  
    res.status(201).json({
      status: 'success',
      data: {
        product: newProduct
      }
    });
  }catch (error) {
    console.error('Error creating product:', error);
    next(error);
  }

});
exports.createOneProduct = asyncHandler(async (req, res, next) => {
  try {
    const baseURL = process.env.BASE_URL;
    if (req.body.imageCover) {
      req.body.imageCover = `${baseURL}/products/${req.body.imageCover}`;
    }

    // Set promotions to null if not provided or if it is "null" as a string
    req.body.promotions = req.body.promotions === "null" ? null : req.body.promotions;
    // Create a new product
    const newProduct = await Product.create(req.body);
    await newProduct.save();
    // Find the corresponding SousCategorie by ID (assuming it's passed in req.body.sousCategorie)
    const sousCategorie = await SousCategorie.findById(req.body.sousCategories);
    if (!sousCategorie) {
      return next(new Error('SousCategorie not found'));
    }
    const promotions = await Promotion.findById(req.body.promotions);
    if (!promotions) {
      return next(new Error('Promotions not found'));
    }

    // Push the new product's ID into the produits array of the SousCategorie
    sousCategorie.produits.push(newProduct._id);
    promotions.produits.push(newProduct._id);

    // Save the updated SousCategorie
    await sousCategorie.save();
    setImageURL(newProduct);


    // Respond with success
    res.status(201).json({
      status: 'success',
      data: newProduct,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    next(error);
  }
});

// asyncHandler(async (req, res, next) => {
//   try {
//     // Create the new product
//     const newDoc = await Product.create(req.body);
//     console.log('New Product Created:', newDoc);

//     // Check if a promotion ID is provided in the request body
//     if (req.body.promotions) {
//       console.log('Promotion ID from Request:', req.body.promotions);

//       // Find the promotion
//       const promotion = await Promotion.findById(req.body.promotions);

//       if (promotion) {
//         // Check if the product ID is not already in the 'produits' array
//         if (!promotion.produits.includes(newDoc._id)) {
//           // Add the new product ID to the promotion's produits array
//           promotion.produits.push(newDoc._id);
//           await promotion.save(); // Save the updated promotion

//           console.log('Updated Promotion After Adding Product:', promotion);
//         } else {
//           console.log('Product ID already exists in the promotion produits array.');
//         }
//       } else {
//         console.log('Promotion not found for ID:', req.body.promotion);
//       }
//     }

//     // Send success response
//     res.status(201).json({
//       status: 'success',
//       data: newDoc,
//     });
//   } catch (error) {
//     console.error('Error creating product:', error);
//     next(error);
//   }
// });

// @desc    Update specific product
// @route   PUT /api/v1/products/:id
// @access  Private
// @desc    Update specific product
// @route   PUT /api/v1/products/:id
// @access  Private
exports.updateProduct = asyncHandler(async (req, res, next) => {
  try {
    const productId = req.params.id;

    // Find the existing product before updating
    const existingProduct = await Product.findById(productId).populate('sousCategories');

    if (!existingProduct) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const oldSousCategorieId = existingProduct.sousCategories._id; // Keep track of the old SousCategorie
    const newSousCategorieId = req.body.sousCategories; // Assuming this is passed in the request body

    // Update the product with new data
    const Productdata = await Product.findByIdAndUpdate(productId, req.body, {
      new: true,
      runValidators: true,
    });

    // Handle promotions as before (optional)
    if (req.body.promotions) {
      // Your existing promotion logic
    }    
    setImageURL(Productdata);
    const updatedProduct = await Productdata.save();
    // If the SousCategorie has changed, update it
    if (oldSousCategorieId.toString() !== newSousCategorieId) {
      // Remove the product from the old SousCategorie
      const oldSousCategorie = await SousCategorie.findById(oldSousCategorieId);
      if (oldSousCategorie) {
        oldSousCategorie.produits = oldSousCategorie.produits.filter(
          (id) => !id.equals(updatedProduct._id)
        );
        await oldSousCategorie.save();
      }

      // Add the product to the new SousCategorie
      const newSousCategorie = await SousCategorie.findById(newSousCategorieId);
      if (newSousCategorie) {
        newSousCategorie.produits.push(updatedProduct._id);
        await newSousCategorie.save();
      }
    }



    res.status(200).json({ status: 'success', data: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    next(error);
  }
});

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
      sousCategorie: dataProduct.sousCategories,
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