const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  dateCommande: { type: Date, default: Date.now },
  etatLivraison: { enum: ['en attente', 'en préparation','Sortie pour la livraison','Livré'],
  default: 'en attente', },
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  produits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;