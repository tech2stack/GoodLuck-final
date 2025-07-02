// backend/routes/transportRoutes.js

const express = require('express');
const transportController = require('../controllers/transportController'); // Import the transport controller
// const authController = require('../controllers/authController'); // Assuming you have an authController for protecting routes

const router = express.Router();

// Protect all transport routes (uncomment if you have authentication)
// router.use(authController.protect); 

// Routes for creating a new transport and getting all transports
router
    .route('/')
    .post(transportController.createTransport) // POST request to create a new transport
    .get(transportController.getAllTransports); // GET request to fetch all transports

// Routes for specific transport operations by ID
router
    .route('/:id')
    .get(transportController.getTransport)    // GET request to fetch a single transport by ID
    .patch(transportController.updateTransport) // PATCH request to update a transport by ID
    .delete(transportController.deleteTransport); // DELETE request to delete a transport by ID

module.exports = router;
