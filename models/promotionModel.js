const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Promotion name is required'],
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
  tailles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Taille', // Reference to the SubCategory model
  }],
}, { timestamps: true });


promotionSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
      return next(new Error('End date must be after start date'));
  }
  next();
});
const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;