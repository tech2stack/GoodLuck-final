// frontend/src/components/forms/CreateBranchAdminForm.js
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaPlus, FaTimes } from 'react-icons/fa';

const CreateBranchAdminForm = ({ onBranchAdminCreated, onCancel, branches }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
            // --- CHANGE MADE HERE: Removed '/register' from the URL ---
            const response = await api.post('/branch-admins', { name, email, password, branchId });
            // --- END CHANGE ---
            
            setSuccess('Branch Admin added successfully!');
            console.log('New Branch Admin created:', response.data);
            setName('');
            setEmail('');
            setPassword('');
            setBranchId('');

            if (onBranchAdminCreated) {
                onBranchAdminCreated(response.data.data);
            }
        } catch (err) {
            console.error('Error creating branch admin:', err.response?.data || err);
            setError(err.response?.data?.message || 'Failed to add Branch Admin. Make sure email is unique and branch is selected.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Add New Branch Admin</h2>
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