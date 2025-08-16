// BookCatalog.js
const mongoose = require('mongoose');

const BookCatalogSchema = new mongoose.Schema({
  bookName: {
    type: String,
    required: [true, 'Book name is required'],
    trim: true,
    maxlength: [200, 'Book name cannot exceed 200 characters'],
  },
  publication: {
    type: mongoose.Schema.ObjectId,
    ref: 'Publication',
    required: [true, 'Publication is required'],
  },
  subtitle: {
    type: mongoose.Schema.ObjectId, // ref हटा दिया गया है
    default: null,
  },
  language: {
    type: mongoose.Schema.ObjectId,
    ref: 'Language',
    default: null,
  },
  bookType: {
    type: String,
    enum: ['default', 'common_price'],
    required: [true, 'Book type is required'],
    default: 'default',
  },
  commonPrice: {
    type: Number,
    min: [0, 'Common price cannot be negative'],
    default: 0,
    required: function() {
      return this.bookType === 'common_price';
    }
  },
  commonIsbn: {
    type: String,
    trim: true,
    required: function() {
      return this.bookType === 'common_price';
    }
  },
  pricesByClass: {
    type: Map,
    of: Number,
    default: {},
    required: function() {
      return this.bookType === 'default';
    },
    validate: {
      validator: function(v) {
        if (this.bookType === 'default') {
          return (v instanceof Map ? v.size > 0 : Object.keys(v || {}).length > 0);
        }
        return true;
      },
      message: 'At least one price is required for default book type.',
    }
  },
  isbnByClass: {
    type: Map,
    of: String,
    default: {},
    required: function() {
      return this.bookType === 'default';
    },
    validate: {
      validator: function(v) {
        if (this.bookType === 'default') {
          return (v instanceof Map ? v.size > 0 : Object.keys(v || {}).length > 0);
        }
        return true;
      },
      message: 'At least one ISBN is required for default book type.',
    }
  },
  gstPercentage: {
    type: Number,
    min: [0, 'GST percentage cannot be negative'],
    max: [100, 'GST percentage cannot exceed 100'],
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

BookCatalogSchema.index({ bookName: 1, publication: 1, subtitle: 1 }, { unique: true });

module.exports = mongoose.model('BookCatalog', BookCatalogSchema);