const userRoute = require('./userRoute');
const authRoute = require('./authRoute');
const categoryRoute = require('./categoryRoute');
const tailleRoute = require('./tailleRoute');
const formatRoute = require('./formatRoute');
const CalendriePhotoRoute = require('./CalendriePhotoRoute');
const contactRoutes = require('./contactRoutes');
// const deliveryRoute = require('./deliveryRoute');
const commandRoute = require('./commandRoute');
const promotionRoutes = require('./promotionRoute');
const productRoute = require('./productRoute');
const subCategoryRoute = require('./subCategoryRoute');
const livrePhotoRoute = require('./livrePhotoRoute');
const CartesphotosRoute = require('./CartesphotosRoute');
const CadeauxPhotoRoutes = require('./cadeauxPhotoRoutes');
const cartRoute= require('./panierRoutes');
const tirageRoute= require('./tiragePhotoRoutes');
const mountRoutes = (app) => {
app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/subcategories', subCategoryRoute);
app.use('/api/v1/tailles', tailleRoute);
app.use('/api/v1/formats', formatRoute);
app.use('/api/v1/calendriePhoto', CalendriePhotoRoute);
app.use('/api/v1/cartesphotos', CartesphotosRoute);
app.use('/api/v1/cadeauxPhotos', CadeauxPhotoRoutes);
app.use('/api/v1/tirage', tirageRoute );

app.use('/api/v1/contact', contactRoutes);
// app.use('/api/v1/delivery', deliveryRoute);
app.use('/api/v1/command', commandRoute);
app.use('/api/v1/promotions', promotionRoutes);
app.use('/api/v1/products', productRoute);
app.use('/api/v1/livrephotos', livrePhotoRoute);
app.use('/api/v1/panier',cartRoute );




};

module.exports = mountRoutes;
