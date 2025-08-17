// frontend/src/components/forms/CreateBranchAdminForm.js
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaPlus, FaTimes } from 'react-icons/fa';

const CreateBranchAdminForm = ({ onBranchAdminCreated, onCancel }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        let timer;
        if (success || error) {
            timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 5000);
        }
        return () => clearTimeout(timer);
    }, [success, error]);

    useEffect(() => {
        const fetchEligibleEmployees = async () => {
            try {
                // Fetch employees with the post 'Store Manager'
                const response = await api.get('/employees/by-role/store_manager');
                // CORRECTED: Access the data correctly from the nested object
                setEmployees(response.data.data.employees);
            } catch (err) {
                console.error('Error fetching employees:', err.response?.data || err);
                setError(err.response?.data?.message || 'Failed to fetch eligible employees.');
            }
        };

        fetchEligibleEmployees();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await api.post('/branch-admins', {
                employeeId: selectedEmployeeId,
                email,
                password,
            });
            setSuccess('Branch admin created successfully!');
            onBranchAdminCreated();
            setSelectedEmployeeId('');
            setEmail('');
            setPassword('');
        } catch (err) {
            console.error('Error creating branch admin:', err.response?.data || err);
            setError(err.response?.data?.message || 'Failed to create branch admin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Create New Branch Admin</h2>
            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="employeeId" className="form-label">Select Employee (Store Manager):</label>
                    <select
                        id="employeeId"
                        className="form-select"
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        required
                        aria-label="Select Employee"
                    >
                        <option value="">-- Select an Employee --</option>
                        {employees.length > 0 ? (
                            employees.map((employee) => (
                                <option key={employee._id} value={employee._id}>
                                    {employee.name}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>No eligible employees found</option>
                        )}
                    </select>
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
                    <label htmlFor="adminPassword" className="form-label">Password:</label>
                    <input
                        type="password"
                        id="adminPassword"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        aria-label="Branch Admin Password"
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Adding...' : <><FaPlus className="mr-2" /> Add Admin</>}
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

export default CreateBranchAdminForm;