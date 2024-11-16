const mongoose = require('mongoose');
const Product = require('./productModel');

// Schéma spécifique pour CalendriePhoto
const calendriePhotoSchema = new mongoose.Schema({
  year: { 
    type: Number, 
    required: [true, 'L\'année est requise'] 
  },
  paperQuality: { 
    type: String, 
    required: [true, 'La qualité du papier est requise'] 
  },
  numberOfPhotos: { 
    type: Number, 
    required: [true, 'Le nombre de photo est requis'] 
  },
});

// Créer le modèle CalendriePhoto en tant que discriminant du modèle Product
const CalendriePhoto = Product.discriminator('CalendriePhoto', calendriePhotoSchema);

module.exports = CalendriePhoto;