// backend/controllers/bookCatalogController.js
const BookCatalog = require('../models/BookCatalog');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// 1. Create a new Book Catalog
exports.createBookCatalog = catchAsync(async (req, res, next) => {
    const { bookName, publication, subtitle, language, bookType, commonPrice, pricesByClass, discountPercentage, gstPercentage, status } = req.body;

    // Basic validation
    if (!bookName || !publication || !bookType) {
        return next(new AppError('Book Name, Publication, and Book Type are required.', 400));
    }

    // Ensure commonPrice is provided if bookType is 'common_price'
    if (bookType === 'common_price' && (commonPrice === undefined || commonPrice === null || commonPrice < 0)) {
        return next(new AppError('Common Price is required and must be a non-negative number for "Common Price" type.', 400));
    }

    // Ensure pricesByClass is provided and not empty if bookType is 'default'
    if (bookType === 'default') {
        if (!pricesByClass || Object.keys(pricesByClass).length === 0) {
            return next(new AppError('At least one price for a class is required for "Default" book type.', 400));
        }
        // Validate each price in pricesByClass
        for (const classId in pricesByClass) {
            const price = pricesByClass[classId];
            if (price === undefined || price === null || isNaN(price) || price < 0) {
                return next(new AppError(`Price for class ${classId} is invalid. Must be a non-negative number.`, 400));
            }
        }
    }

    // Check for duplicate bookName, publication, and subtitle combination
    const existingBook = await BookCatalog.findOne({ bookName, publication, subtitle });
    if (existingBook) {
        return next(new AppError('A book with this name, publication, and subtitle already exists.', 409));
    }

    const newBookCatalog = await BookCatalog.create({
        bookName,
        publication,
        subtitle: subtitle === '' ? null : subtitle, // Store null if empty string
        language: language === '' ? null : language, // Store null if empty string
        bookType,
        commonPrice: bookType === 'common_price' ? commonPrice : undefined, // Only store if common_price
        pricesByClass: bookType === 'default' ? pricesByClass : undefined, // Only store if default
        discountPercentage,
        gstPercentage,
        status
    });

    res.status(201).json({
        status: 'success',
        data: {
            bookCatalog: newBookCatalog
        },
        message: 'Book Catalog created successfully!'
    });
});

// 2. Get all Book Catalogs
exports.getAllBookCatalogs = catchAsync(async (req, res, next) => {
    const bookCatalogs = await BookCatalog.find();

    res.status(200).json({
        status: 'success',
        results: bookCatalogs.length,
        data: {
            bookCatalogs
        }
    });
});

// 3. Get a single Book Catalog by ID
exports.getBookCatalog = catchAsync(async (req, res, next) => {
    const bookCatalog = await BookCatalog.findById(req.params.id);

    if (!bookCatalog) {
        return next(new AppError('No book catalog found with that ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            bookCatalog
        }
    });
});

// 4. Update a Book Catalog
exports.updateBookCatalog = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { bookName, publication, subtitle, language, bookType, commonPrice, pricesByClass, discountPercentage, gstPercentage, status } = req.body;

    // Fetch current book to check for duplicates if name, publication, or subtitle changes
    const currentBook = await BookCatalog.findById(id);
    if (!currentBook) {
        return next(new AppError('No book catalog found with that ID.', 404));
    }

    // Check for duplicate combination if bookName, publication, or subtitle is being changed
    if (
        (bookName && bookName !== currentBook.bookName) ||
        (publication && String(publication) !== String(currentBook.publication)) ||
        (subtitle && String(subtitle) !== String(currentBook.subtitle))
    ) {
        const existingBook = await BookCatalog.findOne({
            bookName: bookName || currentBook.bookName,
            publication: publication || currentBook.publication,
            subtitle: subtitle || currentBook.subtitle,
            _id: { $ne: id } // Exclude the current book being updated
        });

        if (existingBook) {
            return next(new AppError('A book with this name, publication, and subtitle already exists.', 409));
        }
    }

    // Prepare update object based on bookType
    let updateFields = {
        bookName,
        publication,
        subtitle: subtitle === '' ? null : subtitle,
        language: language === '' ? null : language,
        bookType,
        discountPercentage,
        gstPercentage,
        status
    };

    if (bookType === 'common_price') {
        updateFields.commonPrice = commonPrice;
        updateFields.pricesByClass = undefined; // Remove pricesByClass if switching to common_price
    } else { // default
        updateFields.pricesByClass = pricesByClass;
        updateFields.commonPrice = undefined; // Remove commonPrice if switching to default
    }

    // Run validation for pricesByClass if bookType is 'default'
    if (bookType === 'default') {
        if (!pricesByClass || Object.keys(pricesByClass).length === 0) {
            return next(new AppError('At least one price for a class is required for "Default" book type.', 400));
        }
        for (const classId in pricesByClass) {
            const price = pricesByClass[classId];
            if (price === undefined || price === null || isNaN(price) || price < 0) {
                return next(new AppError(`Price for class ${classId} is invalid. Must be a non-negative number.`, 400));
            }
        }
    } else if (bookType === 'common_price' && (commonPrice === undefined || commonPrice === null || commonPrice < 0)) {
         return next(new AppError('Common Price is required and must be a non-negative number for "Common Price" type.', 400));
    }


    const updatedBookCatalog = await BookCatalog.findByIdAndUpdate(id, updateFields, {
        new: true,
        runValidators: true,
        context: 'query'
    });

    if (!updatedBookCatalog) {
        return next(new AppError('No book catalog found with that ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            bookCatalog: updatedBookCatalog
        },
        message: 'Book Catalog updated successfully!'
    });
});

// 5. Delete a Book Catalog
exports.deleteBookCatalog = catchAsync(async (req, res, next) => {
    const bookCatalog = await BookCatalog.findByIdAndDelete(req.params.id);

    if (!bookCatalog) {
        return next(new AppError('No book catalog found with that ID.', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null,
        message: 'Book Catalog deleted successfully!'
    });
});
