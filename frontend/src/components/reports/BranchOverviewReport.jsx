// src/components/reports/BranchOverviewReport.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { FaSpinner, FaSyncAlt } from 'react-icons/fa';
// REMOVE: import '../../styles/Report.css';
// NEW: Import the component-specific CSS
import '../../styles/BranchOverviewReport.css';

const BranchOverviewReport = ({ showFlashMessage }) => {
    const [overviewData, setOverviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchOverviewReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/reports/branch-overview');

            console.log("Branch Overview API Response:", response.data);

            const rawData = response.data.data;

            if (rawData && Array.isArray(rawData.report)) {
                const branchesArray = rawData.report;

                // Calculate summary counts on the frontend
                const total = branchesArray.length;
                const active = branchesArray.filter(b => b.status === 'active').length;
                const inactive = total - active;

                setOverviewData({
                    totalBranches: total,
                    activeBranches: active,
                    inactiveBranches: inactive,
                    branches: branchesArray, // Set the detailed list of branches
                    reportGeneratedAt: rawData.reportGeneratedAt
                });

                if (typeof showFlashMessage === 'function') {
                    showFlashMessage('Branch overview loaded successfully!', 'success');
                }
            } else {
                setOverviewData({}); // Fallback to empty object for safe rendering
                if (typeof showFlashMessage === 'function') {
                    showFlashMessage('Branch overview: Unexpected data format or empty response.', 'warning');
                }
            }
        } catch (err) {
            console.error('Error fetching branch overview:', err.response?.data?.message || err.message || err);
            setError(err.response?.data?.message || 'Failed to fetch branch overview. Check server & network.');
            if (typeof showFlashMessage === 'function') {
                showFlashMessage(err.response?.data?.message || 'Failed to fetch branch overview.', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]);

    useEffect(() => {
        if (typeof showFlashMessage === 'function') {
            fetchOverviewReport();
        } else {
            console.warn("BranchOverviewReport: showFlashMessage prop is not available on initial render.");
        }
    }, [fetchOverviewReport, showFlashMessage]);

    // Conditional rendering based on state
    if (loading) {
        return (
            <div className="branch-overview-loading">
                <FaSpinner className="fa-spin me-2" /> Loading branch overview...
            </div>
        );
    }

    if (error) {
        return (
            <div className="branch-overview-error">
                <p className="mb-3">Error: {error}</p>
                <button onClick={fetchOverviewReport} className="btn btn-sm btn-outline-danger">
                    <FaSyncAlt className="me-1" /> Try Again
                </button>
            </div>
        );
    }

    const displayOverviewData = overviewData || {};
    const branches = Array.isArray(displayOverviewData.branches) ? displayOverviewData.branches : [];

    return (
        <div className="branch-overview-container">
            <h4 className="mb-3">All Branches Overview</h4>
            <p className="report-description-text">This report summarizes key metrics for all registered branches.</p>

            {/* Display summary data */}
            {Object.keys(displayOverviewData).length > 0 && branches.length > 0 ? (
                <div className="report-data-display">
                    <div className="branch-summary-grid">
                        <div className="branch-summary-card">
                            <h5>Total Branches</h5>
                            <p className="display-count text-primary">{displayOverviewData.totalBranches ?? 'N/A'}</p>
                        </div>
                        <div className="branch-summary-card">
                            <h5>Active Branches</h5>
                            <p className="display-count text-success">{displayOverviewData.activeBranches ?? 'N/A'}</p>
                        </div>
                        <div className="branch-summary-card">
                            <h5>Inactive Branches</h5>
                            <p className="display-count text-warning">{displayOverviewData.inactiveBranches ?? 'N/A'}</p>
                        </div>
                    </div>

                    {/* Display detailed branch list */}
                    <div className="branch-detail-list-section">
                        <h5 className="mb-3">Detailed Branch List:</h5>
                        <ul className="branch-list">
                            {branches.map(branch => (
                                <li key={branch._id || branch.id || Math.random()}
                                    className="branch-list-item"
                                >
                                    <div className="branch-info">
                                        <strong>{branch.name ?? 'N/A'}</strong> <small className="text-muted">({branch.location ?? 'N/A'})</small>
                                    </div>
                                    <span className={`branch-status-badge ${branch.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                                        Status: {branch.status ?? 'N/A'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="branch-overview-no-data">
                    <p className="mb-0">No branch overview data available. Please ensure your backend is returning data.</p>
                </div>
            )}
        </div>
    );
};

export default BranchOverviewReport;