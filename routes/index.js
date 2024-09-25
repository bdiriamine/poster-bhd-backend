const userRoute = require('./userRoute');
const authRoute = require('./authRoute');
const categoryRoute = require('./categoryRoute');
const tailleRoute = require('./tailleRoute');
const formatRoute = require('./formatRoute');

// const paymentRoute = require('./paymentRoute');
// const deliveryRoute = require('./deliveryRoute');
// const commandRoute = require('./commandRoute');
// const promotionRoute = require('./promotionRoute');
const productRoute = require('./productRoute');
const subCategoryRoute = require('./subCategoryRoute');

const mountRoutes = (app) => {
app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/subcategories', subCategoryRoute);
app.use('/api/v1/tailles', tailleRoute);
app.use('/api/v1/formats', formatRoute);
// app.use('/api/v1/payment', paymentRoute);
// app.use('/api/v1/delivery', deliveryRoute);
// app.use('/api/v1/command', commandRoute);
// app.use('/api/v1/promotion', promotionRoute);
app.use('/api/v1/products', productRoute);





};

module.exports = mountRoutes;
