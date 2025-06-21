// src/components/forms/UpdateBranchForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Make sure your api service is correctly configured
import { FaSave, FaTimes, FaSpinner } from 'react-icons/fa'; // Added FaSpinner

// Assuming you have a CSS file for this form.
// import '../../styles/forms/FormStyles.css'; // Adjust path if necessary

const UpdateBranchForm = ({ branchData, onBranchUpdated, onCancel, showFlashMessage }) => { // Added showFlashMessage prop
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        shopOwnerName: '', // New field
        shopGstId: '',     // New field
        address: '',       // New field
        mobileNumber: '',  // New field
        logoFile: null,    // For new file upload
        existingLogoUrl: '', // To display current logo if available
        status: 'active',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({}); // For field-specific validation errors

    // Populate form fields with existing branch data when component mounts or branchData changes
    useEffect(() => {
        if (branchData) {
            setFormData({
                name: branchData.name || '',
                location: branchData.location || '',
                shopOwnerName: branchData.shopOwnerName || '',
                shopGstId: branchData.shopGstId || '',
                address: branchData.address || '',
                mobileNumber: branchData.mobileNumber || '',
                logoFile: null, // Reset file input when new data loads
                existingLogoUrl: branchData.logoImage ? `${api.defaults.baseURL}${branchData.logoImage}` : '', // Assuming your backend serves static files
                status: branchData.status || 'active',
            });
            setErrors({}); // Clear any previous errors on new data load
        }
    }, [branchData]);

    // Removed the internal success/error state and useEffect for clearing them,
    // as we'll now use the showFlashMessage prop from SuperAdminDashboard.

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            setFormData(prevData => ({
                ...prevData,
                logoFile: files[0] // Store the actual File object
            }));
            // Optionally, clear existing logo URL if a new file is selected
            if (files[0]) {
                setFormData(prevData => ({
                    ...prevData,
                    existingLogoUrl: '' // Clear existing URL preview if a new file is chosen
                }));
            }
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
        setLoading(true);
        setErrors({}); // Clear previous form errors

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

        const dataToUpdate = new FormData();
        dataToUpdate.append('name', formData.name);
        dataToUpdate.append('location', formData.location);
        dataToUpdate.append('shopOwnerName', formData.shopOwnerName);
        dataToUpdate.append('address', formData.address);
        dataToUpdate.append('status', formData.status);

        // Append optional fields only if they have a value
        if (formData.shopGstId.trim()) {
            dataToUpdate.append('shopGstId', formData.shopGstId);
        } else {
             // If shopGstId is intentionally cleared, send an empty string
             dataToUpdate.append('shopGstId', '');
        }

        if (formData.mobileNumber.trim()) {
            dataToUpdate.append('mobileNumber', formData.mobileNumber);
        } else {
            // If mobileNumber is intentionally cleared, send an empty string
            dataToUpdate.append('mobileNumber', '');
        }

        // Only append logoFile if a new one is selected
        if (formData.logoFile) {
            dataToUpdate.append('logoImage', formData.logoFile); // 'logoImage' must match Multer field name
        }


        try {
            const response = await api.patch(`/branches/${branchData._id}`, dataToUpdate, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                },
            });
            showFlashMessage('Branch updated successfully!', 'success');
            console.log('Branch updated:', response.data);

            if (onBranchUpdated) {
                onBranchUpdated(response.data.data); // Notify parent component (SuperAdminDashboard)
            }
        } catch (err) {
            console.error('Error updating branch:', err.response?.data || err);
            const apiErrorMessage = err.response?.data?.message || 'Failed to update branch. Please try again.';
            setErrors(err.response?.data?.errors || {}); // Set specific errors if backend provides them
            showFlashMessage(apiErrorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Update Branch</h2>
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

                {/* New Field: Logo Image (File Input & Existing Preview) */}
                <div className="form-group">
                    <label htmlFor="logoImage" className="form-label">Logo Image:</label>
                    {formData.existingLogoUrl && !formData.logoFile && (
                        <div className="current-logo-preview">
                            <p>Current Logo:</p>
                            <img src={formData.existingLogoUrl} alt="Current Branch Logo" style={{ maxWidth: '100px', maxHeight: '100px', border: '1px solid #ddd', padding: '5px' }} />
                        </div>
                    )}
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
                    <small className="form-text text-muted">Select a new image file to update the branch logo. If no new file is selected, the existing logo will be retained.</small>
                    {formData.logoFile && (
                        <p className="mt-2 text-success">New file selected: {formData.logoFile.name}</p>
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
                        {loading ? <> <FaSpinner className="fa-spin mr-2" /> Updating... </> : <><FaSave className="mr-2" /> Update Branch</>}
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

export default UpdateBranchForm;