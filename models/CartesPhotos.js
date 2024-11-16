const mongoose = require('mongoose');
const Product = require('./productModel');  // Assurez-vous que le chemin est correct

// Champs spécifiques aux CartesPhotos
const cartesPhotosSchema = new mongoose.Schema({
  numberOfCards: {
    type: Number,
    required: [true, 'CartesPhotos must have a number of cards']
  },
  paperQuality: {
    type: String,
    required: [true, 'CartesPhotos must have paper quality']
  },
  occasion: {
    type: String,
    required: [true, 'CartesPhotos must have an occasion']
  },
  numberOfPhotos: {
    type: Number, 
    required: [true, 'CartesPhotos must specify the number of photos'],
  },
});

// Utilisation du discriminant pour l'héritage
const CartesPhotos = Product.discriminator('CartesPhotos', cartesPhotosSchema);

module.exports = CartesPhotos;