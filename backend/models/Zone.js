// backend/models/Zone.js
const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Zone name is required'],
        unique: true, // Zone names should be unique
        trim: true,
        maxlength: [50, 'Zone name cannot be more than 50 characters']
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

module.exports = mongoose.model('Zone', ZoneSchema);
