// backend/models/Customer.js
const mongoose = require('mongoose');

// Minimal placeholder schema for Customer
const CustomerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        default: 'Default Customer' // Temporary default
    },
    // You will define actual fields later
});

module.exports = mongoose.model('Customer', CustomerSchema);
