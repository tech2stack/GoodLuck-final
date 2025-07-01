// backend/controllers/bookCatalogController.js
const BookCatalog = require('../models/BookCatalog');
const Publication = require('../models/Publication'); // For validation if needed
const PublicationSubtitle = require('../models/PublicationSubtitle'); // For validation if needed
const Language = require('../models/Language'); // For validation if needed
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures'); // For filtering, sorting, pagination

// --- Helper for validation and data processing ---
const validateAndProcessBookData = async (data, isUpdate = false) => {
    const { name, publication, subtitle, language, bookType, commonPrice, pricesByClass, discountPercentage, gstPercentage, status } = data;

    if (!name || !publication || !bookType) {
        throw new AppError('Book name, publication, and book type are required.', 400);
    }

    // Validate Publication existence
    const existingPublication = await Publication.findById(publication);
    if (!existingPublication) {
        throw new AppError('Invalid Publication ID provided.', 400);
    }

    // Validate Subtitle existence if provided
    if (subtitle) {
        const existingSubtitle = await PublicationSubtitle.findById(subtitle);
        if (!existingSubtitle) {
            throw new AppError('Invalid Subtitle ID provided.', 400);
        }
        // Ensure subtitle belongs to the selected publication using .equals() for robustness
        // The 'publication' field in existingSubtitle is an ObjectId
        // The 'publication' from data is also an ObjectId (Mongoose casts it)
        if (!existingSubtitle.publication.equals(publication)) { // FIX: Use .equals() for ObjectId comparison
             throw new AppError('Selected subtitle does not belong to the chosen publication.', 400);
        }
    }

    // Validate Language existence if provided
    if (language) {
        const existingLanguage = await Language.findById(language);
        if (!existingLanguage) {
            throw new AppError('Invalid Language ID provided.', 400);
        }
    }

    const processedData = {
        name,
        publication,
        subtitle: subtitle || null, // Ensure null if not provided
        language: language || null, // Ensure null if not provided
        bookType,
        discountPercentage: discountPercentage !== undefined ? discountPercentage : 0,
        gstPercentage: gstPercentage !== undefined ? gstPercentage : 0,
        status: status || 'active'
    };

    if (bookType === 'common_price') {
        if (commonPrice === undefined || commonPrice === null) {
            throw new AppError('Common price is required for common_price book type.', 400);
        }
        if (commonPrice < 0) {
            throw new AppError('Common price cannot be negative.', 400);
        }
        processedData.commonPrice = commonPrice;
        processedData.pricesByClass = undefined; // Ensure pricesByClass is not set
    } else { // bookType === 'default'
        if (!pricesByClass || Object.keys(pricesByClass).length === 0) {
            throw new AppError('At least one price for a class is required for default book type.', 400);
        }
        // Validate prices in pricesByClass map
        for (const key in pricesByClass) {
            const price = pricesByClass[key];
            if (typeof price !== 'number' || price < 0) {
                throw new AppError(`Invalid price for class "${key}". Prices must be non-negative numbers.`, 400);
            }
        }
        processedData.pricesByClass = pricesByClass;
        processedData.commonPrice = undefined; // Ensure commonPrice is not set
    }

    return processedData;
};


// --- CRUD Operations for BookCatalog ---

// Create a new BookCatalog entry
exports.createBookCatalog = catchAsync(async (req, res, next) => {
    const processedData = await validateAndProcessBookData(req.body);

    const newBookCatalog = await BookCatalog.create(processedData);

    res.status(201).json({
        status: 'success',
        data: {
            bookCatalog: newBookCatalog
        },
        message: 'Book Catalog entry created successfully!'
    });
});

// Get all BookCatalog entries (with filtering, sorting, pagination)
exports.getAllBookCatalogs = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(BookCatalog.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const bookCatalogs = await features.query;

    // To get total count for pagination metadata
    const totalCount = await BookCatalog.countDocuments(features.filterQuery);

    res.status(200).json({
        status: 'success',
        results: bookCatalogs.length,
        data: {
            bookCatalogs
        },
        totalCount // Include total count for frontend pagination
    });
});

// Get a single BookCatalog entry by ID
exports.getBookCatalog = catchAsync(async (req, res, next) => {
    const bookCatalog = await BookCatalog.findById(req.params.id);

    if (!bookCatalog) {
        return next(new AppError('No book catalog entry found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            bookCatalog
        }
    });
});

// Update a BookCatalog entry by ID
exports.updateBookCatalog = catchAsync(async (req, res, next) => {
    const processedData = await validateAndProcessBookData(req.body, true);

    const updatedBookCatalog = await BookCatalog.findByIdAndUpdate(req.params.id, processedData, {
        new: true, // Return the updated document
        runValidators: true // Run schema validators on update
    });

    if (!updatedBookCatalog) {
        return next(new AppError('No book catalog entry found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            bookCatalog: updatedBookCatalog
        },
        message: 'Book Catalog entry updated successfully!'
    });
});

// Delete a BookCatalog entry by ID
exports.deleteBookCatalog = catchAsync(async (req, res, next) => {
    const bookCatalog = await BookCatalog.findByIdAndDelete(req.params.id);

    if (!bookCatalog) {
        return next(new AppError('No book catalog entry found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Book Catalog entry deleted successfully!'
    });
});
