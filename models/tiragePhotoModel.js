const mongoose = require('mongoose');
const Product = require('./productModel'); // Ensure correct path to productModel

const tiragePhotoSchema = new mongoose.Schema({
  nameTirage: { 
    type: String,
    trim: true,
    unique: true,
    required: [true, 'Name is required'],
  },
  numberOfPhotos: {
    type: Number,
    required: [true, 'TiragePhoto must specify the number of photos'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the TiragePhoto discriminator
const TiragePhoto = Product.discriminator('TiragePhoto', tiragePhotoSchema);

module.exports = TiragePhoto