// backend/utils/apiFeatures.js

class APIFeatures {
    constructor(query, queryString) {
        this.query = query; // Mongoose query object (e.g., Tour.find())
        this.queryString = queryString; // req.query object from Express
    }

    filter() {
        // 1A) Filtering
        const queryObj = { ...this.queryString }; // Create a shallow copy of req.query
        const excludedFields = ['page', 'sort', 'limit', 'fields']; // Fields to exclude from filtering
        excludedFields.forEach(el => delete queryObj[el]); // Remove excluded fields

        // 1B) Advanced filtering (for gt, gte, lt, lte)
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`); // Add $ prefix for Mongoose operators

        this.query = this.query.find(JSON.parse(queryStr)); // Apply filtering to the query

        // Store the filter query for total count calculation (useful for pagination metadata)
        this.filterQuery = JSON.parse(queryStr);

        return this; // Return 'this' to allow method chaining
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' '); // Replace commas with spaces for Mongoose sort
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt'); // Default sort by creation date (descending)
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' '); // Select specific fields
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v'); // Exclude __v field by default
        }
        return this;
    }

    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1; // Default page 1
        const limit = parseInt(this.queryString.limit, 10) || 100; // Default limit 100 documents per page
        const skip = (page - 1) * limit; // Calculate documents to skip

        this.query = this.query.skip(skip).limit(limit); // Apply pagination

        return this;
    }
}

module.exports = APIFeatures;
