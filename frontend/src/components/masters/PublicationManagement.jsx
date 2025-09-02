import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api';
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaTimes, FaSpinner } from 'react-icons/fa';
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

// Stylesheets (assuming these are already present and styled for consistency)
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';
import '../../styles/PublicationManagement.css';
import '../../styles/CommonLayout.css';

// Import the logo image directly
import companyLogo from '../../assets/glbs-logo.jpg';
import { addHeaderAndSetStartY, addReportTitle, addTableToDoc } from '../../utils/pdfTheme';

const PublicationManagement = ({ showFlashMessage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [publications, setPublications] = useState([]);
    const [cities, setCities] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        personName: '',
        city: '',
        mobileNumber: '',
        bank: '',
        accountNumber: '',
        ifsc: '',
        gstin: '',
        address: '',
        status: 'active',
        publicationType: 'Private Pub'
    });
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [editingPublicationId, setEditingPublicationId] = useState(null);
    const [highlightedPublicationId, setHighlightedPublicationId] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [publicationToDeleteId, setPublicationToDeleteId] = useState(null);
    const [publicationToDeleteName, setPublicationToDeleteName] = useState('');
    const [showSubtitleModal, setShowSubtitleModal] = useState(false);
    const [selectedPublicationForSubtitle, setSelectedPublicationForSubtitle] = useState(null);
    const [newSubtitleName, setNewSubtitleName] = useState('');
    const [newSubtitleDiscount, setNewSubtitleDiscount] = useState(0);
    const [subtitleModalLoading, setSubtitleModalLoading] = useState(false);
    const [subtitleModalError, setSubtitleModalError] = useState(null);
    const [newPublicationSubtitles, setNewPublicationSubtitles] = useState([]);
    const [editingSubtitleId, setEditingSubtitleId] = useState(null);
    const tableBodyRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [publicationTypeFilter, setPublicationTypeFilter] = useState('all');
    const [publicationNameFilter, setPublicationNameFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const initialFormData = {
        name: '', personName: '', city: '',
        mobileNumber: '', bank: '', accountNumber: '', ifsc: '', gstin: '',
        address: '', status: 'active', publicationType: 'Private Pub'
    };

    const formatDateWithTime = (dateString) => {
        if (!dateString) return 'N/A';
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', options);
    };

    const fetchPublications = useCallback(async () => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get(`/publications`);
            if (response.data.status === 'success') {
                const sorted = response.data.data.publications.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                setPublications(sorted);
                const totalPagesCalculated = Math.ceil(sorted.length / itemsPerPage);
                if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
                    setCurrentPage(totalPagesCalculated);
                } else if (sorted.length === 0) {
                    setCurrentPage(1);
                }
            } else {
                setLocalError(response.data.message || 'Failed to fetch publications.');
            }
        } catch (err) {
            console.error('Error fetching publications:', err);
            setLocalError(err.response?.data?.message || 'Failed to load publications due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage]);

    const fetchCitiesForLookup = useCallback(async () => {
        try {
            const response = await api.get('/cities?status=active&limit=1000');
            if (response.data.status === 'success') {
                setCities(response.data.data.cities || []);
            } else {
                console.error('Failed to fetch cities for lookup:', response.data.message);
                showFlashMessage('Failed to load cities for lookup.', 'error');
            }
        } catch (err) {
            console.error('Error fetching cities for lookup:', err);
            showFlashMessage('Network error fetching cities for lookup.', 'error');
        }
    }, [showFlashMessage]);

    useEffect(() => {
        fetchPublications();
    }, [fetchPublications]);

    useEffect(() => {
        fetchCitiesForLookup();
    }, [fetchCitiesForLookup]);

    useEffect(() => {
        console.log("PDF Libraries Check (PublicationManagement):");
        console.log("window.jspdf (global object):", typeof window.jspdf);
        console.log("window.jspdf.jsPDF (constructor):", typeof window.jspdf?.jsPDF);
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        if (!formData.name.trim()) {
            setLocalError('Publication Name is required.');
            showFlashMessage('Publication Name is required.', 'error');
            setLoading(false);
            return;
        }

        let cityIdToUse = '';
        const enteredCityName = formData.city.trim();

        try {
            if (enteredCityName) {
                let existingCity = cities.find(c => c && c.name && c.name.toLowerCase() === enteredCityName.toLowerCase());
                if (existingCity) {
                    cityIdToUse = existingCity._id;
                } else {
                    const newCityResponse = await api.post('/cities', { name: enteredCityName, status: 'active' });
                    if (newCityResponse.data.status === 'success') {
                        cityIdToUse = newCityResponse.data.data.city._id;
                        showFlashMessage(`New city "${enteredCityName}" created successfully!`, 'success');
                        await fetchCitiesForLookup();
                    } else {
                        throw new Error(newCityResponse.data.message || 'Failed to create new city.');
                    }
                }
            }

            const publicationData = { ...formData, city: cityIdToUse || undefined };

            if (editingPublicationId) {
                // Update case
                const response = await api.patch(`/publications/${editingPublicationId}`, publicationData);
                if (response.data.status === 'success') {
                    const updatedPublication = response.data.data.publication;
                    // Update the local state immediately
                    setPublications(prev =>
                        prev.map(pub =>
                            pub._id === editingPublicationId
                                ? { ...pub, ...updatedPublication, city: cities.find(c => c._id === cityIdToUse) || { name: enteredCityName } }
                                : pub
                        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    );
                    showFlashMessage('Publication updated successfully!', 'success');
                    // Reset all states after a successful update
                    setFormData(initialFormData);
                    setEditingPublicationId(null);
                    setSelectedPublicationForSubtitle(null);
                    setNewPublicationSubtitles([]);
                    setHighlightedPublicationId(null);
                    // Optionally fetch publications in the background to ensure sync
                    fetchPublications();
                } else {
                    throw new Error(response.data.message || 'Failed to update publication.');
                }
            } else {
                // Create case
                const newPublicationData = {
                    ...publicationData,
                    subtitles: newPublicationSubtitles.map(s => ({ name: s.name, discount: s.discount }))
                };
                const response = await api.post('/publications', newPublicationData);
                if (response.data.status === 'success') {
                    const newPublication = response.data.data.publication;
                    // Update the local state immediately
                    setPublications(prev => [
                        { ...newPublication, city: cities.find(c => c._id === cityIdToUse) || { name: enteredCityName } },
                        ...prev
                    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                    setCurrentPage(1);
                    setHighlightedPublicationId(newPublication._id);
                    showFlashMessage('Publication created successfully!', 'success');
                    // Reset all states after a successful creation
                    setFormData(initialFormData);
                    setEditingPublicationId(null);
                    setSelectedPublicationForSubtitle(null);
                    setNewPublicationSubtitles([]);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    // Optionally fetch publications in the background to ensure sync
                    fetchPublications();
                } else {
                    throw new Error(response.data.message || 'Failed to create publication.');
                }
            }
        } catch (err) {
            console.error('Error saving publication:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save publication. Please check your input.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (publicationItem) => {
        setFormData({
            name: publicationItem.name,
            personName: publicationItem.personName,
            city: publicationItem.city ? publicationItem.city.name : '',
            mobileNumber: publicationItem.mobileNumber,
            bank: publicationItem.bank,
            accountNumber: publicationItem.accountNumber,
            ifsc: publicationItem.ifsc,
            gstin: publicationItem.gstin,
            address: publicationItem.address,
            status: publicationItem.status,
            publicationType: publicationItem.publicationType
        });
        setEditingPublicationId(publicationItem._id);
        setSelectedPublicationForSubtitle(publicationItem);
        setNewPublicationSubtitles([]);
        setLocalError(null);
        setHighlightedPublicationId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openConfirmModal = (publicationItem) => {
        setPublicationToDeleteId(publicationItem._id);
        setPublicationToDeleteName(publicationItem.name);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setPublicationToDeleteId(null);
        setPublicationToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/publications/${publicationToDeleteId}`);
            if (response.status === 204) {
                showFlashMessage('Publication deleted successfully!', 'success');
                setPublications(prev => prev.filter(pub => pub._id !== publicationToDeleteId));
                const totalPagesCalculated = Math.ceil((filteredPublications.length - 1) / itemsPerPage);
                if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
                    setCurrentPage(totalPagesCalculated);
                } else if (filteredPublications.length - 1 === 0) {
                    setCurrentPage(1);
                }
            } else {
                throw new Error(response.data?.message || 'Failed to delete publication.');
            }
        } catch (err) {
            console.error('Error deleting publication:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete publication.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSubtitleModalFromForm = () => {
        setNewSubtitleName('');
        setNewSubtitleDiscount(0);
        setEditingSubtitleId(null);
        setSubtitleModalError(null);
        setShowSubtitleModal(true);
    };

    const handleEditSubtitle = (subtitle, publication) => {
        setNewSubtitleName(subtitle.name);
        setNewSubtitleDiscount(subtitle.discount);
        setEditingSubtitleId(subtitle._id);
        setSelectedPublicationForSubtitle(publication);
        setSubtitleModalError(null);
        setShowSubtitleModal(true);
    };

    const closeSubtitleModal = () => {
        setShowSubtitleModal(false);
        setNewSubtitleName('');
        setNewSubtitleDiscount(0);
        setEditingSubtitleId(null);
        setSubtitleModalError(null);
    };

    const handleAddSubtitle = async (e) => {
        e.preventDefault();
        setSubtitleModalLoading(true);
        setSubtitleModalError(null);

        if (!newSubtitleName.trim()) {
            setSubtitleModalError('Subtitle name cannot be empty.');
            setSubtitleModalLoading(false);
            return;
        }

        if (editingSubtitleId) {
            try {
                const response = await api.patch(`/publications/subtitles/${editingSubtitleId}`, {
                    name: newSubtitleName.trim(),
                    discount: newSubtitleDiscount
                });
                if (response.data.status === 'success') {
                    showFlashMessage('Subtitle updated successfully!', 'success');
                    closeSubtitleModal();
                    fetchPublications();
                } else {
                    throw new Error(response.data.message || 'Failed to update subtitle.');
                }
            } catch (err) {
                console.error('Error updating subtitle:', err);
                const errorMessage = err.response?.data?.message || 'Failed to update subtitle.';
                setSubtitleModalError(errorMessage);
                showFlashMessage(errorMessage, 'error');
            } finally {
                setSubtitleModalLoading(false);
            }
        } else {
            if (editingPublicationId) {
                try {
                    const response = await api.post(`/publications/${editingPublicationId}/subtitles`, {
                        name: newSubtitleName.trim(),
                        discount: newSubtitleDiscount
                    });
                    if (response.data.status === 'success') {
                        showFlashMessage('Subtitle added successfully!', 'success');
                        closeSubtitleModal();
                        fetchPublications();
                    } else {
                        throw new Error(response.data.message || 'Failed to add subtitle.');
                    }
                } catch (err) {
                    console.error('Error adding subtitle:', err);
                    const errorMessage = err.response?.data?.message || 'Failed to add subtitle.';
                    setSubtitleModalError(errorMessage);
                    showFlashMessage(errorMessage, 'error');
                } finally {
                    setSubtitleModalLoading(false);
                }
            } else {
                const tempSubtitle = {
                    _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: newSubtitleName.trim(),
                    discount: newSubtitleDiscount
                };
                setNewPublicationSubtitles(prev => [...prev, tempSubtitle]);
                showFlashMessage('Subtitle added temporarily. It will be saved with the new publication.', 'info');
                closeSubtitleModal();
                setSubtitleModalLoading(false);
            }
        }
    };

    const handleRemoveSubtitle = async (subtitleId, publicationId, subtitleName) => {
        const isConfirmed = window.confirm(`Are you sure you want to remove subtitle "${subtitleName}"?`);

        if (!isConfirmed) {
            return;
        }

        setLoading(true);
        setLocalError(null);

        if (publicationId) {
            try {
                const response = await api.delete(`/publications/subtitles/${subtitleId}`);
                if (response.status === 204) {
                    showFlashMessage('Subtitle removed successfully!', 'success');
                    fetchPublications();
                } else {
                    throw new Error(response.data?.message || 'Failed to remove subtitle.');
                }
            } catch (err) {
                console.error('Error removing subtitle:', err);
                const errorMessage = err.response?.data?.message || 'Failed to remove subtitle.';
                setLocalError(errorMessage);
                showFlashMessage(errorMessage, 'error');
            } finally {
                setLoading(false);
            }
        } else {
            setNewPublicationSubtitles(prev => prev.filter(sub => sub._id !== subtitleId));
            showFlashMessage('Subtitle removed temporarily.', 'info');
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData(initialFormData);
        setEditingPublicationId(null);
        setSelectedPublicationForSubtitle(null);
        setNewPublicationSubtitles([]);
        setLocalError(null);
        setHighlightedPublicationId(null);
    };

    const filteredPublications = publications.filter((publicationItem) => {
        if (!publicationItem) return false;

        const matchesType =
            publicationTypeFilter === 'all' ||
            publicationItem.publicationType === publicationTypeFilter;

        const matchesName =
            publicationNameFilter === 'all' ||
            publicationItem.name === publicationNameFilter;

        const matchesSearch =
            publicationItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            publicationItem.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (publicationItem.city &&
                publicationItem.city.name &&
                publicationItem.city.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (publicationItem.mobileNumber &&
                publicationItem.mobileNumber.includes(searchTerm)) ||
            (publicationItem.gstin &&
                publicationItem.gstin.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (Array.isArray(publicationItem.subtitles) &&
                publicationItem.subtitles.some(
                    (sub) =>
                        sub && sub.name && sub.name.toLowerCase().includes(searchTerm.toLowerCase())
                ));

        return matchesType && matchesName && matchesSearch;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPublications = filteredPublications.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPublications.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const downloadPdf = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation failed: Core libraries are not loaded. Please check your script links.', 'error');
            console.error("PDF generation failed: window.jspdf is not available. Ensure CDNs for jsPDF are correctly linked in your HTML file.");
            return;
        }

        const doc = new window.jspdf.jsPDF('p', 'mm', 'a4');
        let startY = addHeaderAndSetStartY(doc, companyLogo, 25, 22);
        startY = addReportTitle(doc, startY, "Publications Report");

        const tableColumn = ["S.No.", "Publication Name", "City", "Total Subtitles", "Status"];
        const tableRows = filteredPublications.map((pub, index) => [
            index + 1,
            pub.name,
            pub.city?.name || 'N/A',
            pub.subtitles.length,
            pub.status
        ]);

        addTableToDoc(doc, tableColumn, tableRows, startY);
        doc.save(`Publications_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
        showFlashMessage('Publications list downloaded as PDF!', 'success');
    };

    return (
        <div className="publication-management-container">
            <h2 className="main-section-title">Publication Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            <div className="main-content-layout">
                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        <h3 className="form-title">{editingPublicationId ? 'Edit Publication' : 'Publication Details'}</h3>
                        <div className="form-group publication-type-radio-group">
                            <label>Publishers Detail:</label>
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        name="publicationType"
                                        value="Private Pub"
                                        checked={formData.publicationType === 'Private Pub'}
                                        onChange={handleChange}
                                        disabled={loading}
                                    /> Private
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="publicationType"
                                        value="Govt. Pub"
                                        checked={formData.publicationType === 'Govt. Pub'}
                                        onChange={handleChange}
                                        disabled={loading}
                                    /> Govt.
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="publicationType"
                                        value="Other Pub"
                                        checked={formData.publicationType === 'Other Pub'}
                                        onChange={handleChange}
                                        disabled={loading}
                                    /> Other
                                </label>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">Publication Name:</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g., NCERT, Arihant"
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="personName">Person Name:</label>
                                <input
                                    type="text"
                                    id="personName"
                                    name="personName"
                                    value={formData.personName}
                                    onChange={handleChange}
                                    placeholder="e.g., John Doe"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>
                        {(!editingPublicationId && newPublicationSubtitles.length > 0) || (editingPublicationId && selectedPublicationForSubtitle?.subtitles?.length > 0) ? (
                            <div className="form-group">
                                <label>Subtitles:</label>
                                <div className="subtitle-list form-subtitle-list">
                                    {editingPublicationId
                                        ? selectedPublicationForSubtitle.subtitles.map(sub => (
                                            <span key={sub._id} className="subtitle-tag">
                                                {sub.name} ({sub.discount}%)
                                                <button
                                                    className="remove-subtitle-btn"
                                                    onClick={() => handleRemoveSubtitle(sub._id, selectedPublicationForSubtitle._id, sub.name)}
                                                    title="Remove Subtitle"
                                                    disabled={loading}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </span>
                                        ))
                                        : newPublicationSubtitles.map(sub => (
                                            <span key={sub._id} className="subtitle-tag">
                                                {sub.name} ({sub.discount}%)
                                                <button
                                                    className="remove-subtitle-btn"
                                                    onClick={() => handleRemoveSubtitle(sub._id, null, sub.name)}
                                                    title="Remove temporary Subtitle"
                                                    disabled={loading}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </span>
                                        ))
                                    }
                                </div>
                            </div>
                        ) : null}
                        <div className="form-group mt-3">
                            <button
                                type="button"
                                onClick={handleOpenSubtitleModalFromForm}
                                className="btn btn-info"
                                disabled={loading}
                            >
                                <FaPlusCircle className="mr-2" /> Add Subtitle
                            </button>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="mobileNumber">Mobile Number:</label>
                                <input
                                    type="text"
                                    id="mobileNumber"
                                    name="mobileNumber"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                    placeholder="e.g., 9876543210"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="city">City:</label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="e.g., Indore, Bhopal"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="address">Address:</label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Full Address"
                                    disabled={loading}
                                    className="form-textarea"
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label htmlFor="gstin">GSTIN:</label>
                                <input
                                    type="text"
                                    id="gstin"
                                    name="gstin"
                                    value={formData.gstin}
                                    onChange={handleChange}
                                    placeholder="e.g., 22AAAAA0000A1Z5"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>
                        <h3 className="form-title">{editingPublicationId ? 'Edit Bank Details' : 'Bank Details'}</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="bank">Bank Name:</label>
                                <input
                                    type="text"
                                    id="bank"
                                    name="bank"
                                    value={formData.bank}
                                    onChange={handleChange}
                                    placeholder="e.g., SBI, HDFC"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="accountNumber">Account Number:</label>
                                <input
                                    type="text"
                                    id="accountNumber"
                                    name="accountNumber"
                                    value={formData.accountNumber}
                                    onChange={handleChange}
                                    placeholder="e.g., 1234567890"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="ifsc">IFSC:</label>
                                <input
                                    type="text"
                                    id="ifsc"
                                    name="ifsc"
                                    value={formData.ifsc}
                                    onChange={handleChange}
                                    placeholder="e.g., HDFC0001234"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="status">Status:</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={loading}
                                className="form-select"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : (editingPublicationId ? 'Update Publication' : 'Add Publication')}
                            </button>
                            {editingPublicationId && (
                                <button
                                    type="button"
                                    className="btn btn-secondary ml-2"
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>
                <div className="table-section">
                    <div className="table-controls">
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="Search by Name, Person, City, Mobile, GSTIN..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <FaSearch className="search-icon" />
                        </div>
                        <div className="publication-type-filter">
                            <label htmlFor="publicationNameFilter" className="mr-2"></label>
                            <select
                                id="publicationNameFilter"
                                value={publicationNameFilter}
                                onChange={(e) => {
                                    setPublicationNameFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="form-select"
                            >
                                <option value="all">All Publications</option>
                                {publications.map(pub => (
                                    <option key={pub._id} value={pub.name}>
                                        {pub.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="publication-type-filter">
                            <label htmlFor="publicationTypeFilter" className="mr-2"></label>
                            <select
                                id="publicationTypeFilter"
                                value={publicationTypeFilter}
                                onChange={(e) => {
                                    setPublicationTypeFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="form-select"
                            >
                                <option value="all">All Types</option>
                                <option value="Private Pub">Private</option>
                                <option value="Govt. Pub">Government</option>
                                <option value="Other Pub">Other</option>
                            </select>
                        </div>
                        <button
                            onClick={downloadPdf}
                            className="btn btn-info download-pdf-btn"
                            disabled={loading || filteredPublications.length === 0}
                        >
                            <FaFilePdf className="mr-2" /> Download PDF
                        </button>
                    </div>
                    {loading && publications.length === 0 ? (
                        <p className="loading-state text-center">Loading publications...</p>
                    ) : (
                        <div className="table-container">
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th>S.No.</th><th>Publication Type</th><th>Publication Name</th><th>Contact Person Name</th><th>Sub Title</th><th>Mobile No</th><th>Address</th><th>City</th><th>GST No.</th><th>Bank</th><th>Acc No.</th><th>IFSC</th><th>Add Date</th><th>Status</th><th>Action</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef}>
                                    {filteredPublications.length > 0 ? (
                                        currentPublications.map((pubItem, index) => (
                                            <tr key={pubItem._id} className={pubItem._id === highlightedPublicationId ? 'animate-highlight' : ''}>
                                                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                <td>{pubItem.publicationType}</td>
                                                <td>{pubItem.name}</td>
                                                <td>{pubItem.personName}</td>
                                                <td>
                                                    {pubItem.subtitles && pubItem.subtitles.length > 0 ? (
                                                        <details>
                                                            <summary style={{ cursor: "pointer", color: "#007bff" }}>
                                                                View Subtitles ({pubItem.subtitles.length})
                                                            </summary>
                                                            <div className="subtitle-list">
                                                                {pubItem.subtitles.map(sub => (
                                                                    <div key={sub._id} className="subtitle-tag-container">
                                                                        <span className="subtitle-tag">
                                                                            {sub.name} ({sub.discount}%)
                                                                        </span>
                                                                        <button
                                                                            onClick={() => handleEditSubtitle(sub, pubItem)}
                                                                            className="action-icon-button edit-button"
                                                                            title="Edit Subtitle"
                                                                            disabled={loading}
                                                                        >
                                                                            <FaEdit />
                                                                        </button>
                                                                        <button
                                                                            className="action-icon-button remove-subtitle-btn"
                                                                            onClick={() => handleRemoveSubtitle(sub._id, pubItem._id, sub.name)}
                                                                            title="Remove Subtitle"
                                                                            disabled={loading}
                                                                        >
                                                                            <FaTimes />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </details>
                                                    ) : (
                                                        <span>No subtitles</span>
                                                    )}
                                                </td>
                                                <td>{pubItem.mobileNumber}</td>
                                                <td>{pubItem.address}</td>
                                                <td>{pubItem.city ? pubItem.city.name : 'N/A'}</td>
                                                <td>{pubItem.gstin && `${pubItem.gstin}`}</td>
                                                <td>{pubItem.bank}</td>
                                                <td>{pubItem.accountNumber}</td>
                                                <td>{pubItem.ifsc}</td>
                                                <td>{formatDateWithTime(pubItem.createdAt)}</td>
                                                <td>
                                                    <span className={`status-badge ${pubItem.status}`}>
                                                        {pubItem.status.charAt(0).toUpperCase() + pubItem.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="actions-column">
                                                    <button
                                                        onClick={() => handleEdit(pubItem)}
                                                        className="action-icon-button edit-button"
                                                        title="Edit Publication"
                                                        disabled={loading}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => openConfirmModal(pubItem)}
                                                        className="action-icon-button delete-button"
                                                        title="Delete Publication"
                                                        disabled={loading}
                                                    >
                                                        {loading && publicationToDeleteId === pubItem._id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="15" className="no-data-message text-center">No publications found matching your criteria.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {filteredPublications.length > 0 && totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button onClick={goToPrevPage} disabled={currentPage === 1 || loading} className="btn btn-page">
                                        <FaChevronLeft /> Previous
                                    </button>
                                    <span>Page {currentPage} of {totalPages}</span>
                                    <button onClick={goToNextPage} disabled={currentPage === totalPages || loading} className="btn btn-page">
                                        Next <FaChevronRight />
                                    </button>
                                </div>
                            )}
                            <div className="total-records text-center mt-2">
                                Total Records: {filteredPublications.length}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete publication: <strong>{publicationToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Delete'}
                            </button>
                            <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            {showSubtitleModal && (
                <div
                    className="modal-backdrop"
                    onClick={closeSubtitleModal}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>{editingSubtitleId ? 'Edit Subtitle' : 'Add Subtitle'}</h3>
                        <form onSubmit={handleAddSubtitle}>
                            <div className="form-group">
                                <label htmlFor="newSubtitleName" className="font-bold">Subtitle Name:</label>
                                <input
                                    type="text"
                                    id="newSubtitleName"
                                    name="newSubtitleName"
                                    value={newSubtitleName}
                                    onChange={(e) => setNewSubtitleName(e.target.value)}
                                    placeholder="e.g., Astreca , Real Life"
                                    required
                                    disabled={subtitleModalLoading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newSubtitleDiscount">Discount (%):</label>
                                <input
                                    type="number"
                                    id="newSubtitleDiscount"
                                    name="newSubtitleDiscount"
                                    value={newSubtitleDiscount}
                                    onChange={(e) => setNewSubtitleDiscount(e.target.value)}
                                    placeholder="e.g., 10"
                                    min="0"
                                    max="100"
                                    disabled={subtitleModalLoading}
                                    className="form-input"
                                />
                            </div>
                            {subtitleModalError && (
                                <p className="error-message text-center">{subtitleModalError}</p>
                            )}
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={subtitleModalLoading}>
                                    {subtitleModalLoading
                                        ? <FaSpinner className="btn-icon-mr animate-spin" />
                                        : (editingSubtitleId ? 'Update Subtitle' : 'Add Subtitle')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeSubtitleModal}
                                    disabled={subtitleModalLoading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicationManagement;