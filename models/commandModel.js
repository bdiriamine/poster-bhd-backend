const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema({
  dateCommande: { type: Date, default: Date.now }, // Date de la commande
  etatLivraison: {
    type: String,
    required: true,
    enum: [
      'En attente',             // Pending
      'En préparation',         // In preparation
      'Expédiée',               // Shipped
      'En transit',             // In transit
      'Prise en charge par le livreur', // Picked up by courier
      'Livrée',                 // Delivered
      'Échec de livraison',     // Delivery failed
      'Retournée',              // Returned
      'Annulée',                // Cancelled
    ],
    default: 'En attente', // État par défaut de la livraison
  },
  prixTaxe: {
    type: Number,
    default: 7, // Prix de la taxe par défaut
  },
  codeSuivi: { type: String }, // Code de suivi de la livraison
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Référence à l'utilisateur
  typeMethodePaiement: {
    type: String,
    enum: ['Carte', 'Espèces'], // Options de méthode de paiement
    default: 'Espèces', // Méthode de paiement par défaut
  },
  estPaye: {
    type: Boolean,
    default: false, // Par défaut non payé
  },
  prixTotal: {
    type: Number, // Prix total de la commande
    required: true,
  },
  livraison: { type: mongoose.Schema.Types.ObjectId, ref: 'Livraison' }, // Référence à la livraison
  panier: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the Product model
        required: true, // Make it required
      },
      tailles: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taille', // Reference to the Taille model
   
      },
      quantite: {
        type: Number,
        required: true, // Make it required
        default: 1, // Default quantity is 1
      },
      totalPrice: {
        type: Number,
        required: true, // Make it required
      },
      images: {
        type: [String], // This allows for an array of base64 image strings
      },
    }
  ], // Référence au panier de l'utilisateur
  adresseLivraison: {
    details: String, // Détails de l'adresse
    telephone: String, // Numéro de téléphone
    ville: String, // Ville
    codePostal: String, // Code postal
  },
  livreLe: Date, // Date de livraison
});

module.exports = mongoose.model('Commande', commandeSchema);