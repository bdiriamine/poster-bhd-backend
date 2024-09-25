const mongoose = require('mongoose');

const sousCategorieSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'name required'], unique: true }, // Nom de la sous-catégorie
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'SubCategory must be belong to parent category'], }, // Référence à la catégorie parent
  produits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // Références aux produits
},
{ timestamps: true });


const SousCategorie = mongoose.model('SousCategorie', sousCategorieSchema);

module.exports = SousCategorie;