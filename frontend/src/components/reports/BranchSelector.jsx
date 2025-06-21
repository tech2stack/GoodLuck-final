// src/components/reports/BranchSelector.js

import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaBuilding, FaSpinner } from 'react-icons/fa';

// REMOVE: import '../../styles/Report.css';
// NEW: Import the component-specific CSS
import '../../styles/BranchSelector.css';

// Add onSelectBranch prop
const BranchSelector = ({ showFlashMessage, onSelectBranch }) => {
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBranches = async () => {
            setLoading(true);
            try {
                const response = await api.get('/branches'); // Adjust endpoint if needed
                setBranches(response.data.data || response.data);
                if (typeof showFlashMessage === 'function') {
                    showFlashMessage('Branches loaded successfully!', 'success');
                }
            } catch (err) {
                console.error("Error fetching branches:", err);
                setError(err.response?.data?.message || "Failed to load branches.");
                if (typeof showFlashMessage === 'function') {
                    showFlashMessage('Failed to load branches.', 'error');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchBranches();
    }, [showFlashMessage]);

    const handleSelectChange = (e) => {
        const branchId = e.target.value;
        setSelectedBranch(branchId);
        if (branchId && onSelectBranch) {
            onSelectBranch(branchId); // Call the prop function with the selected ID
        } else if (!branchId && onSelectBranch) {
            // If "Choose a Branch" is selected, clear the selected branch in parent
            onSelectBranch(null);
        }
    };

    if (loading) {
        return (
            <div className="branch-selector-loading">
                <FaSpinner className="fa-spin me-2" /> Loading Branches...
            </div>
        );
    }

    if (error) {
        return (
            <div className="branch-selector-error">
                <p className="mb-3">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="branch-selector-wrapper">
            <h5 className="branch-selector-title">Select a Branch to view details</h5>
            <div className="branch-selector-input-group">
                <label htmlFor="branchSelect" className="branch-selector-input-label">
                    <FaBuilding />
                </label>
                <select
                    id="branchSelect"
                    className="branch-selector-dropdown"
                    value={selectedBranch}
                    onChange={handleSelectChange}
                >
                    <option value="">-- Choose a Branch --</option>
                    {branches.length > 0 ? (
                        branches.map(branch => (
                            <option key={branch._id} value={branch._id}>
                                {branch.name} ({branch.location})
                            </option>
                        ))
                    ) : (
                        <option value="" disabled>No branches available</option>
                    )}
                </select>
            </div>
            {branches.length === 0 && !loading && !error && (
                 <p className="branch-selector-error">No branches found. Please add branches first.</p>
            )}
        </div>
    );
};

export default BranchSelector;