const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    name: { 
        type: String,
        trim: true,
        required: [true, 'name required']
    },
    slug: {
        type: String,
        required: true,
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
    sousCategorie: { type: mongoose.Schema.Types.ObjectId, ref: 'SousCategorie' },
    promotions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' }],
    imageCover: {
        type: String,
        required: [true, 'Product Image cover is required'],
      },
    formats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Format' }],
    
  },
  {
    timestamps: true,
  });
  
// Mongoose query middleware
productSchema.pre(/^find/, function (next) {
    this.populate({
      path: 'sousCategorie',
      select: 'name -_id',
    })
    .populate({
        path: 'formats',
        populate: { path: 'tailles' }
      });
    next();
});
  const setImageURL = (doc) => {
    if (doc.imageCover) {
      const imageUrl = `${process.env.BASE_URL}/products/${doc.imageCover}`;
      doc.imageCover = imageUrl;
    }
  };
  // findOne, findAll and update
productSchema.post('init', (doc) => {
    setImageURL(doc);
  });
  
  // create
  productSchema.post('save', (doc) => {
    setImageURL(doc);
  });

  const Product = mongoose.model('Product', productSchema);

module.exports = Product;