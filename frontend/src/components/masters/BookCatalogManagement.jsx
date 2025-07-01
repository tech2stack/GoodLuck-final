// src/components/masters/BookCatalogManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api'; // API utility for backend calls
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Icons for UI

// Stylesheets (assuming these are already present and styled for consistency)
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';

// NOTE: jsPDF and jspdf-autotable are expected to be loaded globally via CDN in public/index.html
// If you are using npm, you'd do: npm install jspdf jspdf-autotable
// Then import them here:
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';


const BookCatalogManagement = ({ showFlashMessage }) => {
    // State for managing list of book catalogs
    const [bookCatalogs, setBookCatalogs] = useState([]);
    // States for dropdown data
    const [publications, setPublications] = useState([]);
    const [subtitles, setSubtitles] = useState([]); // Subtitles for the selected publication
    const [languages, setLanguages] = useState([]);
    const [classes, setClasses] = useState([]); // For dynamic price fields

    // State for form inputs (for creating new or editing existing book catalog)
    const [formData, setFormData] = useState({
        name: '',
        publication: '',
        subtitle: '', // Can be null
        language: '', // Can be null
        bookType: 'default', // 'default' or 'common_price'
        commonPrice: 0,
        pricesByClass: {}, // Object to store prices per class { 'Class 1': 100, 'Class 2': 120 }
        discountPercentage: 0,
        gstPercentage: 0,
        status: 'active',
    });

    // State for loading indicators
    const [loading, setLoading] = useState(false);
    // State for managing local errors (e.g., form validation)
    const [localError, setLocalError] = useState(null);
    // State to track if we are in edit mode and which book catalog is being edited
    const [editingBookCatalogId, setEditingBookCatalogId] = useState(null);

    // States for confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [bookCatalogToDeleteId, setBookCatalogToDeleteId] = useState(null);
    const [bookCatalogToDeleteName, setBookCatalogToDeleteName] = useState('');

    // Ref for scrolling to the new item in the table (if needed)
    const tableBodyRef = useRef(null);

    // States for Search
    const [searchTerm, setSearchTerm] = useState('');

    // States for Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Show 10 entries per page


    // --- Helper function for date formatting ---
    const formatDateWithTime = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true // For AM/PM format
        };
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', options);
    };

    // --- Fetch Dropdown Data (Publications, Languages, Classes) ---
    const fetchDropdownData = useCallback(async () => {
        try {
            setLoading(true);
            const [publicationsRes, languagesRes, classesRes] = await Promise.all([
                api.get('/publications?status=active&limit=1000'),
                api.get('/languages?status=active&limit=1000'),
                api.get('/classes?status=active&limit=1000')
            ]);

            if (publicationsRes.data.status === 'success') {
                setPublications(publicationsRes.data.data.publications);
            }
            if (languagesRes.data.status === 'success') {
                setLanguages(languagesRes.data.data.languages);
            }
            if (classesRes.data.status === 'success') {
                setClasses(classesRes.data.data.classes);
            }

            // Set initial default values for dropdowns if available
            // Note: We don't set subtitle here initially, it's handled by fetchSubtitles based on publication
            // This initial setting is for new form, not for edit
            if (!editingBookCatalogId) { // Only set defaults if not editing
                setFormData(prev => ({
                    ...prev,
                    publication: publicationsRes.data.data.publications[0]?._id || '',
                    language: languagesRes.data.data.languages[0]?._id || '',
                }));
            }

        } catch (err) {
            console.error('Error fetching dropdown data:', err);
            showFlashMessage('Failed to load necessary data for form (Publications, Languages, Classes).', 'error');
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage, editingBookCatalogId]);

    // --- Fetch Subtitles based on selected Publication ---
    const fetchSubtitles = useCallback(async (publicationId, initialSubtitleId = null) => {
        console.log('Fetching subtitles for publicationId:', publicationId, 'Initial Subtitle ID:', initialSubtitleId); // DEBUG LOG
        if (!publicationId) {
            setSubtitles([]);
            setFormData(prev => ({ ...prev, subtitle: '' }));
            console.log('Subtitle cleared because no publicationId.'); // DEBUG LOG
            return;
        }
        try {
            const response = await api.get(`/publications/${publicationId}/subtitles?status=active&limit=1000`);
            if (response.data.status === 'success') {
                const fetchedSubtitles = response.data.data.subtitles;
                setSubtitles(fetchedSubtitles);
                console.log('Fetched subtitles:', fetchedSubtitles); // DEBUG LOG

                // Logic to set or clear subtitle based on initialSubtitleId or fetched list
                if (initialSubtitleId) {
                    // If an initialSubtitleId was provided (e.g., during edit), try to set it
                    const subtitleExistsInFetched = fetchedSubtitles.some(sub => sub._id === initialSubtitleId);
                    if (subtitleExistsInFetched) {
                        setFormData(prev => ({ ...prev, subtitle: initialSubtitleId }));
                        console.log('Subtitle set to initialSubtitleId:', initialSubtitleId); // DEBUG LOG
                    } else {
                        // If initialSubtitleId is not valid for this publication, clear it
                        setFormData(prev => ({ ...prev, subtitle: '' }));
                        console.log('Initial subtitle ID not found in fetched subtitles for this publication. Clearing subtitle.'); // DEBUG LOG
                    }
                } else {
                    // If no initialSubtitleId, set to first available or clear
                    setFormData(prev => ({ ...prev, subtitle: fetchedSubtitles[0]?._id || '' }));
                    console.log('Subtitle set to first available or cleared (no initialSubtitleId).'); // DEBUG LOG
                }
            } else {
                setSubtitles([]);
                setFormData(prev => ({ ...prev, subtitle: '' }));
                console.error('Failed to fetch subtitles:', response.data.message);
            }
        } catch (err) {
            setSubtitles([]);
            setFormData(prev => ({ ...prev, subtitle: '' }));
            console.error('Error fetching subtitles:', err);
        }
    }, []); // Removed formData.subtitle from dependencies here. It's now controlled by initialSubtitleId param.


    // --- Fetch Book Catalogs ---
    const fetchBookCatalogs = useCallback(async (scrollToNew = false) => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get(`/book-catalogs`); // Fetch all book catalogs
            if (response.data.status === 'success') {
                setBookCatalogs(response.data.data.bookCatalogs);
                
                const totalPagesCalculated = Math.ceil(response.data.data.bookCatalogs.length / itemsPerPage);
                if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
                    setCurrentPage(totalPagesCalculated);
                } else if (response.data.data.bookCatalogs.length === 0) {
                    setCurrentPage(1);
                }
                
                if (scrollToNew && tableBodyRef.current) {
                    setTimeout(() => {
                        const lastPageIndex = Math.ceil(response.data.data.bookCatalogs.length / itemsPerPage);
                        if (currentPage !== lastPageIndex) {
                           setCurrentPage(lastPageIndex);
                           setTimeout(() => {
                                if (tableBodyRef.current.lastElementChild) {
                                    tableBodyRef.current.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
                                } else {
                                    tableBodyRef.current.scrollTop = tableBodyRef.current.scrollHeight;
                                }
                           }, 50);
                        } else {
                            if (tableBodyRef.current.lastElementChild) {
                                tableBodyRef.current.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
                            } else {
                                tableBodyRef.current.scrollTop = tableBodyRef.current.scrollHeight;
                            }
                        }
                    }, 100);
                }
            } else {
                setLocalError(response.data.message || 'Failed to fetch book catalogs.');
            }
        } catch (err) {
            console.error('Error fetching book catalogs:', err);
            setLocalError(err.response?.data?.message || 'Failed to load book catalogs due to network error.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage]);

    // Initial data fetch on component mount
    useEffect(() => {
        fetchDropdownData();
        fetchBookCatalogs();
    }, [fetchDropdownData, fetchBookCatalogs]);

    // Effect to fetch subtitles when publication changes (for new entry or manual change)
    useEffect(() => {
        // Only auto-fetch subtitles if not in edit mode (handleEdit calls it explicitly)
        if (!editingBookCatalogId) {
            fetchSubtitles(formData.publication);
        }
    }, [formData.publication, fetchSubtitles, editingBookCatalogId]);


    // Debugging useEffect for PDF libraries
    useEffect(() => {
        console.log("PDF Libraries Check (BookCatalogManagement):");
        console.log("window.jspdf (global object):", typeof window.jspdf);
        console.log("window.jspdf.jsPDF (constructor):", typeof window.jspdf?.jsPDF);
    }, []);


    // --- Form Handling ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'bookType') {
            setFormData(prev => ({
                ...prev,
                bookType: value,
                commonPrice: value === 'default' ? 0 : prev.commonPrice, // Clear commonPrice if switching to default
                pricesByClass: value === 'common_price' ? {} : prev.pricesByClass, // Clear pricesByClass if switching to common
            }));
        } else if (name.startsWith('price_')) { // Handle dynamic class prices
            const classId = name.split('_')[1];
            // Fix for NaN warning: Ensure value is a number or empty string
            const numericValue = parseFloat(value);
            setFormData(prev => ({
                ...prev,
                pricesByClass: {
                    ...prev.pricesByClass,
                    [classId]: isNaN(numericValue) ? '' : numericValue // Store as number, or empty string if invalid
                }
            }));
        } else if (type === 'number') {
            const numericValue = parseFloat(value);
            setFormData(prev => ({
                ...prev,
                [name]: isNaN(numericValue) ? '' : numericValue // Ensure numbers are stored as numbers, or empty string if invalid
            }));
        }
        else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        // Basic validation
        if (!formData.name || !formData.publication || !formData.bookType) {
            setLocalError('Please fill in all required fields (Book Name, Publication, Book Type).');
            showFlashMessage('Please fill in all required fields.', 'error');
            setLoading(false);
            return;
        }

        if (formData.bookType === 'common_price' && (formData.commonPrice === undefined || formData.commonPrice === null || formData.commonPrice === '' || formData.commonPrice < 0)) { // Added '' check
            setLocalError('Common Price is required and must be a non-negative number for "Common Price" type.');
            showFlashMessage('Common Price is invalid.', 'error');
            setLoading(false);
            return;
        }

        if (formData.bookType === 'default' && Object.keys(formData.pricesByClass).length === 0) {
            setLocalError('At least one price for a class is required for "Default" book type.');
            showFlashMessage('At least one class price is required.', 'error');
            setLoading(false);
            return;
        }
        // Further validation for pricesByClass values
        if (formData.bookType === 'default') {
            for (const classId in formData.pricesByClass) {
                const price = formData.pricesByClass[classId];
                if (price === undefined || price === null || isNaN(price) || price === '' || price < 0) { // Added '' check
                    setLocalError(`Price for class ${classes.find(c => c._id === classId)?.name || classId} is invalid. Must be a non-negative number.`);
                    showFlashMessage('Invalid class price detected.', 'error');
                    setLoading(false);
                    return;
                }
            }
        }


        // Prepare data for API call
        const dataToSend = { ...formData };
        // Ensure subtitle and language are null if empty strings
        if (dataToSend.subtitle === '') dataToSend.subtitle = null;
        if (dataToSend.language === '') dataToSend.language = null;

        // Clean up unnecessary fields based on bookType
        if (dataToSend.bookType === 'default') {
            delete dataToSend.commonPrice;
            // Convert pricesByClass values to numbers before sending
            const numericPricesByClass = {};
            for (const key in dataToSend.pricesByClass) {
                if (dataToSend.pricesByClass[key] !== '') { // Only include if not empty string
                    numericPricesByClass[key] = parseFloat(dataToSend.pricesByClass[key]);
                }
            }
            dataToSend.pricesByClass = numericPricesByClass;
        } else { // common_price
            delete dataToSend.pricesByClass;
            // Convert commonPrice to number before sending
            dataToSend.commonPrice = parseFloat(dataToSend.commonPrice);
        }

        console.log('Submitting formData:', formData); // DEBUG LOG
        console.log('Data to send:', dataToSend); // DEBUG LOG

        try {
            let response;
            if (editingBookCatalogId) {
                // Update existing book catalog
                response = await api.patch(`/book-catalogs/${editingBookCatalogId}`, dataToSend);
                if (response.data.status === 'success') {
                    showFlashMessage('Book Catalog updated successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to update book catalog.');
                }
            } else {
                // Create new book catalog
                response = await api.post('/book-catalogs', dataToSend);
                if (response.data.status === 'success') {
                    showFlashMessage('Book Catalog created successfully!', 'success');
                } else {
                    throw new Error(response.data.message || 'Failed to create book catalog.');
                }
            }
            // Reset form and re-fetch book catalogs
            setFormData({
                name: '',
                publication: publications[0]?._id || '',
                subtitle: '',
                language: languages[0]?._id || '',
                bookType: 'default',
                commonPrice: 0,
                pricesByClass: {},
                discountPercentage: 0,
                gstPercentage: 0,
                status: 'active',
            });
            setEditingBookCatalogId(null);
            fetchBookCatalogs(true); // Re-fetch and indicate to scroll
        } catch (err) {
            console.error('Error saving book catalog:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save book catalog. Please check your input and ensure book name is unique for the selected publication/subtitle combination.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Edit and Delete Operations ---
    const handleEdit = (bookCatalogItem) => {
        console.log('Editing book catalog item:', bookCatalogItem); // DEBUG LOG
        // FIX: Ensure pricesByClass is converted correctly from a plain object (if it came that way)
        // Object.entries() converts a plain object into an array of [key, value] pairs,
        // which Object.fromEntries() can then use to create a new plain object.
        const pricesMap = bookCatalogItem.pricesByClass
            ? Object.fromEntries(Object.entries(bookCatalogItem.pricesByClass))
            : {};

        // Temporarily set publication and language first, then fetch subtitles
        setFormData(prev => ({
            ...prev,
            name: bookCatalogItem.name,
            publication: bookCatalogItem.publication?._id || '',
            language: bookCatalogItem.language?._id || '',
            bookType: bookCatalogItem.bookType,
            commonPrice: bookCatalogItem.commonPrice || '', // Use empty string for 0 to avoid NaN warning on empty input
            pricesByClass: pricesMap,
            discountPercentage: bookCatalogItem.discountPercentage || '', // Use empty string for 0 to avoid NaN warning on empty input
            gstPercentage: bookCatalogItem.gstPercentage || '', // Use empty string for 0 to avoid NaN warning on empty input
            status: bookCatalogItem.status,
        }));
        setEditingBookCatalogId(bookCatalogItem._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form

        // Explicitly fetch subtitles for the selected publication, passing the current subtitle ID
        // This ensures the subtitle dropdown is correctly populated and the correct subtitle is selected.
        // This call will update the subtitle in formData once subtitles are fetched.
        fetchSubtitles(bookCatalogItem.publication?._id, bookCatalogItem.subtitle?._id);
        
        console.log('Set formData for editing. Publication:', bookCatalogItem.publication?._id, 'Subtitle:', bookCatalogItem.subtitle?._id); // DEBUG LOG
    };

    const openConfirmModal = (bookCatalogItem) => {
        setBookCatalogToDeleteId(bookCatalogItem._id);
        setBookCatalogToDeleteName(bookCatalogItem.name);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setBookCatalogToDeleteId(null);
        setBookCatalogToDeleteName('');
    };

    const confirmDelete = async () => {
        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/book-catalogs/${bookCatalogToDeleteId}`);
            if (response.status === 204) {
                showFlashMessage('Book Catalog deleted successfully!', 'success');
                fetchBookCatalogs();
            } else {
                throw new Error(response.data?.message || 'Failed to delete book catalog.');
            }
        } catch (err) {
            console.error('Error deleting book catalog:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete book catalog.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Search Filtering ---
    const filteredBookCatalogs = bookCatalogs.filter(bookCatalogItem =>
        bookCatalogItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bookCatalogItem.publication && bookCatalogItem.publication.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (bookCatalogItem.language && bookCatalogItem.language.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (bookCatalogItem.subtitle && bookCatalogItem.subtitle.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBookCatalogs = filteredBookCatalogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBookCatalogs.length / itemsPerPage);

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

    // --- Format Price for Table Display ---
    const formatPriceDisplay = (bookCatalogItem) => {
        if (bookCatalogItem.bookType === 'common_price') {
            return `₹${bookCatalogItem.commonPrice}`;
        } else if (bookCatalogItem.bookType === 'default' && bookCatalogItem.pricesByClass) {
            const prices = Object.entries(bookCatalogItem.pricesByClass)
                .map(([classId, price]) => {
                    const className = classes.find(c => c._id === classId)?.name;
                    return className ? `₹${price} - ${className}` : `₹${price} - Unknown Class`;
                })
                .join(', ');
            return prices || 'N/A';
        }
        return 'N/A';
    };

    // --- PDF Download Functionality ---
    const downloadPdf = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation libraries not fully loaded or accessible. Check console for details.', 'error');
            console.error("PDF generation failed: window.jspdf or window.jspdf.jsPDF is not available/callable. Ensure CDNs are correctly linked in public/index.html");
            return;
        }

        const doc = new window.jspdf.jsPDF('landscape'); // Use landscape for more columns
        
        if (typeof doc.autoTable !== 'function') {
            showFlashMessage('PDF Table plugin (jspdf-autotable) not loaded or accessible. Check console for details.', 'error');
            console.error("PDF generation failed: doc.autoTable is not a function. Ensure jspdf.plugin.autotable.min.js is correctly linked and loaded AFTER jspdf.umd.min.js.");
            return;
        }

        doc.text("Book Catalog List", 14, 15);

        const tableColumn = [
            "S.No.", "Name", "Publisher", "Subtitle", "Language", "Price",
            "Discount %", "GST %", "Add Date", "Status"
        ];
        const tableRows = [];

        filteredBookCatalogs.forEach((bookItem, index) => {
            const bookData = [
                index + 1,
                bookItem.name,
                bookItem.publication ? bookItem.publication.name : 'N/A',
                bookItem.subtitle ? bookItem.subtitle.name : 'N/A',
                bookItem.language ? bookItem.language.name : 'N/A',
                formatPriceDisplay(bookItem), // Formatted price
                `${bookItem.discountPercentage}%`,
                `${bookItem.gstPercentage}%`,
                bookItem.createdAt ? formatDateWithTime(bookItem.createdAt) : 'N/A', // Added check for createdAt
                bookItem.status.charAt(0).toUpperCase() + bookItem.status.slice(1)
            ];
            tableRows.push(bookData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save(`Book_Catalog_List_${new Date().toLocaleDateString()}.pdf`);
        showFlashMessage('Book Catalog list downloaded as PDF!', 'success');
    };

    // --- UI Rendering ---
    return (
        <div className="book-catalog-management-container">
            <h2 className="section-title">Book Catalog Management</h2>

            {localError && (
                <p className="error-message text-center">{localError}</p>
            )}

            {/* Book Catalog Creation/Update Form - This section is visually separated as a card */}
            <div className="form-container-card">
                <form onSubmit={handleSubmit} className="app-form">
                    <h3 className="form-title">{editingBookCatalogId ? 'Edit Book Catalog' : 'Add Book Catalog'}</h3>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name">Book Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Science Textbook"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="publication">Publication:</label>
                            <select
                                id="publication"
                                name="publication"
                                value={formData.publication}
                                onChange={handleChange}
                                required
                                disabled={loading || publications.length === 0}
                            >
                                {publications.length === 0 ? (
                                    <option value="">Loading Publications...</option>
                                ) : (
                                    <>
                                        <option value="">-- SELECT PUBLICATION --</option>
                                        {publications.map(pub => (
                                            <option key={pub._id} value={pub._id}>
                                                {pub.name}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="subtitle">Sub Title:</label>
                            <select
                                id="subtitle"
                                name="subtitle"
                                value={formData.subtitle}
                                onChange={handleChange}
                                disabled={loading || !formData.publication || subtitles.length === 0}
                            >
                                {subtitles.length === 0 ? (
                                    <option value="">-- SELECT -- (No Subtitles for selected Publication)</option>
                                ) : (
                                    <>
                                        <option value="">-- SELECT --</option>
                                        {subtitles.map(sub => (
                                            <option key={sub._id} value={sub._id}>
                                                {sub.name}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="language">Elective Language:</label>
                            <select
                                id="language"
                                name="language"
                                value={formData.language}
                                onChange={handleChange}
                                disabled={loading || languages.length === 0}
                            >
                                {languages.length === 0 ? (
                                    <option value="">Loading Languages...</option>
                                ) : (
                                    <>
                                        <option value="">-- SELECT --</option>
                                        {languages.map(lang => (
                                            <option key={lang._id} value={lang._id}>
                                                {lang.name}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Book Type and Price Fields */}
                    <div className="form-group">
                        <label>Book Type:</label>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name="bookType"
                                    value="default"
                                    checked={formData.bookType === 'default'}
                                    onChange={handleChange}
                                    disabled={loading}
                                /> Default
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="bookType"
                                    value="common_price"
                                    checked={formData.bookType === 'common_price'}
                                    onChange={handleChange}
                                    disabled={loading}
                                /> Common Price
                            </label>
                        </div>
                    </div>

                    {formData.bookType === 'common_price' && (
                        <div className="form-group">
                            <label htmlFor="commonPrice">Common Price:</label>
                            <input
                                type="number"
                                id="commonPrice"
                                name="commonPrice"
                                value={formData.commonPrice}
                                onChange={handleChange}
                                placeholder="e.g., 250"
                                min="0"
                                required
                                disabled={loading}
                            />
                        </div>
                    )}

                    {formData.bookType === 'default' && (
                        <div className="prices-by-class-grid">
                            <label className="grid-label">Prices by Class:</label>
                            {classes.length === 0 ? (
                                <p>Loading Classes for pricing...</p>
                            ) : (
                                classes.map(cls => (
                                    <div className="form-group price-input-group" key={cls._id}>
                                        <label htmlFor={`price_${cls._id}`}>Price of {cls.name}:</label>
                                        <input
                                            type="number"
                                            id={`price_${cls._id}`}
                                            name={`price_${cls._id}`}
                                            value={formData.pricesByClass[cls._id] === undefined ? '' : formData.pricesByClass[cls._id]} // Cast to string for input value
                                            onChange={handleChange}
                                            placeholder="0"
                                            min="0"
                                            disabled={loading}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="discountPercentage">Discount %:</label>
                            <input
                                type="number"
                                id="discountPercentage"
                                name="discountPercentage"
                                value={formData.discountPercentage}
                                onChange={handleChange}
                                placeholder="e.g., 10"
                                min="0"
                                max="100"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="gstPercentage">GST %:</label>
                            <input
                                type="number"
                                id="gstPercentage"
                                name="gstPercentage"
                                value={formData.gstPercentage}
                                onChange={handleChange}
                                placeholder="e.g., 18"
                                min="0"
                                max="100"
                                disabled={loading}
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
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (editingBookCatalogId ? 'Updating...' : 'Adding...') : (editingBookCatalogId ? 'Update Book Catalog' : 'Add Book Catalog')}
                            <FaPlusCircle className="ml-2" />
                        </button>
                        {editingBookCatalogId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setEditingBookCatalogId(null);
                                    setFormData({
                                        name: '',
                                        publication: publications[0]?._id || '',
                                        subtitle: '',
                                        language: languages[0]?._id || '',
                                        bookType: 'default',
                                        commonPrice: 0,
                                        pricesByClass: {},
                                        discountPercentage: 0,
                                        gstPercentage: 0,
                                        status: 'active',
                                    });
                                    setLocalError(null);
                                }}
                                disabled={loading}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Book Catalog List Table - This section is also visually separated as a card/table container */}
            <div className="table-container">
                <h3 className="table-title">Existing Book Catalogs</h3>

                {/* Search and PDF Download Section */}
                <div className="table-controls">
                    <div className="search-input-group">
                        <input
                            type="text"
                            placeholder="Search by Name, Publication, Language, Subtitle..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <FaSearch className="search-icon" />
                    </div>
                    <button onClick={downloadPdf} className="btn btn-info download-pdf-btn">
                        <FaFilePdf className="mr-2" /> Download PDF
                    </button>
                </div>

                {loading && bookCatalogs.length === 0 ? (
                    <p className="loading-state">Loading book catalogs...</p>
                ) : filteredBookCatalogs.length === 0 ? (
                    <p className="no-data-message">No book catalogs found matching your criteria. Start by adding one!</p>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Name</th>
                                    <th>Publisher</th>
                                    <th>Subtitle</th>
                                    <th>Language</th>
                                    <th>Price</th>
                                    <th>Discount %</th>
                                    <th>GST %</th>
                                    <th>Add Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody ref={tableBodyRef}>
                                {currentBookCatalogs.map((bookItem, index) => (
                                    <tr key={bookItem._id}>
                                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td>{bookItem.name}</td>
                                        <td>{bookItem.publication ? bookItem.publication.name : 'N/A'}</td>
                                        <td>{bookItem.subtitle ? bookItem.subtitle.name : 'N/A'}</td>
                                        <td>{bookItem.language ? bookItem.language.name : 'N/A'}</td>
                                        <td>{formatPriceDisplay(bookItem)}</td>
                                        <td>{bookItem.discountPercentage}%</td>
                                        <td>{bookItem.gstPercentage}%</td>
                                        <td>{bookItem.createdAt ? formatDateWithTime(bookItem.createdAt) : 'N/A'}</td>
                                        <td>
                                            <span className={`status-badge ${bookItem.status}`}>
                                                {bookItem.status.charAt(0).toUpperCase() + bookItem.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="actions-column">
                                            <button
                                                onClick={() => handleEdit(bookItem)}
                                                className="action-icon-button edit-button"
                                                title="Edit Book Catalog"
                                                disabled={loading}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => openConfirmModal(bookItem)}
                                                className="action-icon-button delete-button"
                                                title="Delete Book Catalog"
                                                disabled={loading}
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
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
                    </>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete book catalog: <strong>{bookCatalogToDeleteName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>Delete</button>
                            <button onClick={closeConfirmModal} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookCatalogManagement;
