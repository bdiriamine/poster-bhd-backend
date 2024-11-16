const factory = require('./handlersFactory');
const Category = require('../models/categoryModel');
const expressAsyncHandler = require('express-async-handler');


// @desc    Get list of categories
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories =factory.getAll(Category, 'Category', ['sousCategories']); 

// @desc    Get specific category by id
// @route   GET /api/v1/categories/:id
// @access  Public
exports.getCategory = expressAsyncHandler(async (req, res, next) => {
    const { id } = req.params;
  
    // Find category by ID and populate sousCategories with only _id and name
    const category = await Category.findById(id)
  
    if (!category) {
      return next(new ApiError(`No category found for this ID: ${id}`, 404));
    }
  
    res.status(200).json({
      status: 'success',
      data: category
    });
  });

  exports.getCategoryByName = expressAsyncHandler(async (req, res, next) => {
    const { name } = req.params;

    // Find category by name (case-insensitive) and populate sousCategories
    const category = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
                                   .populate({
                                       path: 'sousCategories', // Field to populate
                                       select: '_id name' // Select only specific fields (e.g., _id, name)
                                   });

    if (!category) {
        return next(new ApiError(`No category found with the name: ${name}`, 404));
    }

    res.status(200).json({
        status: 'success',
        data: category
    });
});
// @desc    Create category
// @route   POST  /api/v1/categories
// @access  Private/Admin-Manager
exports.createCategory = factory.createOne(Category);

// @desc    Update specific category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin-Manager
exports.updateCategory = factory.updateOne(Category);

// @desc    Delete specific category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
exports.deleteCategory = factory.deleteOne(Category);
