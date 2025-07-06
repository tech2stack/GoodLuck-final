const Publication = require('../models/Publication');
const PublicationSubtitle = require('../models/PublicationSubtitle'); // For deleting subtitles
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// --- CRUD Operations for Publications ---

// Create a new Publication
exports.createPublication = catchAsync(async (req, res, next) => {
    const newPublication = await Publication.create(req.body);

    // Populate city field after creation (optional)
    const populatedPublication = await Publication.findById(newPublication._id);

    res.status(201).json({
        status: 'success',
        data: {
            publication: populatedPublication
        },
        message: 'Publication created successfully!'
    });
});

// Get all Publications with filtering, sorting, pagination & subtitles
exports.getAllPublications = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(
        Publication.find().populate({
            path: 'subtitles',
            select: 'name'
        }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const publications = await features.query;

    const totalCount = await Publication.countDocuments(features.filterQuery);

    res.status(200).json({
        status: 'success',
        results: publications.length,
        data: {
            publications
        },
        totalCount
    });
});

// Get a single Publication by ID
exports.getPublication = catchAsync(async (req, res, next) => {
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
        new: true,
        runValidators: true
    });

    if (!publication) {
        return next(new AppError('No publication found with that ID', 404));
    }

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

    await PublicationSubtitle.deleteMany({ publication: req.params.id });

    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Publication deleted successfully!'
    });
});
