// backend/models/PublicationSubtitle.js
const mongoose = require('mongoose');

const publicationSubtitleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subtitle name is required'],
        trim: true,
        maxlength: [100, 'Subtitle name cannot exceed 100 characters']
    },
    publication: {
        type: mongoose.Schema.ObjectId,
        ref: 'Publication', // Reference to the parent Publication
        required: [true, 'Subtitle must belong to a Publication']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add a unique compound index to prevent duplicate subtitles for the same publication
publicationSubtitleSchema.index({ name: 1, publication: 1 }, { unique: true });

// Populate the publication field when finding subtitles
publicationSubtitleSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'publication',
        select: 'name' // Only select the name of the parent publication
    });
    next();
});

const PublicationSubtitle = mongoose.model('PublicationSubtitle', publicationSubtitleSchema);

module.exports = PublicationSubtitle;
