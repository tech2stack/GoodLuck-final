// backend/models/City.js
const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'City name is required'],
        unique: true, // City names should be unique
        trim: true,
        maxlength: [50, 'City name cannot be more than 50 characters']
    },
    zone: {
        type: mongoose.Schema.ObjectId, // Reference to the Zone model
        ref: 'Zone', // The model name that this ObjectId refers to
        required: [true, 'City must belong to a Zone']
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

// Add a pre-find hook to automatically populate the 'zone' field
CitySchema.pre(/^find/, function(next) {
    this.populate({
        path: 'zone',
        select: 'name' // Only select the 'name' field from the Zone
    });
    next();
});

module.exports = mongoose.model('City', CitySchema);
