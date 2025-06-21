// config/db.js
const mongoose = require('mongoose');

// Ensure that MONGO_URI is being loaded from the .env file.
if (!process.env.MONGO_URI) {
    console.error("Error: MONGO_URI is not defined in the .env file. Please check your .env settings.");
    process.exit(1); // Exit the process in case of a critical error
}

// --- Central Database Connection ---
// This connection will handle models like SuperAdmin and Branch.
// MONGO_URI in the .env file should point to this central database.
// Example: mongodb://localhost:27017/bookstore_main_admin
const centralDbConnection = mongoose.createConnection(process.env.MONGO_URI, {
    // For Mongoose 6+ and above, useNewUrlParser and useUnifiedTopology are not required
});


centralDbConnection.on('connected', () => {
    console.log(`Central MongoDB connected: ${centralDbConnection.host} (DB: ${centralDbConnection.name})`);
});

centralDbConnection.on('error', (err) => {
    console.error(`Central MongoDB connection error: ${err.message}`);
    process.exit(1); // Exit the process if the central DB fails
});

// --- Function to get branch-specific database connection ---
// This function returns a new connection to the database of a specific branch.
// We are not using it right now, but it's kept here for future use.
const getBranchDbConnection = (branchDbName) => {
    if (!branchDbName || typeof branchDbName !== 'string') {
        console.error("Error: Invalid branchDbName provided to getBranchDbConnection.");
        return null;
    }

    let branchUri = process.env.MONGO_URI;

    // Logic to modify or append the database name in the URI
    // Handles both Atlas-style URIs and localhost URIs
    try {
        const url = new URL(process.env.MONGO_URI);
        // Replace the path/DB name if already present in the base URI
        url.pathname = `/${branchDbName}`;
        branchUri = url.toString();
    } catch (error) {
        // Fallback for simple localhost URIs that may not follow full URL structure
        console.warn("Failed to parse MONGO_URI as URL, falling back to string manipulation for branch DB.");
        if (branchUri.includes('/')) {
            branchUri = branchUri.substring(0, branchUri.lastIndexOf('/') + 1) + branchDbName;
        } else {
            branchUri = `${branchUri}/${branchDbName}`;
        }
    }

    const branchDbConn = mongoose.createConnection(branchUri, {
        // For Mongoose 6+ and above, useNewUrlParser and useUnifiedTopology are not required
    });

    branchDbConn.on('connected', () => {
        console.log(`Branch MongoDB connected: ${branchDbName}`);
    });

    branchDbConn.on('error', (err) => {
        console.error(`Branch MongoDB connection error for ${branchDbName}: ${err.message}`);
    });

    return branchDbConn;
};

// --- Export connections ---
module.exports = {
    centralDbConnection,
    getBranchDbConnection
};
