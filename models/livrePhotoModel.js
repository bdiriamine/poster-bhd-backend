const mongoose = require('mongoose');
const Product = require('./productModel'); // Ensure Product model is imported

const livrePhotoSchema = new mongoose.Schema({
  paperQuality: {
    type: String,
    required: [true, 'La qualité du papier est requise'],
  },
  coverType: {
    type: String,
    required: [true, 'Le type de couverture est requis'],
  },
  numberOfPages: {
    type: Number,
    required: [true, 'Le nombre de pages est requis'],
  },
  numberOfPhotos: {
    type: Number,
    required: [true, 'LivrePhoto must specify the number of photos'],
  },
  size: {
    type: String,
    enum: ['S', 'M', 'L', 'XL'], // Allowed size options
    required: [true, 'Size is required'], // Make size mandatory
  },
});

const LivrePhoto = Product.discriminator('LivrePhoto', livrePhotoSchema);

module.exports = LivrePhoto;