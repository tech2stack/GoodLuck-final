// backend/controllers/publicationSubtitleController.js
const PublicationSubtitle = require('../models/PublicationSubtitle');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// --- CRUD Operations for Publication Subtitles ---

// Create a new Publication Subtitle
exports.createPublicationSubtitle = catchAsync(async (req, res, next) => {
    // The publication ID should come from the URL parameter (nested route)
    // or directly in the body if not using nested routes.
    // For simplicity, let's assume it comes in req.body.publication for now,
    // or we can adjust for nested routes later.
    if (!req.body.publication) {
        req.body.publication = req.params.publicationId; // If using nested route /publications/:publicationId/subtitles
    }

    const newSubtitle = await PublicationSubtitle.create(req.body);

    // Populate the publication field after creation to return full object
    const populatedSubtitle = await PublicationSubtitle.findById(newSubtitle._id);

    res.status(201).json({
        status: 'success',
        data: {
            subtitle: populatedSubtitle
        },
        message: 'Subtitle added successfully!'
    });
});

// Get all Subtitles for a specific Publication
exports.getSubtitlesByPublication = catchAsync(async (req, res, next) => {
    const subtitles = await PublicationSubtitle.find({ publication: req.params.publicationId });

    res.status(200).json({
        status: 'success',
        results: subtitles.length,
        data: {
            subtitles
        }
    });
});

// Get a single Publication Subtitle by ID
exports.getPublicationSubtitle = catchAsync(async (req, res, next) => {
    const subtitle = await PublicationSubtitle.findById(req.params.id);

    if (!subtitle) {
        return next(new AppError('No subtitle found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            subtitle
        }
    });
});

// Update a Publication Subtitle by ID
exports.updatePublicationSubtitle = catchAsync(async (req, res, next) => {
    const subtitle = await PublicationSubtitle.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!subtitle) {
        return next(new AppError('No subtitle found with that ID', 404));
    }

    const populatedSubtitle = await PublicationSubtitle.findById(subtitle._id);

    res.status(200).json({
        status: 'success',
        data: {
            subtitle: populatedSubtitle
        },
        message: 'Subtitle updated successfully!'
    });
});

// Delete a Publication Subtitle by ID
exports.deletePublicationSubtitle = catchAsync(async (req, res, next) => {
    const subtitle = await PublicationSubtitle.findByIdAndDelete(req.params.id);

    if (!subtitle) {
        return next(new AppError('No subtitle found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Subtitle deleted successfully!'
    });
});
