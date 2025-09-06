const CustomerOrder = require('../models/CustomerOrder');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');
const Publication = require('../models/Publication');
const BookCatalog = require('../models/BookCatalog');
const Post = require('../models/Post');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'Uploads', 'customer-orders');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new AppError('Only JPEG/PNG images are allowed!', 400));
  },
}).single('orderImage');

exports.getCustomerTypes = catchAsync(async (req, res, next) => {
  const customerTypes = ['Dealer-Retail', 'Dealer-Supply', 'School-Retail', 'School-Supply', 'School-Both'];
  res.status(200).json({
    status: 'success',
    data: { customerTypes },
  });
});

exports.getCustomersByType = catchAsync(async (req, res, next) => {
  const { type } = req.params;
  if (!['Dealer-Retail', 'Dealer-Supply', 'School-Retail', 'School-Supply', 'School-Both'].includes(type)) {
    return next(new AppError('Invalid customer type', 400));
  }
  const customers = await Customer.find({ customerType: type })
    .select('customerName discount salesBy')
    .populate({
      path: 'salesBy',
      select: 'name',
    });
  res.status(200).json({
    status: 'success',
    results: customers.length,
    data: { customers },
  });
});

exports.getSalesRepresentatives = catchAsync(async (req, res, next) => {
  const post = await Post.findOne({ name: 'Sales Representative' });
  if (!post) {
    return next(new AppError('The "Sales Representative" post does not exist.', 404));
  }
  const employees = await Employee.find({ postId: post._id }).select('name mobileNumber postId');
  if (!employees || employees.length === 0) {
    return next(new AppError('No employees found for the role: Sales Representative', 404));
  }
  res.status(200).json({
    status: 'success',
    results: employees.length,
    data: { employees },
  });
});

exports.getAllEmployees = catchAsync(async (req, res, next) => {
  const employees = await Employee.find().select('name mobileNumber postId').populate('postId', 'name');
  if (!employees || employees.length === 0) {
    return next(new AppError('No employees found', 404));
  }
  res.status(200).json({
    status: 'success',
    results: employees.length,
    data: { employees },
  });
});

exports.getPublications = catchAsync(async (req, res, next) => {
  const publications = await Publication.find().select('name subtitles');
  res.status(200).json({
    status: 'success',
    results: publications.length,
    data: { publications },
  });
});

