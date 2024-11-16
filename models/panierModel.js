const mongoose = require('mongoose');

const panierSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true, // Make it required
  },
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
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

// Set image URL helper function
const setImageURL = (doc) => {
  if (doc.imageCover && !doc.imageCover.startsWith(process.env.BASE_URL)) {
    const imageUrl = `${process.env.BASE_URL}/command/${doc.imageCover}`;
    doc.imageCover = imageUrl;
  }
  if (doc.images) {
    const imagesList = [];
    doc.images.forEach((image) => {
      if (!image.startsWith(process.env.BASE_URL)) {
        const imageUrl = `${process.env.BASE_URL}/command/${image}`;
        imagesList.push(imageUrl);
      } else {
        imagesList.push(image); // If it's already a complete URL
      }
    });
    doc.images = imagesList;
  }
};

// Export the Panier model
const Panier = mongoose.model('Panier', panierSchema);

module.exports = Panier;