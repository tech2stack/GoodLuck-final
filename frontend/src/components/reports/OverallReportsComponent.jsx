// src/components/reports/OverallReportsComponent.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { FaDownload, FaEye, FaSpinner, FaSyncAlt } from 'react-icons/fa';
// REMOVE: import '../../styles/Report.css'; // This is a generic one, use specific now
// NEW: Import the new component-specific CSS
import '../../styles/OverallReportsComponent.css';

const OverallReportsComponent = ({ showFlashMessage }) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchOverallReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/reports/overall');
            console.log("Overall Report API Response:", response.data);
            const dataToSet = response.data.data || response.data; // Handles nested 'data' or direct response

            if (dataToSet && typeof dataToSet === 'object') {
                setReportData(dataToSet);
                if (typeof showFlashMessage === 'function') {
                    showFlashMessage('Overall report loaded successfully!', 'success');
                }
            } else {
                setReportData({});
                if (typeof showFlashMessage === 'function') {
                    showFlashMessage('Overall report: Unexpected data format or empty response.', 'warning');
                }
            }
        } catch (err) {
            console.error('Error fetching overall report:', err.response?.data?.message || err.message || err);
            setError(err.response?.data?.message || 'Failed to fetch overall report. Check server & network.');
            if (typeof showFlashMessage === 'function') {
                showFlashMessage(err.response?.data?.message || 'Failed to fetch overall report.', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]);

    const downloadOverallReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/overall/download', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'overall_report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            if (typeof showFlashMessage === 'function') {
                showFlashMessage('Overall report download started!', 'success');
            }
        } catch (err) {
            console.error('Error downloading overall report:', err);
            if (err.response && err.response.data instanceof Blob) {
                const errorText = await err.response.data.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    if (typeof showFlashMessage === 'function') {
                        showFlashMessage(errorJson.message || 'Failed to download overall report.', 'error');
                    }
                } catch (parseError) {
                    if (typeof showFlashMessage === 'function') {
                        showFlashMessage(errorText || 'Failed to download overall report. (Non-JSON error)', 'error');
                    }
                }
            } else {
                if (typeof showFlashMessage === 'function') {
                    showFlashMessage(err.response?.data?.message || 'Failed to download overall report.', 'error');
                }
            }
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]);

    useEffect(() => {
        if (typeof showFlashMessage === 'function') {
            fetchOverallReport();
        } else {
            console.warn("OverallReportsComponent: showFlashMessage prop is not available on initial render.");
        }
    }, [fetchOverallReport, showFlashMessage]);

    if (loading) {
        return (
            <div className="overall-report-loading">
                <FaSpinner className="fa-spin" /> Loading overall business summary...
            </div>
        );
    }

    if (error) {
        return (
            <div className="overall-report-error">
                <p className="mb-3">Error: {error}</p>
                <button onClick={fetchOverallReport} className="btn btn-sm btn-outline-danger">
                    <FaSyncAlt className="me-1" /> Try Again
                </button>
            </div>
        );
    }

    const displayData = reportData || {};

    return (
        <div className="overall-report-container">
            <h4 className="overall-report-title">Overall Business Summary</h4>
            <p className="reports-description-text">This report provides a high-level overview of all branches, admins, and employees across the entire business.</p>

            <div className="overall-report-actions">
                <button onClick={fetchOverallReport} className="btn btn-info">
                    <FaEye className="me-2" /> View Latest Data
                </button>
                <button onClick={downloadOverallReport} className="btn btn-success">
                    <FaDownload className="me-2" /> Download PDF
                </button>
            </div>

            {Object.keys(displayData).length > 0 ? (
                <div className="overall-summary-grid">
                    <div className="overall-summary-card">
                        <h5>Total Branches</h5>
                        <p className="display-count text-primary">{displayData.totalBranches ?? 'N/A'}</p>
                    </div>
                    <div className="overall-summary-card">
                        <h5>Active Branches</h5>
                        <p className="display-count text-success">{displayData.activeBranches ?? 'N/A'}</p>
                    </div>
                    <div className="overall-summary-card">
                        <h5>Inactive Branches</h5>
                        <p className="display-count text-warning">{displayData.inactiveBranches ?? 'N/A'}</p>
                    </div>
                    <div className="overall-summary-card">
                        <h5>Total Branch Admins</h5>
                        <p className="display-count text-info">{displayData.totalBranchAdmins ?? 'N/A'}</p>
                    </div>
                    <div className="overall-summary-card">
                        <h5>Total Employees</h5>
                        <p className="display-count text-secondary">{displayData.totalEmployees ?? 'N/A'}</p>
                    </div>
                    {/* If you add more metrics in the future, just add another card here */}
                </div>
            ) : (
                <div className="overall-report-no-data">
                    <p className="mb-0">No overall report data available. Ensure backend is providing data or check filters.</p>
                </div>
            )}
        </div>
    );
};

export default OverallReportsComponent;