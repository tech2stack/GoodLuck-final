import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaPlus, FaTimes } from 'react-icons/fa';

const CreateEmployeeForm = ({ onEmployeeCreated, onCancel, branches }) => {
    const [name, setName] = useState('');
    const [mobileNumber, setMobileNumber] = useState(''); // Replaced email with mobileNumber
    const [address, setAddress] = useState('');           // New field: address
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
            // Updated payload to send mobileNumber and address
            const response = await api.post('/employees', { name, mobileNumber, address, branchId });

            setSuccess('Employee added successfully!');
            console.log('New Employee created:', response.data);
            setName('');
            setMobileNumber(''); // Reset mobileNumber
            setAddress('');       // Reset address
            setBranchId('');

            if (onEmployeeCreated) {
                onEmployeeCreated(response.data.data.employee);
            }
        } catch (err) {
            console.error('Error creating employee:', err.response?.data || err);
            setError(err.response?.data?.message || 'Failed to add Employee. Make sure mobile number is unique and branch is selected.');
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
                    <label htmlFor="employeeMobileNumber" className="form-label">Mobile Number:</label>
                    <input
                        type="tel" // Use 'tel' type for phone numbers
                        id="employeeMobileNumber"
                        className="form-input"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        required
                        aria-label="Employee Mobile Number"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="employeeAddress" className="form-label">Address:</label>
                    <textarea
                        id="employeeAddress"
                        className="form-input"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        aria-label="Employee Address"
                        rows="3"
                    ></textarea>
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