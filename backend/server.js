const mongoose = require('mongoose');
const dotenv = require('dotenv');

// --- Handle Uncaught Exceptions ---
// This should be at the very top of your server.js to catch sync errors
process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1); // Exit with failure code
});

// Load environment variables from the .env file
// dotenv.config() without a path argument will default to looking for '.env'
dotenv.config(); // <-- This is the crucial change!

const app = require('./app'); // Import your Express app setup from app.js

// MongoDB Connection
// Use MONGO_URI directly from process.env
const DB_URI = process.env.MONGO_URI; 

// Check if MONGO_URI is defined
if (!DB_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in your .env file!');
    process.exit(1);
}

mongoose.connect(DB_URI) // Connect using the MONGO_URI
  .then(() => console.log('DB connection successful! Connected to local MongoDB.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if DB connection fails
  });

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port} in ${process.env.NODE_ENV} mode`);
});

// --- Handle Unhandled Promise Rejections ---
// Catches async errors that are not handled by catchAsync
process.on('unhandledRejection', err => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message, err.stack);
    server.close(() => { // Close server gracefully
        process.exit(1); // Exit with failure code
    });
});

// For Render.com or other PaaS that might send SIGTERM
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        console.log('💥 Process terminated!');
    });
});