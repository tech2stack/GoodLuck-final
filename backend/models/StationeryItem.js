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
    // NEW: Add a category field to store the item's category
    category: {
        type: String,
        required: [true, 'Category is required for the stationery item'],
        enum: ['Notebooks', 'Covers', 'Plastic Items', 'Bags', 'School kit', 'Other Stationery'] // Restrict to these specific values
    },
    price: {
        type: Number,
        required: [true, 'Price is required for the stationery item'],
        min: [0, 'Price cannot be negative']
    },
    // NEW: Add a margin percentage field
    marginPercentage: {
        type: Number,
        required: [true, 'Margin percentage is required'],
        min: [0, 'Margin cannot be negative'],
        max: [100, 'Margin cannot exceed 100']
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