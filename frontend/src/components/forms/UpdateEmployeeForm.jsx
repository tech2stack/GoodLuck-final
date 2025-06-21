import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaSave, FaTimes } from 'react-icons/fa';

const UpdateEmployeeForm = ({ employeeData, onEmployeeUpdated, onCancel, branches }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [branchId, setBranchId] = useState('');
    const [status, setStatus] = useState('active');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (employeeData) {
            setName(employeeData.name || '');
            setEmail(employeeData.email || '');
            setRole(employeeData.role || ''); // Initialize role
            // --- FIX: Ensure branchId is correctly initialized for both populated and unpopulated data ---
            setBranchId(employeeData.branchId?._id || employeeData.branchId || '');
            // --- END FIX ---
            setStatus(employeeData.status || 'active'); // Initialize status
        }
    }, [employeeData]);

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
            // Prepare payload with fields that can be updated
            const updatePayload = { name, email, role, branchId, status };

            // --- FIX: Changed api.put to api.patch to match backend route ---
            const response = await api.patch(`/employees/${employeeData._id}`, updatePayload);
            // --- END FIX ---

            setSuccess('Employee updated successfully!');
            console.log('Employee updated:', response.data);
            if (onEmployeeUpdated) {
                // Ensure correct data structure is passed (assuming backend sends data: { employee: {...} })
                onEmployeeUpdated(response.data.data.employee);
            }
        } catch (err) {
            console.error('Error updating employee:', err.response?.data || err);
            setError(err.response?.data?.message || 'Failed to update Employee. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Update Employee</h2>
            <form onSubmit={handleSubmit} className="form-content">
                {success && <p className="success-message">{success}</p>}
                {error && <p className="error-message">{error}</p>}

                <div className="form-group">
                    <label htmlFor="employeeName" className="form-label">Name:</label>
                    <input
                        type="text"
                        id="employeeName"
                        className="form-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        aria-label="Employee Name"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="employeeEmail" className="form-label">Email:</label>
                    <input
                        type="email"
                        id="employeeEmail"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        aria-label="Employee Email"
                    />
                </div>

                {/* Password field is typically NOT part of a general update form for security. */}
                {/* It should be a separate 'Change Password' feature. */}

                <div className="form-group">
                    <label htmlFor="employeeBranch" className="form-label">Assign Branch:</label>
                    <select
                        id="employeeBranch"
                        className="form-select"
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        required
                        aria-label="Assign Branch to Employee"
                    >
                        <option value="">Select a Branch</option>
                        {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>{branch.name} ({branch.location})</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="employeeRole" className="form-label">Role:</label>
                    <select
                        id="employeeRole"
                        className="form-select"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        aria-label="Employee Role"
                    >
                        <option value="">Select Role</option>
                        <option value="cashier">Cashier</option>
                        <option value="manager">Manager</option>
                        <option value="sales">Sales</option>
                        {/* Ensure these roles are also in your Employee model's enum */}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="employeeStatus" className="form-label">Status:</label>
                    <select
                        id="employeeStatus"
                        className="form-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        required
                        aria-label="Employee Status"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Updating...' : <><FaSave className="mr-2" /> Update Employee</>}
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

export default UpdateEmployeeForm;