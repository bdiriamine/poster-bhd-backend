const mongoose = require('mongoose');
const Taille = require('./tailleModel'); // Ensure this import points to your Taille model

const formatSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Type is required'],
  },
  tailles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Taille',
  }],
});


const Format = mongoose.model('Format', formatSchema);

module.exports = Format;