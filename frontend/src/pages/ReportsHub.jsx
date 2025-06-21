// src/pages/ReportsHub.jsx

import React, { useState } from 'react';
// REMOVED: Link from 'react-router-dom'; // No longer needed for internal navigation
import OverallReportsComponent from '../components/reports/OverallReportsComponent';
import BranchOverviewReport from '../components/reports/BranchOverviewReport';
import BranchSelector from '../components/reports/BranchSelector';
import BranchDetailsReport from '../components/reports/BranchDetailsReport'; // Import BranchDetailsReport
import '../styles/ReportsHub.css';
import '../styles/Report.css';
import { FaChartBar, FaBuilding, FaSearchLocation, FaHome } from 'react-icons/fa';

// Add onGoBackToDashboard to props
const ReportsHub = ({ showFlashMessage, onGoBackToDashboard }) => {
    const [activeReport, setActiveReport] = useState('overall');
    const [selectedBranchId, setSelectedBranchId] = useState(null); // State to hold selected branch ID

    // Function to handle branch selection from BranchSelector
    const handleBranchSelect = (branchId) => {
        setSelectedBranchId(branchId);
        setActiveReport('branch-details'); // Automatically switch to branch-details view
    };

    // Function to clear selected branch and go back to branch selection view
    const clearSelectedBranch = () => {
        setSelectedBranchId(null);
        setActiveReport('branch-details-selector'); // A new 'sub-state' for branch details selection
    };

    const renderActiveReport = () => {
        switch (activeReport) {
            case 'overall':
                return <OverallReportsComponent showFlashMessage={showFlashMessage} />;
            case 'branch-overview':
                return <BranchOverviewReport showFlashMessage={showFlashMessage} />;
            case 'branch-details-selector': // New case for just the selector
                return (
                    <>
                        <BranchSelector
                            showFlashMessage={showFlashMessage}
                            onSelectBranch={handleBranchSelect} // Pass the new handler
                        />
                        <p className="mt-4 text-muted text-center reports-description">
                            Select a branch from the dropdown above to view its detailed report.
                        </p>
                    </>
                );
            case 'branch-details': // When a branch is selected, render details
                if (selectedBranchId) {
                    return (
                        <BranchDetailsReport
                            id={selectedBranchId} // Pass ID as a prop
                            showFlashMessage={showFlashMessage}
                            onBackToSelector={clearSelectedBranch} // Pass function to go back
                        />
                    );
                }
                return (
                    <p className="text-center text-muted mt-5">
                        Please select a branch to view its details.
                    </p>
                );
            default:
                return <p className="text-center text-muted mt-5">Please select a report from the navigation.</p>;
        }
    };

    return (
        <div className="reports-hub-wrapper">
            {/* Sidebar Navigation */}
            <aside className="reports-sidebar">
                <h3 className="sidebar-title">Reports Hub</h3>
                <nav className="sidebar-nav">
                    <ul>
                        <li>
                            {/* UPDATED: Use a button with onGoBackToDashboard prop */}
                            <button
                                onClick={onGoBackToDashboard} // Call the prop function
                                className="nav-button dashboard-button"
                            >
                                <FaHome className="nav-icon" />
                                Main Dashboard
                            </button>
                        </li>
                        <li className="sidebar-divider"></li>

                        <li>
                            <button
                                className={`nav-button ${activeReport === 'overall' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveReport('overall');
                                    setSelectedBranchId(null); // Clear selected branch when changing report
                                }}
                            >
                                <FaChartBar className="nav-icon" />
                                Overall Business Summary
                            </button>
                        </li>
                        <li>
                            <button
                                className={`nav-button ${activeReport === 'branch-overview' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveReport('branch-overview');
                                    setSelectedBranchId(null); // Clear selected branch
                                }}
                            >
                                <FaBuilding className="nav-icon" />
                                All Branches Overview
                            </button>
                        </li>
                        <li>
                            <button
                                className={`nav-button ${activeReport.startsWith('branch-details') ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveReport('branch-details-selector'); // Go to selector state first
                                    setSelectedBranchId(null); // Ensure no branch is pre-selected
                                }}
                            >
                                <FaSearchLocation className="nav-icon" />
                                Specific Branch Details
                            </button>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="reports-content">
                <h2 className="reports-main-title">Business Intelligence Reports</h2>
                <div className="report-display-area card shadow-sm">
                    {renderActiveReport()}
                </div>
            </main>
        </div>
    );
};

export default ReportsHub;