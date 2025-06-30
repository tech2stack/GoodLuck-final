// backend/controllers/publicationController.js
const Publication = require('../models/Publication');
const PublicationSubtitle = require('../models/PublicationSubtitle'); // Make sure this is imported for deleteMany
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// --- CRUD Operations for Publications ---

// Create a new Publication
exports.createPublication = catchAsync(async (req, res, next) => {
    const newPublication = await Publication.create(req.body);

    // Populate the city field after creation to return full object
    const populatedPublication = await Publication.findById(newPublication._id);

    res.status(201).json({
        status: 'success',
        data: {
            publication: populatedPublication
        },
        message: 'Publication created successfully!'
    });
});

// Get all Publications (with filtering, sorting, pagination, and virtual populate for subtitles)
exports.getAllPublications = catchAsync(async (req, res, next) => {
    // Build query with virtual populate for subtitles
    const features = new APIFeatures(
        Publication.find().populate({
            path: 'subtitles', // Populate the virtual 'subtitles' field
            select: 'name'    // Only get the name of the subtitle
        }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const publications = await features.query;

    // To get total count for pagination metadata (without virtual populate affecting count)
    const totalCount = await Publication.countDocuments(features.filterQuery);

    res.status(200).json({
        status: 'success',
        results: publications.length,
        data: {
            publications
        },
        totalCount // Include total count for frontend pagination
    });
});

// Get a single Publication by ID
exports.getPublication = catchAsync(async (req, res, next) => {
    // Also populate subtitles when getting a single publication
    const publication = await Publication.findById(req.params.id).populate({
        path: 'subtitles',
        select: 'name'
    });

    if (!publication) {
        return next(new AppError('No publication found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            publication
        }
    });
});

// Update a Publication by ID
exports.updatePublication = catchAsync(async (req, res, next) => {
    const publication = await Publication.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // Return the updated document
        runValidators: true // Run schema validators on update
    });

    if (!publication) {
        return next(new AppError('No publication found with that ID', 404));
    }

    // Populate the city and subtitles field after update to return full object
    const populatedPublication = await Publication.findById(publication._id).populate({
        path: 'subtitles',
        select: 'name'
    });

    res.status(200).json({
        status: 'success',
        data: {
            publication: populatedPublication
        },
        message: 'Publication updated successfully!'
    });
});

// Delete a Publication by ID
exports.deletePublication = catchAsync(async (req, res, next) => {
    const publication = await Publication.findByIdAndDelete(req.params.id);

    if (!publication) {
        return next(new AppError('No publication found with that ID', 404));
    }

    // Optionally, delete all associated subtitles when a publication is deleted
    // This is good practice for data integrity.
    await PublicationSubtitle.deleteMany({ publication: req.params.id });

    // 204 No Content for successful deletion
    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Publication deleted successfully!'
    });
});
