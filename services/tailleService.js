const factory = require('./handlersFactory');
const Taille = require('../models/tailleModel');
const Format = require('../models/formatModel');

// Middleware to set the formatId in the request body
exports.setFormatIdToBody = (req, res, next) => {
  if (!req.body.format) req.body.format = req.params.formatId; // Set format ID
  next();
};

// Middleware to create filter object for fetching Tailles
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.formatId) filterObject = { format: req.params.formatId }; // Filter by format ID
  req.filterObj = filterObject;
  next();
};

// Get all Tailles, optionally filtered by format ID
exports.getTailles = factory.getAll(Taille,'type', 'format');

// Get specific Taille by ID
exports.getTaille = async (req, res) => {
  try {
    const taille = await Taille.findById(req.params.id).populate('format'); // Ensure 'format' is populated
    res.status(200).json({
      status: 'success',
      data: taille,
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Create a new Taille and associate it with a Format
exports.createTaille = async (req, res) => {
  try {
    const taille = await Taille.create(req.body); // Create new Taille

    // If a formatId is provided, add the Taille ID to the corresponding Format document
    if (req.body.format) {
      await Format.findByIdAndUpdate(
        req.body.format,
        { $addToSet: { tailles: taille._id } }, // Use $addToSet to avoid duplicates
        { new: true }
      );
    }

    res.status(201).json({
      status: 'success',
      data: { taille },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Update a specific Taille
exports.updateTaille = factory.updateOne(Taille);

// Delete a specific Taille
exports.deleteTaille = factory.deleteOne(Taille);