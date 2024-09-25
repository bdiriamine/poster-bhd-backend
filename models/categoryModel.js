const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category required'],
    unique: [true, 'Category must be unique'],
    minlength: [3, 'Too short category name'],
    maxlength: [32, 'Too long category name'],
  }, 
  slug: {
    type: String,
    lowercase: true,
  },
  sousCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SousCategorie' }], // Références aux sous-catégories
},
{ timestamps: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;