// backend/models/Class.js
const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Class name is required'],
        unique: true, // Class names should be unique
        trim: true,
        maxlength: [50, 'Class name cannot be more than 50 characters']
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

module.exports = mongoose.model('Class', ClassSchema);
