// backend/models/Transport.js
const mongoose = require('mongoose');

// Minimal placeholder schema for Transport
const TransportSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        default: 'Default Transport' // Temporary default
    },
    // You will define actual fields later
});

module.exports = mongoose.model('Transport', TransportSchema);
