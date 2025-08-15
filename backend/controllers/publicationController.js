// controllers/publicationController.js
const Publication = require('../models/Publication');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// --- CRUD Operations for Publications ---

// Create a new Publication
exports.createPublication = catchAsync(async (req, res, next) => {
    // Remove discount from req.body to prevent it from being saved
    const { discount, ...newPublicationData } = req.body;
    const newPublication = await Publication.create(newPublicationData);

    // Populate city field after creation
    const populatedPublication = await Publication.findById(newPublication._id).populate({
        path: 'city',
        select: 'name'
    });

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
            path: 'city',
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
        path: 'city',
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
    // Remove discount from req.body before updating
    const { discount, ...updateData } = req.body;
    const publication = await Publication.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
    });

    if (!publication) {
        return next(new AppError('No publication found with that ID', 404));
    }

    const populatedPublication = await Publication.findById(publication._id).populate({
        path: 'city',
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

    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Publication deleted successfully!'
    });
});

// NEW FUNCTIONS FOR SUBTITLES
// Add a new subtitle to a publication
exports.addSubtitleToPublication = catchAsync(async (req, res, next) => {
    const publication = await Publication.findById(req.params.id);

    if (!publication) {
        return next(new AppError('No publication found with that ID', 404));
    }

    const { name, discount } = req.body;

    // Check for duplicate subtitle name within the same publication
    const isDuplicate = publication.subtitles.some(subtitle => subtitle.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
        return next(new AppError('A subtitle with this name already exists for this publication.', 400));
    }

    publication.subtitles.push({ name, discount });
    await publication.save();

    const newlyAddedSubtitle = publication.subtitles[publication.subtitles.length - 1];

    res.status(201).json({
        status: 'success',
        data: {
            subtitle: newlyAddedSubtitle
        },
        message: 'Subtitle added successfully!'
    });
});

// Update a specific subtitle from a publication
exports.updateSubtitleFromPublication = catchAsync(async (req, res, next) => {
    const { subtitleId } = req.params;
    const { name, discount } = req.body;

    const publication = await Publication.findOne({ 'subtitles._id': subtitleId });

    if (!publication) {
        return next(new AppError('No publication or subtitle found with that ID', 404));
    }

    const subtitle = publication.subtitles.id(subtitleId);

    if (!subtitle) {
        return next(new AppError('Subtitle not found!', 404));
    }

    // Update the subtitle fields
    subtitle.name = name;
    subtitle.discount = discount;

    await publication.save();

    res.status(200).json({
        status: 'success',
        data: {
            subtitle
        },
        message: 'Subtitle updated successfully!'
    });
});

// Delete a specific subtitle from a publication
exports.deleteSubtitleFromPublication = catchAsync(async (req, res, next) => {
    const { subtitleId } = req.params;

    const publication = await Publication.findOne({ 'subtitles._id': subtitleId });

    if (!publication) {
        return next(new AppError('No publication or subtitle found with that ID', 404));
    }

    publication.subtitles.pull({ _id: subtitleId });
    await publication.save();

    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Subtitle removed successfully!'
    });
});