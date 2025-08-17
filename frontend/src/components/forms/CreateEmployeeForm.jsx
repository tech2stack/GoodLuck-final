// src/components/forms/CreateEmployeeForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaPlus, FaTimes, FaSpinner } from 'react-icons/fa';

const CreateEmployeeForm = ({ onEmployeeCreated, onCancel, branches, showFlashMessage }) => {
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
        passportPhoto: null,
        documentPDF: null,
    });

    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState([]);
    const [cities, setCities] = useState([]);

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

    useEffect(() => {
        fetchPostsAndCities();
    }, []);

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
            if (formData[key]) {
                data.append(key, formData[key]);
            }
        }

        try {
            const response = await api.post('/employees', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            onEmployeeCreated(response.data.data.employee);
            showFlashMessage('Employee added successfully!', 'success');
        } catch (err) {
            console.error('Error creating employee:', err.response || err);
            const rawMessage = err.response?.data?.message || 'Failed to create employee.';
            let userMessage = 'Failed to create employee. Please check the information.';

            // Specific message for E11000 error
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
            <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                    <label htmlFor="name" className="form-label">Full Name:</label>
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
                    <label htmlFor="branchId" className="form-label">Branch:*</label>
                    <select id="branchId" name="branchId" className="form-select" value={formData.branchId} onChange={handleChange} required>
                        <option value="">Select Branch</option>
                        {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>{branch.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="cityId" className="form-label">City:*</label>
                    <select id="cityId" name="cityId" className="form-select" value={formData.cityId} onChange={handleChange} required>
                        <option value="">Select City</option>
                        {cities.map(city => (
                            <option key={city._id} value={city._id}>{city.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="postId" className="form-label">Post:*</label>
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
                    <label htmlFor="passportPhoto" className="form-label">Passport Photo:</label>
                    <input type="file" id="passportPhoto" name="passportPhoto" className="form-input" onChange={handleFileChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="documentPDF" className="form-label">Document PDF:</label>
                    <input type="file" id="documentPDF" name="documentPDF" className="form-input" onChange={handleFileChange} />
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <FaSpinner className="animate-spin mr-2" /> : <><FaPlus className="mr-2" /> Add Employee</>}
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