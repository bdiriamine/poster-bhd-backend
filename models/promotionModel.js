const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Promotion name is required'],
    unique: true,
  },
  discountPercentage: {
    type: Number,
    required: [true, 'Discount percentage is required'],
    min: [0, 'Discount must be at least 0'],
    max: [100, 'Discount must be at most 100'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  produits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  tailles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taille' }],
}, { timestamps: true });

// Conditionally populate produits or tailles if they exist
promotionSchema.pre(/^find/, function (next) {
  if (this.produits && this.produits.length > 0) {
    this.populate({
      path: 'produits',
    });
  }

  if (this.tailles && this.tailles.length > 0) {
    this.populate({
      path: 'tailles',
    });
  }

  next();
});

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;