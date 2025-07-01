// backend/models/BookCatalog.js
const mongoose = require('mongoose');

const BookCatalogSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Book name is required'],
        trim: true,
        maxlength: [200, 'Book name cannot exceed 200 characters']
    },
    publication: {
        type: mongoose.Schema.ObjectId,
        ref: 'Publication', // Reference to the Publication model
        required: [true, 'Publication is required']
    },
    subtitle: {
        type: mongoose.Schema.ObjectId,
        ref: 'PublicationSubtitle', // Reference to the PublicationSubtitle model (optional)
        default: null // Can be null if no specific subtitle is selected
    },
    language: {
        type: mongoose.Schema.ObjectId,
        ref: 'Language', // Reference to the Language model (Elective)
        default: null // Can be null if no specific language is selected
    },
    bookType: {
        type: String,
        enum: ['default', 'common_price'], // 'default' for individual prices, 'common_price' for one price
        required: [true, 'Book type is required'],
        default: 'default'
    },
    commonPrice: {
        type: Number,
        min: [0, 'Common price cannot be negative'],
        default: 0,
        // Required only if bookType is 'common_price'
        required: function() {
            return this.bookType === 'common_price';
        }
    },
    // Using a Mixed type for dynamic class prices.
    // It's generally better to define a strict schema if possible,
    // but for dynamic keys like class names, Mixed is an option.
    // A better approach for strictness would be an array of objects:
    // pricesByClass: [{ class: String, price: Number }]
    // For now, we'll use a Map to match the dynamic keys.
    pricesByClass: {
        type: Map,
        of: Number, // Values in the map will be Numbers
        default: {},
        // Required only if bookType is 'default'
        required: function() {
            return this.bookType === 'default';
        },
        validate: {
            validator: function(v) {
                // If bookType is 'default', ensure at least one price is provided
                if (this.bookType === 'default') {
                    return Object.keys(v).length > 0;
                }
                return true;
            },
            message: 'At least one price is required for default book type.'
        }
    },
    discountPercentage: {
        type: Number,
        min: [0, 'Discount percentage cannot be negative'],
        max: [100, 'Discount percentage cannot exceed 100'],
        default: 0
    },
    gstPercentage: {
        type: Number,
        min: [0, 'GST percentage cannot be negative'],
        max: [100, 'GST percentage cannot exceed 100'],
        default: 0
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

// Pre-find hook to populate referenced fields
BookCatalogSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'publication',
        select: 'name' // Only get the name of the publication
    })
    .populate({
        path: 'subtitle',
        select: 'name' // Only get the name of the subtitle
    })
    .populate({
        path: 'language',
        select: 'name' // Only get the name of the language
    });
    next();
});

// Add a unique compound index for name, publication, and subtitle to prevent duplicates
// This ensures a book with the same name and subtitle cannot exist under the same publication.
BookCatalogSchema.index({ name: 1, publication: 1, subtitle: 1 }, { unique: true });


const BookCatalog = mongoose.model('BookCatalog', BookCatalogSchema);

module.exports = BookCatalog;
