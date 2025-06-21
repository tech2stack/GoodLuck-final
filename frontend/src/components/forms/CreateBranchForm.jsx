// src/components/forms/CreateBranchForm.jsx
import React, { useState } from 'react';
import api from '../../utils/api'; // Ensure this path is correct for your API client
import { FaPlus, FaTimes, FaSpinner } from 'react-icons/fa'; // Added FaSpinner for loading state

// Assuming you have a CSS file for this form.
// import '../../styles/forms/FormStyles.css'; // Adjust path if necessary

const CreateBranchForm = ({ onBranchCreated, onCancel, showFlashMessage }) => {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        shopOwnerName: '',
        shopGstId: '',
        address: '',
        mobileNumber: '',
        logoFile: null, // This will hold the File object for upload
        status: 'active', // Default status for new branch
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Handle input changes for all fields dynamically
    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            // Store the actual File object
            setFormData(prevData => ({
                ...prevData,
                logoFile: files[0] // Get the first file from the FileList
            }));
        } else {
            setFormData(prevData => ({
                ...prevData,
                [name]: value
            }));
        }

        // Clear existing error for the field as user types
        if (errors[name]) {
            setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({}); // Clear previous form errors
        setLoading(true);

        // --- Frontend Validation (Client-side) ---
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Branch name is required.';
        if (!formData.shopOwnerName.trim()) newErrors.shopOwnerName = 'Shop owner name is required.';
        if (!formData.address.trim()) newErrors.address = 'Address is required.';

        // Optional fields validation (only if provided and invalid)
        if (formData.mobileNumber.trim() && !/^\d{10}$/.test(formData.mobileNumber)) {
            newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showFlashMessage('Please correct the errors in the form.', 'error');
            setLoading(false);
            return;
        }

        // Create FormData object to send both text and file data
        const dataToSend = new FormData();
        dataToSend.append('name', formData.name);
        dataToSend.append('location', formData.location);
        dataToSend.append('shopOwnerName', formData.shopOwnerName);
        dataToSend.append('address', formData.address);

        // Only append optional fields if they have a value
        if (formData.shopGstId.trim()) {
            dataToSend.append('shopGstId', formData.shopGstId);
        }
        if (formData.mobileNumber.trim()) {
            dataToSend.append('mobileNumber', formData.mobileNumber);
        }
        if (formData.logoFile) {
            dataToSend.append('logoImage', formData.logoFile); // 'logoImage' must match the Multer field name in backend
        }
        dataToSend.append('status', formData.status);


        try {
            const response = await api.post('/branches', dataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                },
            });
            console.log('New branch created:', response.data);

            showFlashMessage('Branch added successfully!', 'success');
            setFormData({ // Clear form fields after successful submission
                name: '',
                location: '',
                shopOwnerName: '',
                shopGstId: '',
                address: '',
                mobileNumber: '',
                logoFile: null, // Clear the file input state
                status: 'active',
            });
            // Reset the file input element visually. This clears the selected file name in the UI.
            // This is a DOM manipulation trick for file inputs.
            if (e.target.elements.logoImage) { // Check if the element exists
                e.target.elements.logoImage.value = '';
            }
            onBranchCreated(response.data.data); // Notify parent component with new branch data
        } catch (err) {
            console.error('Error creating branch:', err.response?.data || err);
            const apiErrorMessage = err.response?.data?.message || 'Failed to add branch. Please try again.';
            // Backend might send detailed errors object, merge them
            setErrors(err.response?.data?.errors || {});
            showFlashMessage(apiErrorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Add New Branch</h2>
            <form onSubmit={handleSubmit} className="form-content">
                {/* General error message if not field-specific */}
                {errors.general && <p className="error-message">{errors.general}</p>}

                <div className="form-group">
                    <label htmlFor="name" className="form-label">Branch Name: <span className="required-asterisk">*</span></label>
                    <input
                        type="text"
                        id="name"
                        className={`form-input ${errors.name ? 'is-invalid' : ''}`}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        aria-label="Branch Name"
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="location" className="form-label">Location:</label>
                    <input
                        type="text"
                        id="location"
                        className={`form-input ${errors.location ? 'is-invalid' : ''}`}
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        aria-label="Branch Location"
                    />
                    {errors.location && <div className="invalid-feedback">{errors.location}</div>}
                </div>

                {/* New Field: Shop Owner Name */}
                <div className="form-group">
                    <label htmlFor="shopOwnerName" className="form-label">Shop Owner Name: <span className="required-asterisk">*</span></label>
                    <input
                        type="text"
                        id="shopOwnerName"
                        className={`form-input ${errors.shopOwnerName ? 'is-invalid' : ''}`}
                        name="shopOwnerName"
                        value={formData.shopOwnerName}
                        onChange={handleChange}
                        required
                        aria-label="Shop Owner Name"
                    />
                    {errors.shopOwnerName && <div className="invalid-feedback">{errors.shopOwnerName}</div>}
                </div>

                {/* New Field: Shop GST ID (Optional) */}
                <div className="form-group">
                    <label htmlFor="shopGstId" className="form-label">Shop GST ID:</label>
                    <input
                        type="text"
                        id="shopGstId"
                        className={`form-input ${errors.shopGstId ? 'is-invalid' : ''}`}
                        name="shopGstId"
                        value={formData.shopGstId}
                        onChange={handleChange}
                        aria-label="Shop GST ID"
                    />
                    {errors.shopGstId && <div className="invalid-feedback">{errors.shopGstId}</div>}
                </div>

                {/* New Field: Address */}
                <div className="form-group">
                    <label htmlFor="address" className="form-label">Address: <span className="required-asterisk">*</span></label>
                    <textarea
                        id="address"
                        className={`form-input ${errors.address ? 'is-invalid' : ''}`}
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        rows="3"
                        aria-label="Branch Address"
                    ></textarea>
                    {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                </div>

                {/* New Field: Mobile Number (Optional) */}
                <div className="form-group">
                    <label htmlFor="mobileNumber" className="form-label">Mobile Number:</label>
                    <input
                        type="tel"
                        id="mobileNumber"
                        className={`form-input ${errors.mobileNumber ? 'is-invalid' : ''}`}
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        pattern="\d{10}"
                        title="Please enter a 10-digit mobile number"
                        aria-label="Mobile Number"
                    />
                    {errors.mobileNumber && <div className="invalid-feedback">{errors.mobileNumber}</div>}
                </div>

                {/* New Field: Logo Image (File Input) */}
                <div className="form-group">
                    <label htmlFor="logoImage" className="form-label">Logo Image:</label>
                    <input
                        type="file"
                        id="logoImage"
                        className={`form-input-file ${errors.logoFile ? 'is-invalid' : ''}`}
                        name="logoImage" // This name must match the Multer field name in backend
                        accept="image/*" // Only allow image files
                        onChange={handleChange}
                        aria-label="Logo Image Upload"
                    />
                    {errors.logoFile && <div className="invalid-feedback">{errors.logoFile}</div>}
                    <small className="form-text text-muted">Select an image file (e.g., .jpg, .png, .gif) for the branch logo.</small>
                    {formData.logoFile && (
                        <p className="mt-2 text-success">Selected file: {formData.logoFile.name}</p>
                    )}
                </div>

                {/* Existing Status Field */}
                <div className="form-group">
                    <label htmlFor="status" className="form-label">Status:</label>
                    <select
                        id="status"
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        required
                        aria-label="Branch Status"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <> <FaSpinner className="fa-spin mr-2" /> Adding... </> : <><FaPlus className="mr-2" /> Add Branch</>}
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

export default CreateBranchForm;