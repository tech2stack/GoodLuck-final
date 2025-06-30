// backend/models/Language.js
const mongoose = require('mongoose');

const LanguageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Language name is required'],
        unique: true, // Language names should be unique
        trim: true,
        maxlength: [50, 'Language name cannot be more than 50 characters']
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

module.exports = mongoose.model('Language', LanguageSchema);
