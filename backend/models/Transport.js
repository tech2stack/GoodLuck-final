// backend/models/Transport.js
const mongoose = require('mongoose');
const validator = require('validator'); // Import validator for optional mobile number validation

const transportSchema = new mongoose.Schema({
    transportName: {
        type: String,
        required: [true, 'Transport name is required.'], // Transport name is mandatory
        unique: true, // Transport name must be unique
        trim: true, // Trim whitespace from beginning and end
        maxlength: [100, 'Transport name cannot exceed 100 characters'],
        minlength: [3, 'Transport name must be at least 3 characters']
    },
    person: {
        type: String,
        // No 'required' or 'unique' constraint
        trim: true,
        maxlength: [100, 'Person name cannot exceed 100 characters'],
        default: null // Explicitly set default to null for optional fields
    },
    mobile: {
        type: String,
        // No 'required' or 'unique' constraint
        trim: true,
        // Optional validation: only validate if a value is provided and it's a 10-digit Indian number
        validate: {
            validator: function(val) {
                return val === null || val === '' || (validator.isMobilePhone(val, 'en-IN') && val.length === 10);
            },
            message: 'Please provide a valid 10-digit Indian mobile number if specified'
        },
        default: null
    },
    address: {
        type: String,
        // No 'required' or 'unique' constraint
        trim: true,
        maxlength: [200, 'Address cannot exceed 200 characters'],
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'on-hold'], // Status must be one of these values
        default: 'active', // Default value is 'active'
        // No 'required' constraint
    },
    createdAt: {
        type: Date,
        default: Date.now // Default to current date and time
    }
});

// Add indexes for faster queries, but only 'transportName' is unique
transportSchema.index({ transportName: 1 }, { unique: true });
transportSchema.index({ mobile: 1 }); // Index for mobile, but not unique
// You can add indexes for other fields if you frequently query by them, e.g.:
// transportSchema.index({ person: 1 });
// transportSchema.index({ address: 1 });

const Transport = mongoose.model('Transport', transportSchema);

module.exports = Transport;
