const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

dotenv.config({ path: 'config.env' });
const ApiError = require('./utils/apiError');
const globalError = require('./middlewares/errorMiddleware');
const dbConnection = require('./config/database');
// Routes
const mountRoutes = require('./routes');

// Connect with db
dbConnection();

// express app
const app = express();

// Trust proxy to handle the X-Forwarded-For header
app.set('trust proxy', true);

// CORS configuration
//production
const corsOptions = {
  origin: 'poster-bhd-front.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Referer',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'sec-ch-ua-platform',
    'User-Agent'
  ],
  credentials: true
};

// Enable CORS for all routes
// app.use(cors(corsOptions));

// // Handle preflight requests
// app.options('*', cors(corsOptions));


// mode dev
// Trust proxy to handle the X-Forwarded-For header
app.set('trust proxy', false);

// CORS configuration
//production
// const corsOptions = {
//   origin: 'https://poster-bhd-front-production.up.railway.app', // No trailing slash
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: [
//     'Content-Type',
//     'Authorization',
//     'Referer',
//     'sec-ch-ua',
//     'sec-ch-ua-mobile',
//     'sec-ch-ua-platform',
//     'User-Agent'
//   ],
//   credentials: true
// };
// mode dev
// const corsOptions = {
//   origin: 'http://localhost:3000', // No trailing slash
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: [
//     'Content-Type',
//     'Authorization',
//     'Referer',
//     'sec-ch-ua',
//     'sec-ch-ua-mobile',
//     'sec-ch-ua-platform',
//     'User-Agent'
//   ],
//   credentials: true
// };
app.use(cors(corsOptions));

// Compress all responses
app.use(compression());

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'uploads')));

// Logging in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`Mode: ${process.env.NODE_ENV}`);
}

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increase to allow more requests
  message: 'Too many requests from this IP, please try again later',
});

// Apply the rate limiting middleware to all requests
app.use('/api', limiter);

// Middleware to protect against HTTP Parameter Pollution attacks
// app.use(
//   hpp({
//     whitelist: [
//       'price',
//       'sold',
//       'quantity',
//       'ratingsAverage',
//       'ratingsQuantity',
//     ],
//   })
// );

// Mount Routes
mountRoutes(app);
app.use((req, res, next) => {
  req.setTimeout(5000); // Set timeout to 5 seconds (5000 ms)
  next();
});
// Catch all route handler
app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
});

// Global error handling middleware for express
app.use(globalError);

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});

// Handle rejection outside express
process.on('unhandledRejection', (err) => {
  console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error(`Shutting down....`);
    process.exit(1);
  });
});