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
      // Create a filter object based on request query parameters
      let filter = {};
      if (req.filterObj) {
        filter = req.filterObj;
      }
  
      // Build query with optional population
      const query = Model.find(filter);
      if (populateFields) {
        query.populate(populateFields); // Populate specified fields
      }
  
      // Execute the query
      const documents = await query;
  
      res.status(200).json({
        status: 'success',
        results: documents.length,
        data: documents,
      });
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