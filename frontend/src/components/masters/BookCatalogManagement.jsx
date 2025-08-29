import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../../utils/api';
import {
    FaEdit,
    FaTrashAlt,
    FaPlusCircle,
    FaSearch,
    FaFilePdf,
    FaChevronLeft,
    FaChevronRight,
    FaSpinner,
    FaTimesCircle,
} from 'react-icons/fa';

import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';
import '../../styles/BookCatalogManagement.css';

import companyLogo from '../../assets/glbs-logo.jpg';
import { addHeaderAndSetStartY, addReportTitle, addTableToDoc } from '../../utils/pdfTheme';

const BookCatalogManagement = ({ showFlashMessage }) => {
    const [bookCatalogs, setBookCatalogs] = useState([]);
    const [publications, setPublications] = useState([]);
    const [subtitles, setSubtitles] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [classes, setClasses] = useState([]);
    const [isbnVisible, setIsbnVisible] = useState({});


    const [formData, setFormData] = useState({
        bookName: '',
        publication: '',
        subtitle: '',
        language: '',
        bookType: 'default',
        commonPrice: 0,
        pricesByClass: {},
        isbnByClass: {},
        status: 'active',
    });

    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [editingBookCatalogId, setEditingBookCatalogId] = useState(null);

    const [currentClassIndex, setCurrentClassIndex] = useState(0); // 🔹 for swipe navigation

    // States for confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [bookCatalogToDeleteId, setBookCatalogToDeleteId] = useState(null);
    const [bookCatalogToDeleteName, setBookCatalogToDeleteName] = useState('');
    const [bookToDelete, setBookToDelete] = useState(null);

    // New state to manage the expanded row for details
    const [expandedRowId, setExpandedRowId] = useState(null);

    // Ref for scrolling to the new item in the table (if needed)
    const tableBodyRef = useRef(null);

    // States for Search
    const [searchTerm, setSearchTerm] = useState('');
    const [publicationFilter, setPublicationFilter] = useState('all'); // Default to 'all' for no filter
    const [subtitleFilter, setSubtitleFilter] = useState('all'); // Default to 'all' for no filter
    const [languageFilter, setLanguageFilter] = useState('all'); // Default to 'all' for no filter

    // States for Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); // Declared setItemsPerPage here


    // --- Helper function for date formatting ---
    const formatDateWithTime = (dateString) => {
        if (!dateString) return 'N/A';
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

    // --- Fetch Subtitles based on selected Publication (UPDATED LOGIC) ---
const fetchSubtitles = useCallback(
    (publicationId, initialSubtitleId = null) => {
        console.log('Fetching subtitles for publicationId:', publicationId, 'Initial Subtitle ID:', initialSubtitleId);
        const selectedPub = publications.find((pub) => pub._id === publicationId);

        if (!selectedPub) {
            setSubtitles([]);
            setFormData((prev) => ({ ...prev, subtitle: '' }));
            if (publicationFilter === 'all') {
                setSubtitleFilter('all'); // Reset subtitle filter when no publication is selected
            }
            console.log('Subtitle cleared because no publicationId or publication not found.');
            return;
        }

        const fetchedSubtitles = selectedPub.subtitles || [];
        setSubtitles(fetchedSubtitles);
        console.log('Fetched subtitles from state:', fetchedSubtitles);

        if (initialSubtitleId) {
            const subtitleExistsInFetched = fetchedSubtitles.some((sub) => sub._id === initialSubtitleId);
            if (subtitleExistsInFetched) {
                setFormData((prev) => ({ ...prev, subtitle: initialSubtitleId }));
                console.log('Subtitle set to initialSubtitleId:', initialSubtitleId);
            } else {
                setFormData((prev) => ({ ...prev, subtitle: '' }));
                console.log('Initial subtitle ID not found in fetched subtitles for this publication. Clearing subtitle.');
            }
        } else {
            setFormData((prev) => ({ ...prev, subtitle: fetchedSubtitles[0]?._id || '' }));
            console.log('Subtitle set to first available or cleared (no initialSubtitleId).');
        }
    },
    [publications, publicationFilter]
);
    // --- Fetch Book Catalogs ---
    // --- Fetch Book Catalogs ---
    const fetchBookCatalogs = useCallback(async () => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get(`/book-catalogs`);
            if (response.data.status === 'success') {
                // ✅ Sort by createdAt (latest first)
                const sorted = response.data.data.bookCatalogs.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                setBookCatalogs(sorted);

                const totalPagesCalculated = Math.ceil(sorted.length / itemsPerPage);
                if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
                    setCurrentPage(totalPagesCalculated);
                } else if (sorted.length === 0) {
                    setCurrentPage(1);
                }
            } else {
                showFlashMessage(response.data.message || 'Failed to fetch book catalogs.', 'error');
            }
        } catch (err) {
            console.error('Error fetching book catalogs:', err);
            const errorMessage = err.response?.data?.message || 'Failed to load book catalogs due to network error.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, showFlashMessage]);

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
        const { name, value, type } = e.target;

        if (name.startsWith('price_')) {
            const classId = name.split('_')[1];
            const numericValue = parseFloat(value);
            setFormData((prev) => ({
                ...prev,
                pricesByClass: {
                    ...prev.pricesByClass,
                    [classId]: isNaN(numericValue) ? '' : numericValue,
                },
            }));
        } else if (name.startsWith('isbn_')) {
            const classId = name.split('_')[1];
            setFormData((prev) => ({
                ...prev,
                isbnByClass: {
                    ...prev.isbnByClass,
                    [classId]: value,
                },
            }));
        } else if (type === 'number') {
            const numericValue = parseFloat(value);
            setFormData((prev) => ({
                ...prev,
                [name]: isNaN(numericValue) ? '' : numericValue,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLocalError(null);

        // Basic validation
        // Changed formData.name to formData.bookName
        if (!formData.bookName || !formData.publication || !formData.bookType) {
            setLocalError('Please fill in all required fields (Book Name, Publication, Book Type).');
            showFlashMessage('Please fill in all required fields.', 'error');
            setLoading(false);
            return;
        }

        if (formData.bookType === 'common_price') {
            if (formData.commonPrice === undefined || formData.commonPrice === null || formData.commonPrice === '' || formData.commonPrice < 0) {
                setLocalError('Common Price is required and must be a non-negative number for "Common Price" type.');
                showFlashMessage('Common Price is invalid.', 'error');
                setLoading(false);
                return;
            }
        }

        if (formData.bookType === 'default') {
            if (Object.keys(formData.pricesByClass).length === 0) {
                setLocalError('At least one price for a class is required for "Default" book type.');
                showFlashMessage('At least one class price is required.', 'error');
                setLoading(false);
                return;
            }
            // Further validation for pricesByClass values
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
            delete dataToSend.commonIsbn;
            // Convert pricesByClass values to numbers before sending
            const numericPricesByClass = {};
            const nonEmptyIsbnByClass = {};
            for (const key in dataToSend.pricesByClass) {
                if (dataToSend.pricesByClass[key] !== '') { // Only include if not empty string
                    numericPricesByClass[key] = parseFloat(dataToSend.pricesByClass[key]);
                }
            }
            for (const key in dataToSend.isbnByClass) {
                if (dataToSend.isbnByClass[key] !== '') {
                    nonEmptyIsbnByClass[key] = dataToSend.isbnByClass[key];
                }
            }
            dataToSend.pricesByClass = numericPricesByClass;
            dataToSend.isbnByClass = nonEmptyIsbnByClass;
        } else { // common_price
            delete dataToSend.pricesByClass;
            delete dataToSend.isbnByClass;
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
                    fetchBookCatalogs(); // re-fetch after update
                } else {
                    throw new Error(response.data.message || 'Failed to update book catalog.');
                }
            } else {
                // ✅ Create case → add new entry at top & reset pagination
                response = await api.post('/book-catalogs', dataToSend);
                if (response.data.status === 'success') {
                    showFlashMessage('Book Catalog created successfully!', 'success');

                    setBookCatalogs(prev => [response.data.data.bookCatalog, ...prev]); // add to top
                    setCurrentPage(1); // reset to first page
                } else {
                    throw new Error(response.data.message || 'Failed to create book catalog.');
                }
            }

            // Reset form
// Retain publication, subtitle, and language; reset other fields
setFormData({
    bookName: '',
    publication: formData.publication, // Retain previous value
    subtitle: formData.subtitle, // Retain previous value
    language: formData.language, // Retain previous value
    bookType: 'default',
    commonPrice: 0,
    pricesByClass: {},
    commonIsbn: '',
    isbnByClass: {},
    status: 'active'
});
setEditingBookCatalogId(null);


// Ensure subtitles are fetched for the retained publication
fetchSubtitles(formData.publication, formData.subtitle);

        } catch (err) {
            console.error('Error saving book catalog:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save book catalog.';
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
        const pricesMap = bookCatalogItem.pricesByClass
            ? Object.fromEntries(Object.entries(bookCatalogItem.pricesByClass))
            : {};
        const isbnsMap = bookCatalogItem.isbnByClass
            ? Object.fromEntries(Object.entries(bookCatalogItem.isbnByClass))
            : {};

        // Temporarily set publication and language first, then fetch subtitles
        setFormData(prev => ({
            ...prev,
            bookName: bookCatalogItem.bookName, // Changed from 'name' to 'bookName'
            publication: bookCatalogItem.publication?._id || '',
            language: bookCatalogItem.language?._id || '',
            bookType: bookCatalogItem.bookType,
            commonPrice: bookCatalogItem.commonPrice || '', // Use empty string for 0 to avoid NaN warning on empty input
            pricesByClass: pricesMap,
            commonIsbn: bookCatalogItem.commonIsbn || '',
            isbnByClass: isbnsMap,
            // discountPercentage: bookCatalogItem.discountPercentage || '', // Use empty string for 0 to avoid NaN warning on empty input // REMOVED
            // gstPercentage: bookCatalogItem.gstPercentage || '', // Use empty string for 0 to avoid NaN warning on empty input // REMOVED
            status: bookCatalogItem.status,
        }));
        setEditingBookCatalogId(bookCatalogItem._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form

        // Explicitly fetch subtitles for the selected publication, passing the current subtitle ID
        fetchSubtitles(bookCatalogItem.publication?._id, bookCatalogItem.subtitle?._id);

        console.log('Set formData for editing. Publication:', bookCatalogItem.publication?._id, 'Subtitle:', bookCatalogItem.subtitle?._id); // DEBUG LOG
    };

    const handleDeleteClick = (bookCatalogItem) => {
        setBookToDelete(bookCatalogItem);
        setShowConfirmModal(true);
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setBookCatalogToDeleteId(null);
        setBookCatalogToDeleteName('');
        setBookToDelete(null);
    };

    const confirmDelete = async () => {
        if (!bookToDelete) return;

        setLoading(true);
        setLocalError(null);
        closeConfirmModal();

        try {
            const response = await api.delete(`/book-catalogs/${bookToDelete._id}`);
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

    const cancelDelete = () => {
        setShowConfirmModal(false);
        setBookToDelete(null);
        showFlashMessage('Deletion cancelled.', 'info');
    };

    const handleCancelEdit = () => {
        setFormData({
            bookName: '', publication: publications[0]?._id || '', subtitle: '',
            language: languages[0]?._id || '', bookType: 'default', commonPrice: 0,
            pricesByClass: {}, commonIsbn: '', isbnByClass: {}, status: 'active'
        });
        setEditingBookCatalogId(null);
        setLocalError(null);
    };

    // Filtered and paginated data
const filteredBookCatalogs = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return bookCatalogs.filter((bookCatalogItem) => {
        const bookName = bookCatalogItem.bookName || '';
        const publicationName = bookCatalogItem.publication?.name || '';
        const languageName = bookCatalogItem.language?.name || '';
        const subtitleName = bookCatalogItem.subtitle?.name || '';

        const matchesPublication =
            publicationFilter === 'all' || bookCatalogItem.publication?._id === publicationFilter;

        const matchesSubtitle =
            subtitleFilter === 'all' || bookCatalogItem.subtitle?._id === subtitleFilter;

        const matchesLanguage =
            languageFilter === 'all' || bookCatalogItem.language?._id === languageFilter;

        const matchesSearch =
            bookName.toLowerCase().includes(lowerCaseSearchTerm) ||
            publicationName.toLowerCase().includes(lowerCaseSearchTerm) ||
            languageName.toLowerCase().includes(lowerCaseSearchTerm) ||
            subtitleName.toLowerCase().includes(lowerCaseSearchTerm);

        return matchesPublication && matchesSubtitle && matchesLanguage && matchesSearch;
    });
}, [bookCatalogs, searchTerm, publicationFilter, subtitleFilter, languageFilter]);
    const totalRecords = filteredBookCatalogs.length;
    const totalPages = Math.ceil(totalRecords / itemsPerPage);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredBookCatalogs.slice(startIndex, endIndex);
    }, [filteredBookCatalogs, currentPage, itemsPerPage]);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page when items per page changes
    };

    // --- Helper function to get class name by ID ---
    const getClassName = (classId) => {
        return classes.find(c => c._id === classId)?.name || 'Unknown';
    };


    // --- PDF Download Functionality ---
    // --- PDF Download Functionality ---
    const downloadPdf = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation failed: Core libraries are not loaded. Please check your script links.', 'error');
            console.error("PDF generation failed: window.jspdf is not available. Ensure CDNs for jsPDF are correctly linked in your HTML file.");
            return;
        }

        const doc = new window.jspdf.jsPDF('l', 'mm', 'a4');

        let startY = addHeaderAndSetStartY(doc, companyLogo, 25, 22);
        startY = addReportTitle(doc, startY, "Book Catalog Report");

        const tableColumn = ["S.No.", "Book Name", "Publication", "Subtitle", "Language", "ISBN No.", "Discount"];
        const tableRows = filteredBookCatalogs.map((book, index) => [
            index + 1,
            book.bookName,
            book.publication ? book.publication.name : 'N/A',
            book.subtitle ? book.subtitle.name : 'N/A',
            book.language ? book.language.name : 'N/A',
            // Corrected line: Join ISBNs from pricesByClass, or use commonIsbn
            book.bookType === 'common_price'
                ? book.commonIsbn || 'N/A'
                : Object.entries(book.isbnByClass)
                    .filter(([classId, isbn]) => isbn)
                    .map(([classId, isbn]) => `${getClassName(classId)}/${isbn}`)
                    .join(', '),
            // Corrected line: Format discount percentage
            `${book.discountPercentage}%`
        ]);

        addTableToDoc(doc, tableColumn, tableRows, startY);

        doc.save(`Book_Catalog_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
        showFlashMessage('Book catalog list downloaded as PDF!', 'success');
    };
    // --- UI Rendering ---
    return (
        <div className="book-catalog-management-container">
            <h2 className="main-section-title">Book Catalog Management</h2>

            {localError && (
                <p className="error-message text-center">
                    <FaTimesCircle className="error-icon" /> {localError}
                </p>
            )}

            {/* Main content layout for two columns */}
            <div className="main-content-layout">


                {/* Book Catalog Creation/Update Form - SECOND CHILD */}
                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        <h3 className="form-title">{editingBookCatalogId ? 'Edit Book Catalog' : 'Add Book Catalog'}</h3>

                        {/* Book Type and Price Fields */}
                        <div className="form-group">
                            {/* <label>Book Type:</label> */}
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
                        <div className="form-row">

                            <div className="form-group">
                                <label htmlFor="publication">Publication Name:</label>
                                <select
                                    id="publication"
                                    name="publication"
                                    value={formData.publication}
                                    onChange={handleChange}
                                    required
                                    disabled={loading || publications.length === 0}
                                    className="form-select"
                                >
                                    <option value="">-- SELECT PUBLICATION   --</option>
                                    {publications.length === 0 ? (
                                        <option value="">Loading Publications...</option>
                                    ) : (
                                        <>
                                            {/* <option value="">-- SELECT PUBLICATION --</option> */}
                                            {publications.map(pub => (
                                                <option key={pub._id} value={pub._id}>
                                                    {pub.name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="subtitle">Sub Title:</label>
                                <select
                                    id="subtitle"
                                    name="subtitle"
                                    value={formData.subtitle}
                                    onChange={handleChange}
                                    disabled={loading || !formData.publication || subtitles.length === 0}
                                    className="form-select"
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

                        </div>

                        <div className="form-row">

                            <div className="form-group">
                                <label htmlFor="language">Elective Language:</label>
                                <select
                                    id="language"
                                    name="language"
                                    value={formData.language}
                                    onChange={handleChange}
                                    disabled={loading || languages.length === 0}
                                    className="form-select"
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
                            <div className="form-group">
                                <label htmlFor="bookName">Book Name:</label>
                                <input
                                    type="text"
                                    id="bookName"
                                    name="bookName"
                                    value={formData.bookName}
                                    onChange={handleChange}
                                    placeholder="e.g., Science Textbook"
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>



                        {formData.bookType === 'common_price' && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="commonPrice">Common Price (RS):</label>
                                    <input
                                        type="number"
                                        id="commonPrice"
                                        name="commonPrice"
                                        value={formData.commonPrice}
                                        onChange={handleChange}
                                        placeholder="e.g., 150.00"
                                        min="0"
                                        // step="0.01"
                                        required
                                        disabled={loading}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="commonIsbn">Common ISBN:</label>
                                    <input
                                        type="text"
                                        id="commonIsbn"
                                        name="commonIsbn"
                                        value={formData.commonIsbn}
                                        onChange={handleChange}
                                        placeholder="e.g., 978-3-16-148410-0"
                                        disabled={loading}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        )}

                        {/* 🔹 Prices & ISBNs (swipe navigation) */}
                        {formData.bookType === 'default' && (
                            <div className="prices-by-class-section">
                                <h4 className="sub-section-title">Prices & ISBNs by Class:</h4>

                                {classes.length === 0 ? (
                                    <p className="loading-state">Loading classes...</p>
                                ) : (
                                    <div className="class-price-container">
                                        {/* Left Button */}
                                        <button
                                            type="button"
                                            className="nav-btn"
                                            onClick={() =>
                                                setCurrentClassIndex((prev) =>
                                                    prev > 0 ? prev - 1 : classes.length - 1
                                                )
                                            }
                                        >
                                            <FaChevronLeft />
                                        </button>

                                        {/* Single Class Input */}
                                        <div className="form-group class-card">
                                            <h5>Class : {classes[currentClassIndex]?.name}</h5>

                                            {/* Price input */}
                                            <label htmlFor={`price_${classes[currentClassIndex]._id}`}>
                                                Price:
                                            </label>
                                            <input
                                                type="number"
                                                id={`price_${classes[currentClassIndex]._id}`}
                                                name={`price_${classes[currentClassIndex]._id}`}
                                                value={
                                                    formData.pricesByClass[classes[currentClassIndex]._id] || ''
                                                }
                                                onChange={handleChange}
                                                min="0"
                                                // step="0.01"
                                                className="form-input"
                                            />

                                            {/* Toggle Button for ISBN */}
                                            <button
                                                type="button"
                                                className="toggle-isbn-btn"
                                                onClick={() =>
                                                    setIsbnVisible((prev) => ({
                                                        ...prev,
                                                        [classes[currentClassIndex]._id]: !prev[classes[currentClassIndex]._id],
                                                    }))
                                                }
                                            >
                                                {isbnVisible[classes[currentClassIndex]._id] ? '- Hide ISBN' : '+ Add ISBN'}
                                            </button>

                                            {/* ISBN input (only shown when toggled) */}
                                            {isbnVisible[classes[currentClassIndex]._id] && (
                                                <>
                                                    <label htmlFor={`isbn_${classes[currentClassIndex]._id}`}>
                                                        ISBN:
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id={`isbn_${classes[currentClassIndex]._id}`}
                                                        name={`isbn_${classes[currentClassIndex]._id}`}
                                                        value={
                                                            formData.isbnByClass[classes[currentClassIndex]._id] || ''
                                                        }
                                                        onChange={handleChange}
                                                        className="form-input"
                                                    />
                                                </>
                                            )}
                                        </div>

                                        {/* Right Button */}
                                        <button
                                            type="button"
                                            className="nav-btn"
                                            onClick={() =>
                                                setCurrentClassIndex((prev) =>
                                                    prev < classes.length - 1 ? prev + 1 : 0
                                                )
                                            }
                                        >
                                            <FaChevronRight />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}


                        {/* REMOVED: Discount and GST fields */}
                        {/* <div className="form-row">
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
                                    // step="0.01"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="gstPercentage">Net Profit %:</label>
                                <input
                                    type="number"
                                    id="gstPercentage"
                                    name="gstPercentage"
                                    value={formData.gstPercentage}
                                    onChange={handleChange}
                                    placeholder="e.g., 18"
                                    min="0"
                                    max="100"
                                    // step="0.01"
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div> */}

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
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : (editingBookCatalogId ? 'Update Book' : 'Add Book')}
                            </button>
                            {editingBookCatalogId && (
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

                {/* Book Catalog List Table - FIRST CHILD */}
                <div className="table-section">
                    {/* <h3 className="table-title">Existing Book Catalogs</h3>  */}



                    {loading && bookCatalogs.length === 0 ? (
                        <p className="loading-state text-center">
                            <FaSpinner className="animate-spin mr-2" /> Loading book catalogs...
                        </p>
                    ) : filteredBookCatalogs.length === 0 ? (
                        <p className="no-data-message text-center">No book catalogs found matching your criteria. Start by adding one!</p>
                    ) : (
                        <div className="table-container"> {/* This div is for table overflow, not layout */}
                        
                            <div className="table-controls">
                                <div className="search-input-group">
                                    <input
                                        type="text"
                                        placeholder="Search books..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="search-input"
                                        disabled={loading}
                                    />
                                    <FaSearch className="search-icon" />
                                </div>

                                {/* Add Publication Filter */}
    <div className="filter-group">
        <label htmlFor="publicationFilter" className="mr-2"></label>
        <select
            id="publicationFilter"
            value={publicationFilter}
            onChange={(e) => {
                const selectedPublicationId = e.target.value;
                setPublicationFilter(selectedPublicationId);
                setCurrentPage(1);
                // Fetch subtitles for the selected publication
                fetchSubtitles(selectedPublicationId);
            }}
            className="form-select"
            disabled={loading || publications.length === 0}
        >
            <option value="all">All Publications</option>
            {publications.map((pub) => (
                <option key={pub._id} value={pub._id}>
                    {pub.name}
                </option>
            ))}
        </select>
    </div>

                                <div className="filter-group">
                                    <label htmlFor="subtitleFilter" className="mr-2"></label>
                                    <select
                                        id="subtitleFilter"
                                        value={subtitleFilter}
                                        onChange={(e) => {
                                            setSubtitleFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="form-select"
                                        disabled={loading || subtitles.length === 0}
                                    >
                                        <option value="all">All Subtitles</option>
                                        {subtitles.map((sub) => (
                                            <option key={sub._id} value={sub._id}>
                                                {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label htmlFor="languageFilter" className="mr-2"></label>
                                    <select
                                        id="languageFilter"
                                        value={languageFilter}
                                        onChange={(e) => {
                                            setLanguageFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="form-select"
                                        disabled={loading}
                                    >
                                        <option value="all">All Languages</option>
                                        {languages.map((lang) => (
                                            <option key={lang._id} value={lang._id}>
                                                {lang.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setPublicationFilter('all');
                                        setSubtitleFilter('all');
                                        setLanguageFilter('all');
                                        setSubtitles([]); // Clear subtitles
                                        setCurrentPage(1);
                                    }}
                                    className="btn btn-secondary"
                                    disabled={loading}
                                >
                                    Reset Filters
                                </button> */}
                                <button
                                    onClick={downloadPdf}
                                    className="btn btn-info download-pdf-btn"
                                    disabled={loading || filteredBookCatalogs.length === 0}
                                >
                                    <FaFilePdf className="btn-icon-mr" /> Download PDF
                                </button>
                            </div>
                            <table className="app-table">
                                <thead>
                                    <tr>
                                        <th>S.No.</th>
                                        <th>Publication</th>
                                        <th>Subtitle</th>
                                        <th>Book Name</th>
                                        <th>Price</th>
                                        <th>ISBN No.</th>
                                        <th>Language</th>
                                        {/* REMOVED: Discount % and Net Profit % headers */}
                                        {/* <th>Discount %</th>
                                        <th>Net Profit %</th> */}
                                        <th>Add Date</th>
                                        {/* <th>Status</th>\ */}
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((book, index) => (
                                        <tr key={book._id}>
                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td>{book.publication?.name || 'N/A'}</td>
                                            <td>{book.subtitle?.name || 'N/A'}</td>
                                            <td>{book.bookName}</td>
                                            <td>
                                                {book.bookType === 'common_price'
                                                    ? `Rs${book.commonPrice ? parseFloat(book.commonPrice) : '0'}`
                                                    : Object.entries(book.pricesByClass)
                                                        .filter(([classId, price]) => price)
                                                        .map(([classId, price]) => `${getClassName(classId)}/${price}`)
                                                        .join(', ')
                                                }
                                            </td>
                                            <td>
                                                {book.bookType === 'common_price'
                                                    ? book.commonIsbn || 'N/A'
                                                    : Object.entries(book.isbnByClass)
                                                        .filter(([classId, isbn]) => isbn)
                                                        .map(([classId, isbn]) => `${getClassName(classId)}/${isbn}`)
                                                        .join(', ')
                                                }
                                            </td>
                                            <td>{book.language?.name || 'N/A'}</td>
                                            {/* REMOVED: Discount % and Net Profit % cells */}
                                            {/* <td>{book.discountPercentage?.toFixed(2) || '0.00'}%</td>
                                            <td>{book.gstPercentage?.toFixed(2) || '0.00'}%</td> */}
                                            <td>{formatDateWithTime(book.createdAt)}</td>
                                            <td className="actions-column">
                                                <button
                                                    onClick={() => handleEdit(book)}
                                                    className="action-icon-button edit-button"
                                                    title="Edit Book Catalog"
                                                    disabled={loading}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(book)}
                                                    className="action-icon-button delete-button"
                                                    title="Delete Book Catalog"
                                                    disabled={loading}
                                                >
                                                    {loading && bookToDelete?._id === book._id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} className="btn btn-page">
                                        <FaChevronLeft className="btn-icon-mr" /> Previous
                                    </button>
                                    <span>Page {currentPage} of {totalPages}</span>
                                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} className="btn btn-page">
                                        Next <FaChevronRight className="btn-icon-ml" />
                                    </button>
                                </div>
                            )}
                            <div className="total-records text-center mt-2">
                                Total Records: {filteredBookCatalogs.length}
                            </div>
                        </div>
                    )}
                </div>
            </div> {/* End of main-content-layout */}

            {/* Confirmation Modal */}
            {showConfirmModal && bookToDelete && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete book: <strong>{bookToDelete.bookName}</strong>?</p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="btn btn-danger" disabled={loading}>
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Delete'}
                            </button>
                            <button onClick={cancelDelete} className="btn btn-secondary" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookCatalogManagement;