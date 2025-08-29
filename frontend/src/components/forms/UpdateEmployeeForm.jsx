// src/components/forms/UpdateEmployeeForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaSave, FaTimes, FaSpinner } from 'react-icons/fa';

const UpdateEmployeeForm = ({ employeeData, onEmployeeUpdated, onCancel, branches, showFlashMessage }) => {
    const [formData, setFormData] = useState({
        name: '',
        mobileNumber: '',
        address: '',
        branchId: '',
        postId: '',
        city: '', // Changed from cityId to city
        adharNo: '',
        panCardNo: '',
        employeeCode: '',
        salary: '',
        bankName: '',
        accountNo: '',
        ifscCode: '',
        status: 'active',
        passportPhoto: null,
        documentPDF: null,
    });

    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState([]);
    // Removed cities state as it's no longer fetched as a dropdown
    // const [cities, setCities] = useState([]);
    const [isDataReady, setIsDataReady] = useState(false);

    useEffect(() => {
        // Function to fetch posts
        const fetchPosts = async () => { // Renamed from fetchPostsAndCities
            try {
                const postsResponse = await api.get('/posts'); // Removed api.get('/cities')
                setPosts(postsResponse.data.data.posts);
                setIsDataReady(true);
            } catch (err) {
                console.error('Error fetching posts:', err); // Updated error message
                showFlashMessage('Could not load Post information.', 'error'); // Updated flash message
                setIsDataReady(false); // Set to false on error to prevent form display
            }
        };

        // Populate fields correctly from employeeData and fetch dropdown options
        if (employeeData) {
            setFormData({
                name: employeeData.name || '',
                mobileNumber: employeeData.mobileNumber || '',
                address: employeeData.address || '',
                branchId: employeeData.branchId?._id || employeeData.branchId || '',
                postId: employeeData.postId?._id || employeeData.postId || '',
                city: employeeData.city || '', // Changed from cityId to city
                adharNo: employeeData.adharNo || '',
                panCardNo: employeeData.panCardNo || '',
                employeeCode: employeeData.employeeCode || '',
                salary: employeeData.salary || '',
                bankName: employeeData.bankName || '',
                accountNo: employeeData.accountNo || '',
                ifscCode: employeeData.ifscCode || '',
                status: employeeData.status || 'active',
                passportPhoto: null, // Reset file input
                documentPDF: null,   // Reset file input
            });
            fetchPosts(); // Call fetchPosts
        }
    }, [employeeData, showFlashMessage]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Manual validation for required fields
        if (!formData.name || !formData.branchId || !formData.city || !formData.postId) {
            showFlashMessage('Please fill in all required fields (Name, Branch, City, and Post).', 'error');
            setLoading(false);
            return;
        }

        const data = new FormData();

        for (const key in formData) {
            const newValue = formData[key];
            const oldValue = employeeData[key];

            // Normalize values for comparison
            const normalizedNewValue = (newValue === null || newValue === undefined) ? '' : newValue;
            const normalizedOldValue = (oldValue === null || oldValue === undefined) ? '' : oldValue;

            // Handle file inputs separately. If a new file exists, append it.
            if (key === 'passportPhoto' || key === 'documentPDF') {
                if (newValue) {
                    data.append(key, newValue);
                }
            }
            // Only append a field if its value has changed (and it's not a file input)
            // For 'city', directly append the new value as it's a string input now
            else if (key === 'city' || normalizedNewValue !== normalizedOldValue) {
                data.append(key, newValue || '');
            }
        }

        try {
            const response = await api.patch(`/employees/${employeeData._id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onEmployeeUpdated(response.data.data.employee);
            showFlashMessage('Employee updated successfully!', 'success');
        } catch (err) {
            console.error('Error updating employee:', err.response || err);
            const rawMessage = err.response?.data?.message || 'Failed to update employee.';
            let userMessage = 'Failed to update employee. Please check the information provided.';

            // Duplicate key error handling
            if (rawMessage.includes('E11000 duplicate key')) {
                const match = rawMessage.match(/index: (\S+)_\d+ dup key: { (\S+):/);
                if (match) {
                    const fieldName = match[1];
                    let fieldNameInEnglish = '';
                    switch (fieldName) {
                        case 'adharNo':
                            fieldNameInEnglish = 'Aadhar number';
                            break;
                        case 'employeeCode':
                            fieldNameInEnglish = 'Employee code';
                            break;
                        case 'mobileNumber':
                            fieldNameInEnglish = 'Mobile number';
                            break;
                        default:
                            fieldNameInEnglish = 'this field';
                    }
                    userMessage = `This ${fieldNameInEnglish} already exists. Please enter the correct ${fieldNameInEnglish}.`;
                } else {
                    userMessage = 'The information provided already exists. Please check.';
                }
            } else if (rawMessage.includes('Please provide the branch ID')) {
                userMessage = 'Selecting a branch is mandatory. Please choose a branch.';
            } else if (rawMessage.includes('Please provide the city name')) { // New validation message
                userMessage = 'Entering a city name is mandatory. Please enter a city.';
            }

            showFlashMessage(userMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isDataReady || !employeeData) {
        return <div className="p-4 text-center text-gray-500">Loading employee data...</div>;
    }

    return (
        <div className="form-container card p-4 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Update Employee</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                    <label htmlFor="name" className="form-label">Full Name:<span className="text-red-500">*</span></label>
                    <input type="text" id="name" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="mobileNumber" className="form-label">Mobile Number:</label>
                    <input type="text" id="mobileNumber" name="mobileNumber" className="form-input" value={formData.mobileNumber} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="address" className="form-label">Address:</label>
                    <input type="text" id="address" name="address" className="form-input" value={formData.address} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="branchId" className="form-label">Branch:<span className="text-red-500">*</span></label>
                    <select id="branchId" name="branchId" className="form-select" value={formData.branchId} onChange={handleChange}>
                        <option value="">Select Branch</option>
                        {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>{branch.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="city" className="form-label">City:<span className="text-red-500">*</span></label>
                    <input type="text" id="city" name="city" className="form-input" value={formData.city} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="postId" className="form-label">Post:<span className="text-red-500">*</span></label>
                    <select id="postId" name="postId" className="form-select" value={formData.postId} onChange={handleChange}>
                        <option value="">Select Post</option>
                        {posts.map(post => (
                            <option key={post._id} value={post._id}>{post.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    {/* The Aadhar number field is not required */}
                    <label htmlFor="adharNo" className="form-label">Aadhar Number:</label>
                    <input type="text" id="adharNo" name="adharNo" className="form-input" value={formData.adharNo} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="panCardNo" className="form-label">PAN Card Number:</label>
                    <input type="text" id="panCardNo" name="panCardNo" className="form-input" value={formData.panCardNo} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="employeeCode" className="form-label">Employee Code:</label>
                    <input type="text" id="employeeCode" name="employeeCode" className="form-input" value={formData.employeeCode} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="salary" className="form-label">Salary:</label>
                    <input type="number" id="salary" name="salary" className="form-input" value={formData.salary} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="bankName" className="form-label">Bank Name:</label>
                    <input type="text" id="bankName" name="bankName" className="form-input" value={formData.bankName} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="accountNo" className="form-label">Account Number:</label>
                    <input type="text" id="accountNo" name="accountNo" className="form-input" value={formData.accountNo} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="ifscCode" className="form-label">IFSC Code:</label>
                    <input type="text" id="ifscCode" name="ifscCode" className="form-input" value={formData.ifscCode} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="status" className="form-label">Status:</label>
                    <select id="status" name="status" className="form-select" value={formData.status} onChange={handleChange}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="passportPhoto" className="form-label">Update Passport Photo:</label>
                    <input type="file" id="passportPhoto" name="passportPhoto" className="form-input" onChange={handleFileChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="documentPDF" className="form-label">Update Document PDF:</label>
                    <input type="file" id="documentPDF" name="documentPDF" className="form-input" onChange={handleFileChange} />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />} Update Employee
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
