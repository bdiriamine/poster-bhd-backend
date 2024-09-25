const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema({
  dateCommande: { type: Date, default: Date.now }, // Date de la commande
  etatLivraison: {     type: String,
    required: true,
    enum: [
      'En attente',
      'En préparation',
      'Expédiée',
      'En transit',
      'Prise en charge par le livreur',
      'Livrée',
      'Échec de livraison',
      'Retournée',
      'Annulée'
    ],
 }, 
  codeSuivi: { type: String }, // Code de suivi de la livraison
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true }, // Référence à l'utilisateur
  produits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Produit', required: true }], // Référence aux produits
  paiement: { type: mongoose.Schema.Types.ObjectId, ref: 'Paiement' }, // Référence au paiement
  livraison: { type: mongoose.Schema.Types.ObjectId, ref: 'Livraison' }, // Référence à la livraison
});

// Méthodes
commandeSchema.methods.annulerCommande = function () {
  // Logic pour annuler la commande
};

commandeSchema.methods.modifierCommande = function (nouveauxDetails) {
  // Logic pour modifier la commande avec de nouveaux détails
};

commandeSchema.methods.afficherDetailsCommande = function () {
  return {
    dateCommande: this.dateCommande,
    etatLivraison: this.etatLivraison,
    produits: this.produits,
    paiement: this.paiement,
    livraison: this.livraison,
  };
};

// Exporter le modèle
module.exports = mongoose.model('Commande', commandeSchema);