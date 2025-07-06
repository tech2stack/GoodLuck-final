// backend/models/BookCatalog.js
const mongoose = require('mongoose');

const BookCatalogSchema = new mongoose.Schema({
    bookName: { // Changed from 'name' to 'bookName' for consistency with frontend
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
    pricesByClass: {
        type: Map,
        of: Number, // Values in the map will be Numbers
        default: {}, // Ensure it defaults to an empty object/map
        // Required only if bookType is 'default'
        required: function() {
            return this.bookType === 'default';
        },
        validate: {
            validator: function(v) {
                // If bookType is 'default', ensure at least one price is provided
                if (this.bookType === 'default') {
                    // Check if it's a Map and has entries, or if it's a plain object with keys
                    if (v instanceof Map) {
                        return v.size > 0;
                    } else if (typeof v === 'object' && v !== null) {
                        return Object.keys(v).length > 0;
                    }
                    return false; // Not a Map or a valid object
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
}, {
    // Ensure virtuals are included when converting to JSON/Object
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual property for 'price' to simplify frontend consumption
BookCatalogSchema.virtual('price').get(function() {
    if (this.bookType === 'common_price') {
        return this.commonPrice;
    }
    // For 'default' type, return the first price found in pricesByClass or 0
    if (this.bookType === 'default' && this.pricesByClass) {
        let prices = [];
        if (this.pricesByClass instanceof Map) {
            prices = Array.from(this.pricesByClass.values());
        } else if (typeof this.pricesByClass === 'object' && this.pricesByClass !== null) {
            prices = Object.values(this.pricesByClass);
        }
        return prices.length > 0 ? prices[0] : 0; // Return the first price or 0
    }
    return 0; // Default to 0 if bookType is not common_price or pricesByClass is not valid
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

// Add a unique compound index for bookName, publication, and subtitle to prevent duplicates
BookCatalogSchema.index({ bookName: 1, publication: 1, subtitle: 1 }, { unique: true });


const BookCatalog = mongoose.model('BookCatalog', BookCatalogSchema);

module.exports = BookCatalog;
