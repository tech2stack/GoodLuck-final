// backend/controllers/summaryController.js

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Import all models for which you need summary counts
const Class = require('../models/Class');
const Zone = require('../models/Zone');
const City = require('../models/City');
const Publication = require('../models/Publication');
const Language = require('../models/Language');
const BookCatalog = require('../models/BookCatalog');
const StationeryItem = require('../models/StationeryItem');
const Customer = require('../models/Customer');
const Transport = require('../models/Transport'); // <--- NEW: Import Transport model

// Helper function to get count for a given model
const getCount = async (Model) => {
    return await Model.countDocuments();
};

// Get count of all Classes
exports.getClassesCount = catchAsync(async (req, res, next) => {
    const count = await getCount(Class);
    res.status(200).json({
        status: 'success',
        data: {
            count
        }
    });
});

// Get count of all Zones
exports.getZonesCount = catchAsync(async (req, res, next) => {
    const count = await getCount(Zone);
    res.status(200).json({
        status: 'success',
        data: {
            count
        }
    });
});

// Get count of all Cities
exports.getCitiesCount = catchAsync(async (req, res, next) => {
    const count = await getCount(City);
    res.status(200).json({
        status: 'success',
        data: {
            count
        }
    });
});

// Get count of all Publications
exports.getPublicationsCount = catchAsync(async (req, res, next) => {
    const count = await getCount(Publication);
    res.status(200).json({
        status: 'success',
        data: {
            count
        }
    });
});

// Get count of all Languages
exports.getLanguagesCount = catchAsync(async (req, res, next) => {
    const count = await getCount(Language);
    res.status(200).json({
        status: 'success',
        data: {
            count
        }
    });
});

// Get count of all Book Catalogs
exports.getBookCatalogsCount = catchAsync(async (req, res, next) => {
    const count = await getCount(BookCatalog);
    res.status(200).json({
        status: 'success',
        data: {
            count
        }
    });
});

// Get count of all Stationery Items
exports.getStationeryItemsCount = catchAsync(async (req, res, next) => {
    const count = await getCount(StationeryItem);
    res.status(200).json({
        status: 'success',
        data: {
            count
        }
    });
});

// Get count of all Customers
exports.getCustomersCount = catchAsync(async (req, res, next) => {
    const count = await getCount(Customer);
    res.status(200).json({
        status: 'success',
        data: {
            count
        }
    });
});

// <--- NEW: Get count of all Transports
exports.getTransportsCount = catchAsync(async (req, res, next) => {
    const count = await getCount(Transport);
    res.status(200).json({
        status: 'success',
        data: {
            count
        }
    });
});
