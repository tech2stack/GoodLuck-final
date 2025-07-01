// backend/models/StationeryItem.js
const mongoose = require('mongoose');

const StationeryItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Stationery item name is required'],
        unique: true, // Stationery item names should be unique
        trim: true,
        maxlength: [100, 'Stationery item name cannot be more than 100 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        default: 0
    },
    status: { // Status field
        type: String,
        enum: ['active', 'inactive'], // Define allowed values for status
        default: 'active' // Default status is active
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('StationeryItem', StationeryItemSchema);
