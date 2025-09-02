const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Publication name is required'],
        unique: true,
        trim: true,
        maxlength: [100, 'Publication name cannot exceed 100 characters']
    },
    personName: {
        type: String,
        trim: true,
        maxlength: [100, 'Person name cannot exceed 100 characters']
    },
    city: {
        type: String,
        trim: true,
        maxlength: [10, 'City cannot exceed 10 characters'],
        default: ''
    },
    mobileNumber: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                // The validator function now allows the field to be empty or null
                return !v || /^\d{10,15}$/.test(v);
            },
            message: props => `${props.value} is not a valid mobile number! (10-15 digits)`
        }
    },
    bank: {
        type: String,
        trim: true,
        maxlength: [100, 'Bank name cannot exceed 100 characters'],
        default: ''
    },
    accountNumber: {
        type: String,
        trim: true,
        maxlength: [50, 'Account number cannot exceed 50 characters'],
        default: ''
    },
    ifsc: {
        type: String,
        trim: true,
        maxlength: [50, 'IFSC code cannot exceed 50 characters'],
        default: ''
    },
    gstin: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                // The validator function now allows the field to be empty or null
                return !v || /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$/.test(v);
            },
            message: props => `${props.value} is not a valid GSTIN format!`
        },
        default: ''
    },
    address: {
        type: String,
        trim: true,
        maxlength: [500, 'Address cannot exceed 500 characters']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    publicationType: {
        type: String,
        enum: ['Private Pub', 'Govt. Pub', 'Other Pub'],
        default: 'Private Pub'
    },
    subtitles: [{
        name: {
            type: String,
            required: [true, 'Subtitle name is required'],
            trim: true,
            maxlength: [100, 'Subtitle name cannot exceed 100 characters']
        },
        discount: {
            type: Number,
            min: [0, 'Discount cannot be negative'],
            max: [100, 'Discount cannot exceed 100%'],
            default: 0
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Publication = mongoose.model('Publication', publicationSchema);

module.exports = Publication;