const mongoose = require('mongoose');
const Product = require('./productModel'); // Path to the base Product model

// Schema specific to CadeauxPhoto
const cadeauxPhotoSchema = new mongoose.Schema({
  occasion: {
    type: String,
    required: [true, 'CadeauxPhoto must have an occasion'],
  },
  personalizedMessage: {
    type: String,
    required: [true, 'CadeauxPhoto must have a personalized message'],
  },
  wrappingType: {
    type: String,
    required: [true, 'CadeauxPhoto must have a wrapping type'],
  },
  giftSize: {
    type: String,
    required: [true, 'CadeauxPhoto must have a gift size'],
  },
  numberOfPhotos: {
    type: Number, 
    required: [true, 'CadeauxPhoto must specify the number of photos'],
  },
});

// Create the CadeauxPhoto model using the Product schema as a base
const CadeauxPhoto = Product.discriminator('CadeauxPhoto', cadeauxPhotoSchema);

module.exports = CadeauxPhoto;