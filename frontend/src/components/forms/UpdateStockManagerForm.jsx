// src/components/forms/UpdateStockManagerForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import '../../styles/Form.css'; // Assuming you have a general form stylesheet
import { FaTimes } from 'react-icons/fa';

const UpdateStockManagerForm = ({ managerData, onStockManagerUpdated, onCancel, showFlashMessage }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    // Removed: const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (managerData) {
            setFormData({
                name: managerData.name || '',
                email: managerData.email || '',
                phone: managerData.phone || '',
                address: managerData.address || ''
            });
            // Removed: setNewPassword(''); // Clear new password field on data load
        }
    }, [managerData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Removed: const handlePasswordChange = (e) => { setNewPassword(e.target.value); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const dataToSend = { ...formData };
        // Removed: if (newPassword) { dataToSend.password = newPassword; }

        try {
            const response = await api.put(`/stock-managers/${managerData._id}`, dataToSend); // Make sure your backend route exists
            showFlashMessage(response.data.message || 'Stock Manager updated successfully!', 'success');
            onStockManagerUpdated(response.data.data);
        } catch (err) {
            console.error('Error updating stock manager:', err.response || err);
            showFlashMessage(err.response?.data?.message || 'Failed to update Stock Manager.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!managerData) {
        return <div className="form-container-card"><p>No Stock Manager data to update.</p></div>;
    }

    return (
        <div className="form-container-card">
            <div className="form-header">
                <h2 className="form-title">Update Stock Manager</h2>
                <button onClick={onCancel} className="close-button">
                    <FaTimes />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="app-form">
                <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="phone">Phone:</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>
                {/* REMOVED: Password Field */}
                {/*
                <div className="form-group">
                    <label htmlFor="newPassword">New Password (leave blank to keep current):</label>
                    <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                    />
                </div>
                */}
                <div className="form-group">
                    <label htmlFor="address">Address:</label>
                    <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        required
                    ></textarea>
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Stock Manager'}
                    </button>
                    <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UpdateStockManagerForm;