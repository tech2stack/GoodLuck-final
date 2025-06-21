// backend/controllers/reportController.js

const Branch = require('../models/Branch'); // Assuming you have a Branch model
const BranchAdmin = require('../models/BranchAdmin'); // Assuming BranchAdmin model
const Employee = require('../models/Employee'); // Assuming Employee model
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const path = require('path');
const pdf = require('html-pdf');

// --- Helper function for error handling ---
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// @desc    Get Overall Business Report
// @route   GET /api/v1/reports/overall
// @access  Private (Super Admin)
exports.getOverallReport = asyncHandler(async (req, res, next) => {
    const totalBranches = await Branch.countDocuments();
    const activeBranches = await Branch.countDocuments({ status: 'active' });
    const inactiveBranches = await Branch.countDocuments({ status: 'inactive' });
    const totalBranchAdmins = await BranchAdmin.countDocuments();
    const totalEmployees = await Employee.countDocuments();

    res.status(200).json({
        success: true,
        data: {
            totalBranches,
            activeBranches,
            inactiveBranches,
            totalBranchAdmins,
            totalEmployees,
            reportGeneratedAt: new Date().toISOString()
        }
    });
});

// @desc    Download Overall Business Report as PDF
// @route   GET /api/v1/reports/overall/download
// @access  Private (Super Admin)
exports.downloadOverallReport = asyncHandler(async (req, res, next) => {
    const totalBranches = await Branch.countDocuments();
    const activeBranches = await Branch.countDocuments({ status: 'active' });
    const inactiveBranches = await Branch.countDocuments({ status: 'inactive' });
    const totalBranchAdmins = await BranchAdmin.countDocuments();
    const totalEmployees = await Employee.countDocuments();
    const reportGeneratedAt = new Date().toLocaleString();

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Overall Business Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                h1 { color: #2c3e50; text-align: center; margin-bottom: 25px; }
                hr { border: 0; height: 1px; background: #eee; margin: 20px 0; }
                .report-section { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
                .report-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 1.1em; }
                .label { font-weight: normal; color: #555; }
                .value { font-weight: bold; color: #007bff; }
                .footer { text-align: center; font-size: 0.9em; color: #888; margin-top: 30px; }
            </style>
        </head>
        <body>
            <h1>Overall Business Report</h1>
            <p class="footer">Generated On: ${reportGeneratedAt}</p>
            <hr/>
            <div class="report-section">
                <div class="report-item"><span class="label">Total Branches:</span> <span class="value">${totalBranches}</span></div>
                <div class="report-item"><span class="label">Active Branches:</span> <span class="value">${activeBranches}</span></div>
                <div class="report-item"><span class="label">Inactive Branches:</span> <span class="value">${inactiveBranches}</span></div>
                <div class="report-item"><span class="label">Total Branch Admins:</span> <span class="value">${totalBranchAdmins}</span></div>
                <div class="report-item"><span class="label">Total Employees:</span> <span class="value">${totalEmployees}</span></div>
            </div>
            <p class="footer">This report provides a high-level overview of all branches, admins, and employees.</p>
        </body>
        </html>
    `;

    const options = {
        format: 'A4',
        orientation: 'portrait',
        border: '15mm'
    };

    pdf.create(htmlContent, options).toStream((err, stream) => {
        if (err) {
            console.error('Error creating PDF:', err);
            return next(new Error('Failed to generate PDF report.'));
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="overall_report.pdf"');
        stream.pipe(res);
    });
});


// @desc    Get Branch Overview Report (Table data for all branches)
// @route   GET /api/v1/reports/branch-overview
// @access  Private (Super Admin)
exports.getBranchOverviewReport = asyncHandler(async (req, res, next) => {
    // Fetch all branches and select relevant fields
    const branches = await Branch.find().select('name location status');

    const report = [];
    for (const branch of branches) {
        // For each branch, count its employees
        // --- CORRECTED LINE: Using 'branchId' for Employee model ---
        const employeeCount = await Employee.countDocuments({ branchId: branch._id }); 
        report.push({
            _id: branch._id,
            name: branch.name,
            location: branch.location,
            status: branch.status,
            employeeCount: employeeCount
        });
    }

    res.status(200).json({
        success: true,
        data: {
            report,
            reportGeneratedAt: new Date().toISOString()
        }
    });
});

// @desc    Download Branch Overview Report as CSV
// @route   GET /api/v1/reports/branch-overview/download
// @access  Private (Super Admin)
exports.downloadBranchOverviewReport = asyncHandler(async (req, res, next) => {
    const branches = await Branch.find().select('name location status');
    const data = [];

    for (const branch of branches) {
        // --- CORRECTED LINE: Using 'branchId' for Employee model ---
        const employeeCount = await Employee.countDocuments({ branchId: branch._id });
        data.push({
            'Branch Name': branch.name,
            'Location': branch.location,
            'Status': branch.status,
            'Total Employees': employeeCount
        });
    }

    if (data.length === 0) {
        return res.status(404).json({ success: false, message: 'No data to generate report.' });
    }

    try {
        const json2csvParser = new Parser({ fields: ['Branch Name', 'Location', 'Status', 'Total Employees'] });
        const csv = json2csvParser.parse(data);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="Branch_Overview_Report_${Date.now()}.csv"`);
        res.status(200).send(csv);
    } catch (err) {
        console.error('Error generating CSV:', err);
        next(new Error('Could not generate CSV report', 500));
    }
});


// @desc    Get Details for a Specific Branch
// @route   GET /api/v1/reports/branch-details/:id
// @access  Private (Super Admin or Branch Admin of that branch)
exports.getBranchDetailsReport = asyncHandler(async (req, res, next) => {
    const branchId = req.params.id;

    const branch = await Branch.findById(branchId).select('name location status contactEmail');
    if (!branch) {
        return next(new Error('Branch not found with ID ' + branchId, 404));
    }

    // --- CORRECTED LINE: Using 'branchId' for Employee model count ---
    const employeeCount = await Employee.countDocuments({ branchId: branchId });
    // --- CORRECTED LINE: Using 'branchId' for Employee model find ---
    const employees = await Employee.find({ branchId: branchId }).select('name position email');
    
    // This line was already corrected in the previous round
    const branchAdmin = await BranchAdmin.findOne({ branchId: branchId }).select('name email'); 

    res.status(200).json({
        success: true,
        data: {
            _id: branch._id,
            name: branch.name,
            location: branch.location,
            status: branch.status,
            contactEmail: branch.contactEmail,
            employeeCount: employeeCount,
            employees: employees,
            adminName: branchAdmin ? branchAdmin.name : 'N/A',
            adminEmail: branchAdmin ? branchAdmin.email : 'N/A',
            reportGeneratedAt: new Date().toISOString()
        }
    });
});

// @desc    Download CSV for Specific Branch Details
// @route   GET /api/v1/reports/branch-details/:id/download
// @access  Private (Super Admin or Branch Admin of that branch)
exports.downloadBranchDetailsReport = asyncHandler(async (req, res, next) => {
    const branchId = req.params.id;

    const branch = await Branch.findById(branchId).select('name location status');
    if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found.' });
    }

    // --- CORRECTED LINE: Using 'branchId' for Employee model find ---
    const employees = await Employee.find({ branchId: branchId }).select('name position email');
    // This line was already corrected in the previous round
    const branchAdmin = await BranchAdmin.findOne({ branchId: branchId }).select('name email');

    // Prepare data for CSV
    const data = [
        { 'Metric': 'Branch Name', 'Value': branch.name },
        { 'Metric': 'Location', 'Value': branch.location },
        { 'Metric': 'Status', 'Value': branch.status },
        { 'Metric': 'Total Employees', 'Value': employees.length },
        { 'Metric': 'Branch Admin Name', 'Value': branchAdmin ? branchAdmin.name : 'N/A' },
        { 'Metric': 'Branch Admin Email', 'Value': branchAdmin ? branchAdmin.email : 'N/A' },
    ];

    // Add each employee as separate rows or flattened fields
    employees.forEach((emp, index) => {
        data.push(
            { 'Metric': `Employee ${index + 1} Name`, 'Value': emp.name },
            { 'Metric': `Employee ${index + 1} Position`, 'Value': emp.position },
            { 'Metric': `Employee ${index + 1} Email`, 'Value': emp.email }
        );
    });

    try {
        const json2csvParser = new Parser({ fields: ['Metric', 'Value'] });
        const csv = json2csvParser.parse(data);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${branch.name}_Details_Report_${Date.now()}.csv"`);
        res.status(200).send(csv);
    } catch (err) {
        console.error('Error generating CSV:', err);
        next(new Error('Could not generate CSV report', 500));
    }
});