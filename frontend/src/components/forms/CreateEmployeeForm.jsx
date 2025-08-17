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
        bankDetail: '',
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
            // Calling the showFlashMessage prop correctly
            showFlashMessage('Failed to load posts or cities.', 'error');
        }
    };

    useEffect(() => {
        fetchPostsAndCities();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData(prev => ({ ...prev, [name]: files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Find the selected post to check its name for conditional validation
        const selectedPost = posts.find(post => post._id === formData.postId);

        // Check if the selected post is 'Store Manager' and if branchId is missing
        if (selectedPost && selectedPost.name === 'Store Manager' && !formData.branchId) {
            // Calling the showFlashMessage prop correctly
            showFlashMessage('A branch must be assigned to a Store Manager.', 'error');
            return; // Stop form submission
        }

        setLoading(true);
        const employeeData = new FormData();
        for (const key in formData) {
            if (formData[key]) {
                employeeData.append(key, formData[key]);
            }
        }

        try {
            const response = await api.post('/employees', employeeData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onEmployeeCreated(response.data.data.employee);
            // Calling the showFlashMessage prop correctly
            showFlashMessage('Employee added successfully!', 'success');
        } catch (err) {
            console.error('Error creating employee:', err);
            // Calling the showFlashMessage prop correctly
            showFlashMessage(`Failed to create employee: ${err.response?.data?.message || err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2 className="form-title">Add New Employee</h2>
            <form onSubmit={handleSubmit} className="employee-form-grid">

                <div className="form-group">
                    <label htmlFor="name" className="form-label">Name:</label>
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
                    <label htmlFor="branchId" className="form-label">Branch:</label>
                    <select id="branchId" name="branchId" className="form-input" value={formData.branchId} onChange={handleChange}>
                        <option value="">Select Branch</option>
                        {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>{branch.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="postId" className="form-label">Post:</label>
                    <select id="postId" name="postId" className="form-input" value={formData.postId} onChange={handleChange} required>
                        <option value="">Select Post</option>
                        {posts.map(post => (
                            <option key={post._id} value={post._id}>{post.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="cityId" className="form-label">City:</label>
                    <select id="cityId" name="cityId" className="form-input" value={formData.cityId} onChange={handleChange} required>
                        <option value="">Select City</option>
                        {cities.map(city => (
                            <option key={city._id} value={city._id}>{city.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="adharNo" className="form-label">Adhaar No:</label>
                    <input type="text" id="adharNo" name="adharNo" className="form-input" value={formData.adharNo} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="panCardNo" className="form-label">PAN Card No:</label>
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
                    <label htmlFor="bankDetail" className="form-label">Bank Detail:</label>
                    <input type="text" id="bankDetail" name="bankDetail" className="form-input" value={formData.bankDetail} onChange={handleChange} />
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