const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await Model.findByIdAndDelete(id);

    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }
    res.status(204).send();
  });

exports.updateOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }
    // Trigger "save" event when update document
    document.save();
    res.status(200).json({ data: document });
  });

exports.createOne = (Model) =>
  asyncHandler(async (req, res) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({ data: newDoc });
  });

exports.getOne = (Model, populationOpt) =>
  asyncHandler(async (req, res, next) => {
    console.log(populationOpt)
    const { id } = req.params;
    // 1) Build query
    let query = Model.findById(id);
    if (populationOpt) {
      clg
      query = query.populate(populationOpt);
    }

    // 2) Execute query
    const document = await query;

    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }
    
    res.status(200).json({ data: document });

  });
  
    exports.getAll = (Model, modelName = '', populateFields = '') =>
      asyncHandler(async (req, res) => {
        const filter = req.filterObj || {}; // Filter if any is applied
    
        // Build query
        const query = Model.find(filter);
        if (populateFields) {
          query.populate(populateFields); // Populate only if fields are provided
        }
    
        const documents = await query;

        res.status(200).json({
          status: 'success',
          results: documents.length,
          data: documents,
        });
      });
      exports.getAllForProduct = (Model, modelName = '', populateFields = []) =>
    asyncHandler(async (req, res) => {
      let filter = {};
      if (req.filterObj) {
        filter = req.filterObj;
      }
  
      // Build query
      const documentsCounts = await Model.countDocuments();
      const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
        .paginate(documentsCounts)
        .filter()
        .search(modelName)
        .limitFields()
        .sort();
  
      // Execute query
      const { mongooseQuery, paginationResult } = apiFeatures;
  
      // Populate fields if they exist in the model schema
      const existingPopulateFields = populateFields.filter(field => 
        Model.schema.path(field) && Model.schema.path(field).instance === 'Array'
      );
  
      const documents = await mongooseQuery.populate(existingPopulateFields);
  
      res.status(200).json({ results: documents.length, paginationResult, data: documents });
    });
  exports.getAllwithDetails = (Model, modelName = '', populateOptions = '') => 
    asyncHandler(async (req, res) => {
      let filter = {};
      if (req.filterObj) {
        filter = req.filterObj;
      }
      
      // Build query
      const documentsCounts = await Model.countDocuments();
      const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
        .paginate(documentsCounts)
        .filter()
        .search(modelName)
        .limitFields()
        .sort();
  
      // Execute query
      const { mongooseQuery, paginationResult } = apiFeatures;
  
      // Populate if options are provided
      if (populateOptions) {
        mongooseQuery.populate(populateOptions);
      }
  
      const documents = await mongooseQuery;
  
      res
        .status(200)
        .json({ results: documents.length, paginationResult, data: documents });
    });

    exports.forProducts = (Model, modelName = '') =>
      asyncHandler(async (req, res) => {
        let filter = {};
        if (req.filterObj) {
          filter = req.filterObj;
        }
    
        // Check if slug is provided in the query
        if (req.query.slug) {
          filter.slug = req.query.slug; // Add slug filter
        }
    
        // Check if souscategory name is provided in the query
        let sousCategoryFilter = {};
        if (req.query.sousCategoryName) {
          sousCategoryFilter = { 'sousCategories.name': req.query.sousCategoryName }; // Add souscategory name filter
        }
    
        // Category filter
        let categoryFilter = {};
        if (req.query.category) {
          categoryFilter = { 'sousCategories.category.name': req.query.category };
        }
    
        // Pagination
        const page = parseInt(req.query.page, 10) || 1; // Default to page 1
        const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 documents per page
        const skip = (page - 1) * limit;
    
        // Perform a separate count query to calculate total documents
        const totalDocuments = await Model.countDocuments(filter);
    
        // Perform aggregation with lookup and apply skip and limit for pagination
        const documents = await Model.aggregate([
          { $match: filter }, // Match based on the filter including slug
          {
            $lookup: {
              from: 'souscategories',
              localField: 'sousCategories',
              foreignField: '_id',
              as: 'sousCategories',
            },
          },
          { $unwind: { path: '$sousCategories', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'categories',
              localField: 'sousCategories.category',
              foreignField: '_id',
              as: 'sousCategories.category',
            },
          },
          { $unwind: { path: '$sousCategories.category', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'promotions', // Lookup the promotions collection
              localField: 'promotions', // Field from the product model
              foreignField: '_id', // Field from the promotions collection
              as: 'promotion', // Use singular since there's only one promotion
            },
          },
          { $unwind: { path: '$promotion', preserveNullAndEmptyArrays: true } }, // Unwind promotion if it exists
    
          // Add formats lookup
          {
            $lookup: {
              from: 'formats', // Lookup the formats collection
              localField: 'formats', // Field from the product model (array of format IDs)
              foreignField: '_id', // Field from the formats collection
              as: 'formats', // This will return the populated formats
            },
          },
          { $unwind: { path: '$formats', preserveNullAndEmptyArrays: true } }, // Unwind formats if they exist
    
          // Populate formats.tailles
          {
            $lookup: {
              from: 'tailles', // Lookup the tailles collection
              localField: 'formats.tailles', // Field from the formats model
              foreignField: '_id', // Field from the tailles collection
              as: 'formats.tailles', // Populate the tailles
            },
          },
    
          {
            $match: {
              ...categoryFilter,      // Apply category filter here
              ...sousCategoryFilter   // Apply souscategory name filter here
            },
          },
          {
            $group: {
              _id: '$_id',
              name: { $first: '$name' },
              slug: { $first: '$slug' },
              price: { $first: '$price' },
              description: { $first: '$description' },
              promotion: { $first: '$promotion' }, // Get the single promotion
              imageCover: { $first: '$imageCover' },
              formats: { $push: '$formats' }, // Group the populated formats
              sousCategories: { $first: '$sousCategories' },
              createdAt: { $first: '$createdAt' },
              updatedAt: { $first: '$updatedAt' },
            },
          },
          {
            $addFields: {
              discountedPrice: {
                $cond: {
                  if: {
                    $and: [
                      { $ne: ['$promotion', null] }, // Check if a promotion exists
                      { $lte: ['$promotion.startDate', new Date()] }, // Check if current date >= startDate
                      { $gte: ['$promotion.endDate', new Date()] }   // Check if current date <= endDate
                    ]
                  },
                  then: {
                    $round: [
                      {
                        $subtract: [
                          '$price',
                          {
                            $multiply: [
                              '$price',
                              { $divide: ['$promotion.discountPercentage', 100] } // Calculate the discount amount
                            ]
                          }
                        ]
                      },
                      2 // Round to 2 decimal places
                    ]
                  },
                  else: '$price' // If no active promotion, use the original price
                }
              }
            }
          },
          { $skip: skip }, // Skip documents for pagination
          { $limit: limit } // Limit the number of documents
        ]);
    
        // Calculate total pages based on totalDocuments and limit
        const totalPages = Math.ceil(totalDocuments / limit);
    
        // Send response with pagination details
        res.status(200).json({
          results: documents.length,
          page,
          totalPages,
          data: documents
        });
      });