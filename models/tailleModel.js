const mongoose = require('mongoose');
const tailleSchema = new mongoose.Schema({
  width: { type: Number, trim: true, required: [true, 'Largeur required'] },  
  height: { type: Number, trim: true, required: [true, 'Hauteur required'] }, 
  unit: { type: String, trim: true,enum: ['cm', 'm', 'inches'], default: 'cm', }, 
  prix: { type: Number,  required: [true, 'Prix required'] }, 
  image: { type: String, required: [true, 'image required'] },
  format: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Format',
    required: true, // Assurez-vous qu'une taille doit appartenir à un format
  },
});

// Exporter le modèle
const Taille = mongoose.model('Taille', tailleSchema);

module.exports = Taille;