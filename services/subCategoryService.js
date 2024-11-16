const factory = require('./handlersFactory');
const SubCategory = require('../models/SousCategorieModel');
const Category = require('../models/categoryModel');

exports.setCategoryIdToBody = (req, res, next) => {
  // Nested route (Create)
  if (!req.body.category) req.body.category = req.params.categoryId;
  next();
};

// Nested route
// GET /api/v1/categories/:categoryId/subcategories
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.categoryId) filterObject = { category: req.params.categoryId };
  req.filterObj = filterObject;
  next();
};

// @desc    Get list of subcategories
// @route   GET /api/v1/subcategories
// @access  Public
exports.getAllSubCategories = factory.getAll(SubCategory,'SubCategory','category produits')


// @desc    Get specific subcategory by id
// @route   GET /api/v1/subcategories/:id
// @access  Public
exports.getSubCategory = factory.getOne(SubCategory);

// @desc    Create subCategory
// @route   POST  /api/v1/subcategories
// @access  Private

exports.createSubCategory = async (req, res) => {
  try {
    const soucategory = await SubCategory.create(req.body); // Create new Taille

    // If a categoryId is provided, add the Taille ID to the corresponding category document
    if (req.body.category) {
      await Category.findByIdAndUpdate(
        req.body.category,
        { $addToSet: { sousCategories: soucategory._id } }, // Use $addToSet to avoid duplicates
        { new: true }
      );
    }
    res.status(201).json({
      status: 'success',
      data: { soucategory },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};
// @desc    Update specific subcategory
// @route   PUT /api/v1/subcategories/:id
// @access  Private
exports.updateSubCategory = factory.updateOne(SubCategory);

// @desc    Delete specific subCategory
// @route   DELETE /api/v1/subcategories/:id
// @access  Private
exports.deleteSubCategory = factory.deleteOne(SubCategory);
