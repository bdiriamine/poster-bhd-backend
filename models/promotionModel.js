const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  dateDebut: { type: Date, required: [true, 'date de debut required'], },
  dateFin: { type: Date, required: [true, 'date de fin required'],},
  remise: { type: Number, required: [true, 'remise required'],},
  produits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }] 
});

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;