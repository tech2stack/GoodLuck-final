// src/components/forms/CreateStockManagerForm.jsx
import React, { useState } from 'react';
import api from '../../services/api';
import '../../styles/Form.css'; // Assuming you have a general form stylesheet
import { FaTimes } from 'react-icons/fa';

const CreateStockManagerForm = ({ onStockManagerCreated, onCancel, showFlashMessage }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/stock-managers', formData); // Make sure your backend route exists
            showFlashMessage(response.data.message || 'Stock Manager created successfully!', 'success');
            onStockManagerCreated(response.data.data);
            setFormData({ name: '', email: '', phone: '', password: '', address: '' }); // Clear form
        } catch (err) {
            console.error('Error creating stock manager:', err.response || err);
            showFlashMessage(err.response?.data?.message || 'Failed to create Stock Manager.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container-card">
            <div className="form-header">
                <h2 className="form-title">Create New Stock Manager</h2>
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
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
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
                        {loading ? 'Creating...' : 'Create Stock Manager'}
                    </button>
                    <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateStockManagerForm;