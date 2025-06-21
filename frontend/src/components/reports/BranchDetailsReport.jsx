// src/components/reports/BranchDetailsReport.js

import React, { useState, useEffect, useCallback } from 'react';
// import { useParams, useNavigate } from 'react-router-dom'; // Remove useParams and useNavigate
import api from '../../services/api';
import { FaDownload, FaSpinner, FaSyncAlt, FaArrowLeft } from 'react-icons/fa';


import '../../styles/BranchDetailsReport.css';

// Props will now include 'id' and 'onBackToSelector'
const BranchDetailsReport = ({ id, showFlashMessage, onBackToSelector }) => {
    // const { id } = useParams(); // REMOVE THIS LINE
    // const navigate = useNavigate(); // REMOVE THIS LINE
    const [branchData, setBranchData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const fetchBranchDetails = useCallback(async () => {
        if (!id) { // Added check for id, as it's now a prop
            setError("No branch ID provided for details.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/reports/branch-details/${id}`);
            console.log(`Branch Details API Response for ID ${id}:`, response.data);

            const dataToSet = response.data.data || response.data;

            if (dataToSet && typeof dataToSet === 'object') {
                setBranchData(dataToSet);
                if (typeof showFlashMessage === 'function') {
                    showFlashMessage(`Details for ${dataToSet.name ?? 'branch'} loaded!`, 'success');
                }
            } else {
                setBranchData(null);
                if (typeof showFlashMessage === 'function') {
                    showFlashMessage('Branch details: Unexpected data format or empty response.', 'warning');
                }
            }
        } catch (err) {
            console.error('Error fetching branch details:', err.response?.data?.message || err.message || err);
            setError(err.response?.data?.message || `Failed to fetch details for branch ${id}. Check server & network.`);
            if (typeof showFlashMessage === 'function') {
                showFlashMessage(err.response?.data?.message || `Failed to fetch branch details for ${id}.`, 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [id, showFlashMessage]);

    const handleDownloadCSV = useCallback(async () => {
        if (!id) return; // Ensure id exists before attempting download
        setDownloading(true);
        try {
            const response = await api.get(`/reports/branch-details/${id}/download`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers['content-disposition'];
            let filename = `Branch_Details_Report_${id}_${Date.now()}.csv`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            if (typeof showFlashMessage === 'function') {
                showFlashMessage('Branch details CSV download started!', 'success');
            }
        } catch (err) {
            console.error(`Error downloading CSV for branch ${id}:`, err.response?.data?.message || err.message || err);
            if (typeof showFlashMessage === 'function') {
                showFlashMessage(err.response?.data?.message || 'Failed to download report.', 'error');
            }
        } finally {
            setDownloading(false);
        }
    }, [id, showFlashMessage]);


    useEffect(() => {
        // Fetch data whenever the 'id' prop changes
        if (id) {
            fetchBranchDetails();
        } else {
            // If id becomes null (e.g., when clearing selected branch)
            setBranchData(null);
            setLoading(false);
            setError(null);
        }
    }, [id, fetchBranchDetails]);

    // This function will now call the prop function
  

    if (loading) {
        return (
            <div className="report-detail-card-layout text-center my-4 p-4">
                <FaSpinner className="fa-spin me-2" /> Loading Branch Details...
            </div>
        );
    }

    if (error) {
        return (
            <div className="report-detail-card-layout text-center my-4 text-danger p-4">
                <p className="mb-3">Error: {error}</p>
                <button onClick={fetchBranchDetails} className="btn btn-sm btn-outline-danger">
                    <FaSyncAlt className="me-1" /> Try Again
                </button>
            </div>
        );
    }

    if (!branchData) {
        return (
            <div className="report-detail-card-layout text-center text-muted my-4 p-4">
                <p className="mb-0">No data found for this branch. It might not exist or data is unavailable.</p>
            </div>
        );
    }

    const adminName = branchData.adminName ?? 'N/A';
    const adminEmail = branchData.adminEmail ?? 'N/A';
    const contactEmail = branchData.contactEmail ?? 'N/A';

    return (
        <div className="branch-details-report-wrapper">
            <div className="branch-details-header">
                {/* Use the prop function for back button */}
                
                <h4 className="branch-title">Details for Branch: <span className="text-primary">{branchData.name ?? 'N/A'}</span></h4>
            </div>

            <div className="action-buttons-group">
                <button onClick={handleDownloadCSV} className="btn btn-success" disabled={downloading}>
                    {downloading ? (
                        <> <FaSpinner className="fa-spin me-2" /> Downloading... </>
                    ) : (
                        <> <FaDownload className="me-2" /> Download CSV </>
                    )}
                </button>
                <button onClick={fetchBranchDetails} className="btn btn-info">
                    <FaSyncAlt className="me-2" /> Refresh Data
                </button>
            </div>

            <div className="details-grid">
                <div className="card shadow-sm p-4 details-card">
                    <h5 className="card-title mb-3">Branch Information</h5>
                    <p className="card-text"><strong>Branch ID:</strong> {branchData._id ?? 'N/A'}</p>
                    <p className="card-text"><strong>Location:</strong> {branchData.location ?? 'N/A'}</p>
                    <p className="card-text"><strong>Status:</strong> <span className={`badge ${branchData.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>{branchData.status ?? 'N/A'}</span></p>
                    <p className="card-text"><strong>Total Employees:</strong> {branchData.employeeCount ?? 'N/A'}</p>
                    <p className="card-text"><strong>Contact Email:</strong> {contactEmail}</p>
                </div>

                <div className="card shadow-sm p-4 details-card">
                    <h5 className="card-title mb-3">Branch Admin Details</h5>
                    <p className="card-text"><strong>Branch Admin:</strong> {adminName}</p>
                    <p className="card-text"><strong>Admin Email:</strong> {adminEmail}</p>
                </div>
            </div>

            {/* Employee List Section */}
            {branchData.employees && branchData.employees.length > 0 && (
                <div className="card shadow-sm p-4 employees-card">
                    <h5 className="card-title mb-3">Employees in this Branch:</h5>
                    <ul className="list-group employee-list">
                        {branchData.employees.map(emp => (
                            <li key={emp._id || emp.email || Math.random()} className="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{emp.name ?? 'N/A'}</strong> <small className="text-muted">({emp.position ?? 'N/A'})</small>
                                </div>
                                <small>{emp.email ?? 'N/A'}</small>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {(!branchData.employees || branchData.employees.length === 0) && (
                <div className="text-center text-muted p-4 border rounded bg-light mt-4 employees-card">
                    <p className="mb-0">No employees found for this branch.</p>
                </div>
            )}
        </div>
    );
};

export default BranchDetailsReport;