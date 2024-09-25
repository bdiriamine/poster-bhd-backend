const factory = require('./handlersFactory');
const Taille = require('../models/tailleModel');
const Format = require('../models/formatModel');

// Middleware to set the tailleId in the request body
exports.setTailleIdToBody = (req, res, next) => {
  if (!req.body.taille) req.body.taille = req.params.tailleId; // Set taille ID
  next();
};

// Middleware to create filter object for fetching Formats
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.tailleId) filterObject = { tailles: req.params.tailleId }; // Filter by taille ID
  req.filterObj = filterObject;
  next();
};

// Get all Formats, optionally filtered by taille ID
exports.getFormats = factory.getAll(Format, 'Formats', 'tailles'); // Adjusted to fetch tailles

// Get specific Format by ID and populate tailles
exports.getFormat = async (req, res) => {
  try {
    const format = await Format.findById(req.params.id).populate('tailles'); // Populate tailles
    if (!format) {
      return res.status(404).json({
        status: 'error',
        message: 'No format found with that ID',
      });
    }
    res.status(200).json({
      status: 'success',
      data: format,
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Create a new Format
exports.createFormat = async (req, res) => {
  try {
    const format = await Format.create(req.body); // Create new Format
    res.status(201).json({
      status: 'success',
      data: { format },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Update a specific Format
exports.updateFormat = factory.updateOne(Format);

// Delete a specific Format
exports.deleteFormat = factory.deleteOne(Format);