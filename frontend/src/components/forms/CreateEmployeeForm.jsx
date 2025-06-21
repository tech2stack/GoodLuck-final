import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaPlus, FaTimes } from 'react-icons/fa';

const CreateEmployeeForm = ({ onEmployeeCreated, onCancel, branches }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(''); // Default to empty string to force selection
    const [branchId, setBranchId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

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
            // --- FIX: Changed API endpoint from '/employees/register' to '/employees' ---
            const response = await api.post('/employees', { name, email, password, role, branchId });
            // --- END FIX ---

            setSuccess('Employee added successfully!');
            console.log('New Employee created:', response.data);
            setName('');
            setEmail('');
            setPassword('');
            setRole(''); // Reset role
            setBranchId('');

            if (onEmployeeCreated) {
                // Ensure correct data structure is passed (assuming backend sends data: { employee: {...} })
                onEmployeeCreated(response.data.data.employee);
            }
        } catch (err) {
            console.error('Error creating employee:', err.response?.data || err);
            setError(err.response?.data?.message || 'Failed to add Employee. Make sure email is unique and branch is selected.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Add New Employee</h2>
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

                <div className="form-group">
                    <label htmlFor="employeePassword" className="form-label">Password:</label>
                    <input
                        type="password"
                        id="employeePassword"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        aria-label="Employee Password"
                    />
                </div>

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

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Adding...' : <><FaPlus className="mr-2" /> Add Employee</>}
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

export default CreateEmployeeForm;