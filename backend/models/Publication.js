// backend/models/Publication.js
const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Publication name is required'],
        unique: true, // Publication names should be unique
        trim: true,
        maxlength: [100, 'Publication name cannot exceed 100 characters']
    },
    personName: {
        type: String,
        required: [true, 'Person name is required'],
        trim: true,
        maxlength: [100, 'Person name cannot exceed 100 characters']
    },
    city: {
        type: mongoose.Schema.ObjectId,
        ref: 'City', // Reference to the City model
        required: [true, 'City is required']
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^\d{10,15}$/.test(v); // Basic phone number validation (10 to 15 digits)
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
        maxlength: [20, 'IFSC cannot exceed 20 characters'],
        default: ''
    },
    gstin: {
        type: String,
        trim: true,
        maxlength: [15, 'GSTIN cannot exceed 15 characters'],
        validate: {
            validator: function(v) {
                // Basic GSTIN format validation (15 alphanumeric characters)
                return v === '' || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
            },
            message: props => `${props.value} is not a valid GSTIN format!`
        },
        default: ''
    },
    discount: {
        type: Number,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%'],
        default: 0
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
        maxlength: [500, 'Address cannot exceed 500 characters']
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
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Populate the city field when finding publications
publicationSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'city',
        select: 'name' // Only select the name of the city
    });
    next();
});

// Virtual populate for subtitles
// This creates a virtual field 'subtitles' on Publication that references PublicationSubtitle
// 'PublicationSubtitle' is the model name for the child documents
// 'publication' is the field in the PublicationSubtitle model that refers to this Publication
// '_id' is the local field (Publication's _id) that matches the 'publication' field in PublicationSubtitle
publicationSchema.virtual('subtitles', {
    ref: 'PublicationSubtitle',
    localField: '_id',
    foreignField: 'publication',
    justOne: false // A publication can have multiple subtitles
});


const Publication = mongoose.model('Publication', publicationSchema);

module.exports = Publication;
