// backend/models/StationeryItem.js
const mongoose = require('mongoose');

const stationeryItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: [true, 'Stationery item name is required'],
        unique: true, // Item names should be unique
        trim: true,
        maxlength: [200, 'Stationery item name cannot exceed 200 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required for the stationery item'],
        min: [0, 'Price cannot be negative']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const StationeryItem = mongoose.model('StationeryItem', stationeryItemSchema);

module.exports = StationeryItem;
