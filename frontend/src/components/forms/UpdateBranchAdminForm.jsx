import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FaSave, FaTimes } from 'react-icons/fa';

const UpdateBranchAdminForm = ({ adminData, onBranchAdminUpdated, onCancel, branches }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [branchId, setBranchId] = useState('');
    const [status, setStatus] = useState('active'); // Added status state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (adminData) {
            setName(adminData.name || '');
            setEmail(adminData.email || '');
            setBranchId(adminData.branchId?._id || adminData.branchId || ''); // Handle nested branch object
            setStatus(adminData.status || 'active'); // Initialize status
        }
    }, [adminData]);

    // Effect to clear success/error messages after a delay
    useEffect(() => {
        let timer;
        if (success || error) {
            timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 5000); // Clear after 5 seconds
        }
        return () => clearTimeout(timer);
    }, [success, error]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const updatePayload = { name, email, branchId, status }; // Include status in payload

            // --- THE ONLY CHANGE HERE: Changed api.put to api.patch ---
            const response = await api.patch(`/branch-admins/${adminData._id}`, updatePayload);
            // --- END CHANGE ---

            setSuccess('Branch Admin updated successfully!');
            console.log('Branch Admin updated:', response.data);
            if (onBranchAdminUpdated) {
                onBranchAdminUpdated(response.data.data.admin); // Pass the 'admin' object from data
            }
        } catch (err) {
            console.error('Error updating branch admin:', err.response?.data || err);
            setError(err.response?.data?.message || 'Failed to update Branch Admin. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Update Branch Admin</h2>
            <form onSubmit={handleSubmit} className="form-content">
                {success && <p className="success-message">{success}</p>}
                {error && <p className="error-message">{error}</p>}

                <div className="form-group">
                    <label htmlFor="adminName" className="form-label">Name:</label>
                    <input
                        type="text"
                        id="adminName"
                        className="form-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        aria-label="Branch Admin Name"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="adminEmail" className="form-label">Email:</label>
                    <input
                        type="email"
                        id="adminEmail"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        aria-label="Branch Admin Email"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="adminBranch" className="form-label">Assign Branch:</label>
                    <select
                        id="adminBranch"
                        className="form-select"
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        required
                        aria-label="Assign Branch to Admin"
                    >
                        <option value="">Select a Branch</option>
                        {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>{branch.name} ({branch.location})</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="adminStatus" className="form-label">Status:</label>
                    <select
                        id="adminStatus"
                        className="form-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        required
                        aria-label="Branch Admin Status"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Updating...' : <><FaSave className="mr-2" /> Update Admin</>}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        <FaTimes className="mr-2" /> Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UpdateBranchAdminForm;