exports.getSubtitlesByPublication = catchAsync(async (req, res, next) => {
  const { publicationId } = req.params;
  const publication = await Publication.findById(publicationId).select('subtitles');
  if (!publication) {
    return next(new AppError('Publication not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { subtitles: publication.subtitles || [] },
  });
});

exports.getBooksByPublicationAndSubtitle = catchAsync(async (req, res, next) => {
  const { publicationId, subtitleId } = req.params;
  const query = { publication: publicationId };
  if (subtitleId !== 'null') {
    query.subtitle = subtitleId;
  }
  const books = await BookCatalog.find(query).select('bookName bookType commonPrice pricesByClass');
  console.log('Books sent to frontend:', books); // Add this for debugging
  res.status(200).json({
    status: 'success',
    results: books.length,
    data: { books },
  });
});

exports.createCustomerOrder = catchAsync(async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return next(new AppError(err.message, 400));
    }
    try {
      const {
        customerType, customerId, salesBy, orderEntryBy, publication,
        subtitle, orderItems: orderItemsStr, orderDate, orderBy, shippedTo, remark
      } = req.body;

      // Validate required fields and IDs
      if (!isValidObjectId(customerId)) {
        return next(new AppError('Invalid customer ID', 400));
      }
      if (!isValidObjectId(salesBy)) {
        return next(new AppError('Invalid sales representative ID', 400));
      }
      if (!isValidObjectId(orderEntryBy)) {
        return next(new AppError('Invalid order entry person ID', 400));
      }
      if (!isValidObjectId(publication)) {
        return next(new AppError('Invalid publication ID', 400));
      }
      let validatedSubtitle = subtitle === 'null' ? null : subtitle;
      if (validatedSubtitle && !isValidObjectId(validatedSubtitle)) {
        return next(new AppError('Invalid subtitle ID', 400));
      }
      if (!['Online', 'Phone', 'In-Person'].includes(orderBy)) {
        return next(new AppError('Invalid order source', 400));
      }

      // Parse and validate order items
      let parsedOrderItems;
      try {
        parsedOrderItems = JSON.parse(orderItemsStr);
      } catch (e) {
        return next(new AppError('Invalid order items format', 400));
      }
      if (!Array.isArray(parsedOrderItems) || parsedOrderItems.length === 0) {
        return next(new AppError('Order items must be a non-empty array', 400));
      }

      // Validate order items
      const validatedOrderItems = await Promise.all(parsedOrderItems.map(async item => {
        // Check required fields
        if (!item.book || !item.quantity || !item.price || item.discount == null) {
          throw new AppError(`Invalid order item: missing required fields for book ID ${item.book}`, 400);
        }
        if (!isValidObjectId(item.book)) {
          throw new AppError(`Invalid book ID: ${item.book}`, 400);
        }

        // Fetch book details
        const bookDoc = await BookCatalog.findById(item.book).select('bookName bookType commonPrice pricesByClass publication subtitle');
        if (!bookDoc) {
          throw new AppError(`Book not found for ID: ${item.book}`, 404);
        }
        if (bookDoc.publication.toString() !== publication) {
          throw new AppError(`Book ID ${item.book} does not belong to the selected publication`, 400);
        }
        if (validatedSubtitle && bookDoc.subtitle?.toString() !== validatedSubtitle) {
          throw new AppError(`Book ID ${item.book} does not belong to the selected subtitle`, 400);
        }

        // Validate className for non-common_price books
        if (bookDoc.bookType !== 'common_price' && !item.className) {
          throw new AppError(`Class name is required for book ID: ${item.book} (${bookDoc.bookName}) as it does not have a common price`, 400);
        }

        // Get expected price
        const expectedPrice = bookDoc.bookType === 'common_price' 
          ? bookDoc.commonPrice 
          : bookDoc.pricesByClass?.get(item.className) || 0;

        // Detailed validation for price
        if (expectedPrice == null || expectedPrice <= 0) {
          console.error(`Invalid price for book ID ${item.book}: Book Name: ${bookDoc.bookName}, Type: ${bookDoc.bookType}, CommonPrice: ${bookDoc.commonPrice}, PricesByClass: ${JSON.stringify([...bookDoc.pricesByClass])}, ClassName: ${item.className}`);
          throw new AppError(`Invalid price for book ID: ${item.book} (${bookDoc.bookName}). Price must be greater than 0. Check book pricing configuration.`, 400);
        }

        // Validate price match
        if (Math.abs(expectedPrice - parseFloat(item.price)) > 0.01) {
          console.error(`Price mismatch for book ID ${item.book}: Book Name: ${bookDoc.bookName}, Expected: ${expectedPrice}, Received: ${item.price}, ClassName: ${item.className}`);
          throw new AppError(`Price does not match book catalog for book ID: ${item.book} (${bookDoc.bookName}). Expected ${expectedPrice}, received ${item.price}`, 400);
        }

        // Calculate total
        const total = parseFloat(item.price) * parseInt(item.quantity) * (1 - parseFloat(item.discount) / 100);
        return {
          book: item.book,
          className: item.className || null,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
          discount: parseFloat(item.discount),
          total: total,
        };
      }));

      // Generate order number
      const lastOrder = await CustomerOrder.findOne().sort({ orderNumber: -1 });
      const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;

      // Calculate total order amount
      const totalOrderAmount = validatedOrderItems.reduce((sum, item) => sum + item.total, 0);

      // Prepare order data
      const orderData = {
        orderNumber,
        customer: customerId,
        customerType,
        salesBy,
        orderEntryBy,
        publication,
        subtitle: validatedSubtitle,
        orderItems: validatedOrderItems,
        orderDate,
        orderBy,
        shippedTo: shippedTo || null,
        remark: remark || null,
        orderImage: req.file ? req.file.filename : null,
        total: totalOrderAmount,
      };

      console.log('Order data to save:', orderData);

      // Create order
      const newOrder = await CustomerOrder.create(orderData);

      res.status(201).json({
        status: 'success',
        data: { order: newOrder },
        message: 'Customer order created successfully!',
      });
    } catch (err) {
      console.error('Error creating order:', err);
      return next(new AppError(err.message || 'Failed to create order', 400));
    }
  });
});

exports.getAllCustomerOrders = catchAsync(async (req, res, next) => {
  const orders = await CustomerOrder.find()
    .populate('customer', 'customerName customerType discount')
    .populate('salesBy', 'name')
    .populate('orderEntryBy', 'name')
    .populate('publication', 'name')
    .populate('orderItems.book', 'bookName');
  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: { orders },
  });
});

function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}