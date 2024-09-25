const mongoose = require('mongoose');

const livraisonSchema = new mongoose.Schema({
  typeLivraison: { type: String, required: [true, 'Type de livraison requis'] }, // e.g., standard, express
  frais: { type: Number, required: [true, 'Frais de livraison requis'] }, // Frais de livraison
  dateEstimee: { type: Date, required: [true, 'Date estimée requise'] }, // Date d'estimation de livraison
  adresse: {
    rue: { type: String, required: [true, 'Rue requise'] },
    codePostal: { type: String, required: [true, 'Code postal requis'] },
    ville: { type: String, required: [true, 'Ville requise'] },
    pays: { type: String, required: [true, 'Pays requis'] },
  },
  commande: { type: mongoose.Schema.Types.ObjectId, ref: 'Commande' }, // Référence à la commande associée
});

// Exporter le modèle
module.exports = mongoose.model('Livraison', livraisonSchema);