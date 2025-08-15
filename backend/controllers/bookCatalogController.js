// backend/controllers/bookCatalogController.js

const BookCatalog = require('../models/BookCatalog');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Create a new Book Catalog
exports.createBookCatalog = catchAsync(async (req, res, next) => {
  const {
    bookName, publication, subtitle, language, bookType,
    commonPrice, pricesByClass, commonIsbn, isbnByClass,
    discountPercentage, gstPercentage, status
  } = req.body;

  if (!bookName || !publication || !bookType) {
    return next(new AppError('Book Name, Publication, and Book Type are required.', 400));
  }

  if (bookType === 'common_price') {
    if (commonPrice === undefined || commonPrice < 0) {
      return next(new AppError('Common Price must be a non-negative number.', 400));
    }
    if (!commonIsbn || !commonIsbn.trim()) {
      return next(new AppError('Common ISBN is required.', 400));
    }
  } else {
    if (!pricesByClass || Object.keys(pricesByClass).length === 0) {
      return next(new AppError('At least one class price is required.', 400));
    }
    if (!isbnByClass || Object.keys(isbnByClass).length === 0) {
      return next(new AppError('At least one class ISBN is required.', 400));
    }
  }

  // Check duplicate bookName+publication+subtitle
  const existingBook = await BookCatalog.findOne({ bookName, publication, subtitle });
  if (existingBook) {
    return next(new AppError('A book with this name, publication, and subtitle already exists.', 409));
  }

  const newBookCatalog = await BookCatalog.create({
    bookName,
    publication,
    subtitle: subtitle === '' ? null : subtitle,
    language: language === '' ? null : language,
    bookType,
    commonPrice: bookType === 'common_price' ? commonPrice : undefined,
    pricesByClass: bookType === 'default' ? pricesByClass : undefined,
    commonIsbn: bookType === 'common_price' ? commonIsbn : undefined,
    isbnByClass: bookType === 'default' ? isbnByClass : undefined,
    discountPercentage,
    gstPercentage,
    status,
  });

  res.status(201).json({
    status: 'success',
    data: { bookCatalog: newBookCatalog },
    message: 'Book Catalog created successfully!',
  });
});

// Get all Book Catalogs
exports.getAllBookCatalogs = catchAsync(async (req, res, next) => {
  const bookCatalogs = await BookCatalog.find();
  res.status(200).json({
    status: 'success',
    results: bookCatalogs.length,
    data: { bookCatalogs }
  });
});

// Get a single Book Catalog by ID
exports.getBookCatalog = catchAsync(async (req, res, next) => {
  const bookCatalog = await BookCatalog.findById(req.params.id);
  if (!bookCatalog) {
    return next(new AppError('No book catalog found with that ID.', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { bookCatalog }
  });
});

// Update a Book Catalog
exports.updateBookCatalog = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    bookName, publication, subtitle, language, bookType,
    commonPrice, pricesByClass, commonIsbn, isbnByClass,
    discountPercentage, gstPercentage, status
  } = req.body;

  const currentBook = await BookCatalog.findById(id);
  if (!currentBook) {
    return next(new AppError('No book catalog found with that ID.', 404));
  }

  if (
    (bookName && bookName !== currentBook.bookName) ||
    (publication && String(publication) !== String(currentBook.publication)) ||
    (subtitle && String(subtitle) !== String(currentBook.subtitle))
  ) {
    const exist = await BookCatalog.findOne({
      bookName: bookName || currentBook.bookName,
      publication: publication || currentBook.publication,
      subtitle: subtitle || currentBook.subtitle,
      _id: { $ne: id }
    });
    if (exist) {
      return next(new AppError('A book with this name, publication, and subtitle already exists.', 409));
    }
  }

  let updateFields = {
    bookName,
    publication,
    subtitle: subtitle === '' ? null : subtitle,
    language: language === '' ? null : language,
    bookType,
    discountPercentage,
    gstPercentage,
    status,
  };

  if (bookType === 'common_price') {
    updateFields.commonPrice = commonPrice;
    updateFields.commonIsbn = commonIsbn;
    updateFields.pricesByClass = undefined;
    updateFields.isbnByClass = undefined;

    if (!commonIsbn || !commonIsbn.trim()) {
      return next(new AppError('Common ISBN is required.', 400));
    }
  } else {
    updateFields.pricesByClass = pricesByClass;
    updateFields.isbnByClass = isbnByClass;
    updateFields.commonPrice = undefined;
    updateFields.commonIsbn = undefined;

    if (!pricesByClass || Object.keys(pricesByClass).length === 0) {
      return next(new AppError('At least one price is required.', 400));
    }
    if (!isbnByClass || Object.keys(isbnByClass).length === 0) {
      return next(new AppError('At least one ISBN is required.', 400));
    }
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
    data: { bookCatalog: updatedBookCatalog },
    message: 'Book Catalog updated successfully!',
  });
});

// Delete a Book Catalog
exports.deleteBookCatalog = catchAsync(async (req, res, next) => {
  const bookCatalog = await BookCatalog.findByIdAndDelete(req.params.id);
  if (!bookCatalog) {
    return next(new AppError('No book catalog found with that ID.', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
    message: 'Book Catalog deleted successfully!',
  });
});
