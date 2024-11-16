const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    name: { 
        type: String,
        trim: true,
        unique: true,
        required: [true, 'name required'],
        
    },
    slug: {
        type: String,
        lowercase: true,
      },
    price: { 
        type: Number, 
        required: true },
    description: { 
        type: String,
        required: [true, 'description required'],
        lowercase: true,
     },
    priceAfterDiscount: {
      type: Number,
    },
    sousCategories: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SousCategorie',
    },
    promotions: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion', default: null },
    imageCover: {
        type: String,
      },
    formats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Format' }],
    
  },
  {
    timestamps: true,
  });
  
// Mongoose query middleware
productSchema.pre(/^find/, function (next) {
    this.populate({
      path: 'sousCategories',
      // select: 'name ',
    })
    .populate({
        path: 'formats',
        populate: { path: 'tailles' }
      }) .populate({
        path: 'promotions'
      });
      
    next();
});
const setImageURL = (doc) => {
  if (doc.imageCover && !doc.imageCover.startsWith(process.env.BASE_URL)) {
    const imageUrl = `${process.env.BASE_URL}/products/${doc.imageCover}`;
    doc.imageCover = imageUrl;
  }
  if (doc.images) {
    const imagesList = [];
    doc.images.forEach((image) => {
      if (!image.startsWith(process.env.BASE_URL)) {
        const imageUrl = `${process.env.BASE_URL}/products/${image}`;
        imagesList.push(imageUrl);
      } else {
        imagesList.push(image); // If it's already a complete URL
      }
    });
    doc.images = imagesList;
  }
};
  // findOne, findAll and update
productSchema.post('init', (doc) => {
    setImageURL(doc);
  });
  
  productSchema.pre('save', function (next) {
    if (!this.slug) {
      this.slug = this.name.toLowerCase().replace(/ /g, '-');
    }
    next();
  });
  productSchema.post('save', (doc) => {
    setImageURL(doc);
  });

  const Product = mongoose.model('Product', productSchema);

module.exports = Product;