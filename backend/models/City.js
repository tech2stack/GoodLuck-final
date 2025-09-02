// backend/models/City.js
const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'City name is required'],
        trim: true,
        maxlength: [50, 'City name cannot be more than 50 characters']
    },
    zone: {
        type: mongoose.Schema.ObjectId,
        ref: 'Zone',
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
    },
    assignedSalesRepresentative: {
        type: mongoose.Schema.ObjectId,
        ref: 'Employee',
        default: null
    }
});

CitySchema.pre(/^find/, function(next) {
    this.populate({
        path: 'zone',
        select: 'name'
    }).populate({
        path: 'assignedSalesRepresentative',
        select: 'name mobileNumber'
    });
    next();
});

module.exports = mongoose.model('City', CitySchema);