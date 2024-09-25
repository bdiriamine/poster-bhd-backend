const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema({
  montant: { 
    type: Number, 
    required: [true, 'Montant requis'],
    min: [0, 'Le montant doit être positif'], // Assurez-vous que le montant est positif
  },
  datePaiement: { 
    type: Date, 
    default: Date.now,
  },
  mode: { 
    type: String, 
    required: [true, 'Mode de paiement requis'],
    enum: ['carte', 'PayPal', 'virement', 'autre'], // Limitez les modes de paiement
  },
  commande: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Commande', 
    required: true, // Assurez-vous qu'une commande est toujours associée
  },
});

// Exporter le modèle
module.exports = mongoose.model('Paiement', paiementSchema);