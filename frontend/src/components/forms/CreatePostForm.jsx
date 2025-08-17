// frontend/src/components/forms/CreatePostForm.jsx
import React, { useState } from 'react';
import api from '../../utils/api';
import { FaPlus, FaTimes, FaSpinner } from 'react-icons/fa';

const CreatePostForm = ({ onPostCreated, onCancel }) => {
    const [postName, setPostName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await api.post('/posts', { name: postName });
            if (response.data.status === 'success') {
                setSuccess('Post added successfully!');
                setPostName('');
                onPostCreated(); // To refresh the list in the parent component
            } else {
                setError('Failed to add post.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Add New Post</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="postName" className="form-label">Post Name:</label>
                    <input
                        type="text"
                        id="postName"
                        name="postName"
                        className="form-input"
                        value={postName}
                        onChange={(e) => setPostName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaPlus className="mr-2" />} Add Post
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

export default CreatePostForm;