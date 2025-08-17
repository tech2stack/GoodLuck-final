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
        cityId: '',
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
    const [cities, setCities] = useState([]);

    useEffect(() => {
        // Populate fields correctly from employeeData
        if (employeeData) {
            setFormData({
                name: employeeData.name || '',
                mobileNumber: employeeData.mobileNumber || '',
                address: employeeData.address || '',
                branchId: employeeData.branchId?._id || employeeData.branchId || '',
                postId: employeeData.postId?._id || employeeData.postId || '',
                cityId: employeeData.cityId?._id || employeeData.cityId || '',
                adharNo: employeeData.adharNo || '',
                panCardNo: employeeData.panCardNo || '',
                employeeCode: employeeData.employeeCode || '',
                salary: employeeData.salary || '',
                bankName: employeeData.bankName || '',
                accountNo: employeeData.accountNo || '',
                ifscCode: employeeData.ifscCode || '',
                status: employeeData.status || 'active',
                passportPhoto: null, // reset file input
                documentPDF: null,   // reset file input
            });
        }

        // Logic to fetch posts and cities
        const fetchPostsAndCities = async () => {
            try {
                const [postsResponse, citiesResponse] = await Promise.all([
                    api.get('/posts'),
                    api.get('/cities')
                ]);
                setPosts(postsResponse.data.data.posts);
                setCities(citiesResponse.data.data.cities || []);
            } catch (err) {
                console.error('Error fetching posts and cities:', err);
                showFlashMessage('Could not load post and city information.', 'error');
            }
        };

        fetchPostsAndCities();
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

        const data = new FormData();
        for (const key in formData) {
            if (formData[key] !== null) {
                data.append(key, formData[key]);
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
            let userMessage = 'Failed to update employee. Please check the information.';

            if (rawMessage.includes('E11000 duplicate key')) {
                if (rawMessage.includes('adharNo')) {
                    userMessage = 'Aadhaar Number already exists. Please enter a correct Aadhaar Number.';
                } else if (rawMessage.includes('employeeCode')) {
                    userMessage = 'Employee Code already exists. Please enter a new code.';
                } else {
                    userMessage = 'The provided information already exists. Please check.';
                }
            } else if (rawMessage.includes('Please provide the branch ID')) {
                userMessage = 'Selecting a branch is mandatory. Please select a branch.';
            }

            showFlashMessage(userMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

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
                    <select id="branchId" name="branchId" className="form-select" value={formData.branchId} onChange={handleChange} required>
                        <option value="">Select Branch</option>
                        {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>{branch.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="cityId" className="form-label">City:<span className="text-red-500">*</span></label>
                    <select id="cityId" name="cityId" className="form-select" value={formData.cityId} onChange={handleChange} required>
                        <option value="">Select City</option>
                        {cities.map(city => (
                            <option key={city._id} value={city._id}>{city.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="postId" className="form-label">Post:<span className="text-red-500">*</span></label>
                    <select id="postId" name="postId" className="form-select" value={formData.postId} onChange={handleChange} required>
                        <option value="">Select Post</option>
                        {posts.map(post => (
                            <option key={post._id} value={post._id}>{post.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="adharNo" className="form-label">Aadhaar Number:</label>
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
