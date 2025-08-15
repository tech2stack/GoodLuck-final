// src/components/masters/BookCatalogManagement.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../../utils/api'; // API utility for backend calls
import { FaEdit, FaTrashAlt, FaPlusCircle, FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner, FaTimesCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa'; // Icons for UI

// Stylesheets (assuming these are already present and styled for consistency)
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';
// Import the new BookCatalogManagement specific styles
import '../../styles/BookCatalogManagement.css';

// NOTE: jsPDF and jspdf-autotable are expected to be loaded globally via CDN in public/index.html
// If you are using npm, you'd do: npm install jspdf jspdf-autotable
// Then import them here:
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';

// Import the logo image directly (assuming it exists at this path)
import companyLogo from '../../assets/glbs-logo.jpg';


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
        bookName: '', // Changed from 'name' to 'bookName'
        publication: '',
        subtitle: '', // Can be null
        language: '', // Can be null
        bookType: 'default', // 'default' or 'common_price'
        commonPrice: 0,
        pricesByClass: {}, // Object to store prices per class { 'Class 1': 100, 'Class 2': 120 }
        commonIsbn: '', // New field for Common ISBN
        isbnByClass: {}, // New field for ISBNs per class
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
    const [bookToDelete, setBookToDelete] = useState(null);

    // New state to manage the expanded row for details
    const [expandedRowId, setExpandedRowId] = useState(null);

    // Ref for scrolling to the new item in the table (if needed)
    const tableBodyRef = useRef(null);

    // States for Search
    const [searchTerm, setSearchTerm] = useState('');

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
        const { name, value, type, checked } = e.target;

        if (name === 'bookType') {
            setFormData(prev => ({
                ...prev,
                bookType: value,
                commonPrice: value === 'default' ? 0 : prev.commonPrice, // Clear commonPrice if switching to default
                pricesByClass: value === 'common_price' ? {} : prev.pricesByClass, // Clear pricesByClass if switching to common
                commonIsbn: value === 'default' ? '' : prev.commonIsbn, // Clear commonIsbn if switching to default
                isbnByClass: value === 'common_price' ? {} : prev.isbnByClass, // Clear isbnByClass if switching to common
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
        } else if (name.startsWith('isbn_')) { // Handle dynamic class ISBNs
            const classId = name.split('_')[1];
            setFormData(prev => ({
                ...prev,
                isbnByClass: {
                    ...prev.isbnByClass,
                    [classId]: value
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
                bookName: '', // Changed from 'name' to 'bookName'
                publication: publications[0]?._id || '',
                subtitle: '',
                language: languages[0]?._id || '',
                bookType: 'default',
                commonPrice: 0,
                pricesByClass: {},
                commonIsbn: '',
                isbnByClass: {},
                discountPercentage: 0,
                gstPercentage: 0,
                status: 'active',
            });
            setEditingBookCatalogId(null);
            fetchBookCatalogs(true); // Re-fetch and indicate to scroll
        } catch (err) {
            console.error('Error saving book catalog:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save book catalog. Please check your input and ensure book name is unique for the selected publication/subtitle/language combination.';
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
            discountPercentage: bookCatalogItem.discountPercentage || '', // Use empty string for 0 to avoid NaN warning on empty input
            gstPercentage: bookCatalogItem.gstPercentage || '', // Use empty string for 0 to avoid NaN warning on empty input
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
            pricesByClass: {}, commonIsbn: '', isbnByClass: {}, discountPercentage: 0, gstPercentage: 0, status: 'active'
        });
        setEditingBookCatalogId(null);
        setLocalError(null);
    };

    // Filtered and paginated data
    const filteredBookCatalogs = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return bookCatalogs.filter(bookCatalogItem => {
            // Defensive checks for undefined properties before calling toLowerCase()
            const bookName = bookCatalogItem.bookName || '';
            const publicationName = bookCatalogItem.publication?.name || '';
            const languageName = bookCatalogItem.language?.name || '';
            const subtitleName = bookCatalogItem.subtitle?.name || '';

            return (
                bookName.toLowerCase().includes(lowerCaseSearchTerm) ||
                publicationName.toLowerCase().includes(lowerCaseSearchTerm) ||
                languageName.toLowerCase().includes(lowerCaseSearchTerm) ||
                subtitleName.toLowerCase().includes(lowerCaseSearchTerm)
            );
        });
    }, [bookCatalogs, searchTerm]);

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
    const downloadPdf = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation libraries not fully loaded or accessible. Check console for details.', 'error');
            console.error("PDF generation failed: window.jspdf or window.jspdf.jsPDF is not available/callable. Ensure CDNs are correctly linked in public/index.html");
            return;
        }

        const doc = new window.jspdf.jsPDF('portrait', 'mm', 'a4');


        if (typeof doc.autoTable !== 'function') {
            showFlashMessage('PDF Table plugin (jspdf-autotable) not loaded or accessible. Check console for details.', 'error');
            console.error("PDF generation failed: doc.autoTable is not a function. Ensure jspdf.plugin.autotable.min.js is correctly linked and loaded AFTER jspdf.umd.min.js.");
            return;
        }

        // Define company details for PDF header
        const companyName = "GOOD LUCK BOOK STORE";
        const companyAddress = "Shop NO. 2, Shriji Tower, Ashoka Garden, Bhopal";
        const companyMobile = "Mobile Number: 7024136476";
        const companyGST = "GST NO: 23EAVPP3772F1Z8";
        const companyLogoUrl = companyLogo; // Use the imported logo directly

        // Function to generate the main report content (title, line, table, save)
        // This function now accepts the dynamic startYPositionForTable as an argument
        const generateReportBody = (startYPositionForTable) => {
            // Add a professional report title (centered, below company info)
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30); // Dark gray for title
            // Adjust Y position for the report title to be below company info
            doc.text("Book Catalog List Report", doc.internal.pageSize.width / 2, startYPositionForTable + 10, { align: 'center' });

            // Add a line separator below the main title
            doc.setLineWidth(0.5);
            doc.line(14, startYPositionForTable + 15, doc.internal.pageSize.width - 14, startYPositionForTable + 15); // Line spanning almost full width

            // Update startYPositionForTable for autoTable
            const tableStartY = startYPositionForTable + 20;


            // Generate table data
            const tableColumn = [
                "S.No.", "Name", "Publisher", "Subtitle", "Language", "Price",
                "ISBN", "Discount %", "GST %", "Add Date", "Status"
            ];
            const tableRows = filteredBookCatalogs.map((bookItem, index) => [
                // S.No. is always index + 1 for the filtered data for PDF
                index + 1, // Use index + 1 for S.No.
                String(bookItem.bookName || '').trim(),
                String(bookItem.publication?.name || bookItem.publication || '').trim(),
                String(bookItem.subtitle?.name || bookItem.subtitle || '').trim(),
                String(bookItem.language?.name || bookItem.language || '').trim(), // Ensure language is displayed
                bookItem.bookType === 'common_price'
                    ? `Rs${bookItem.commonPrice?.toFixed(2) || '0.00'}`
                    : Object.entries(bookItem.pricesByClass).map(([classId, price]) => `${classes.find(c => c._id === classId)?.name || 'Unknown'}: Rs${price?.toFixed(2) || '0.00'}`).join(', '),
                bookItem.bookType === 'common_price'
                    ? bookItem.commonIsbn || 'N/A'
                    : Object.entries(bookItem.isbnByClass).map(([classId, isbn]) => `${classes.find(c => c._id === classId)?.name || 'Unknown'}: ${isbn || 'N/A'}`).join(', '),
                `${bookItem.discountPercentage?.toFixed(2) || '0.00'}%`, // Add fallback for discount, format to 2 decimal places
                `${bookItem.gstPercentage?.toFixed(2) || '0.00'}%`, // Add fallback for GST, format to 2 decimal places
                bookItem.createdAt ? formatDateWithTime(bookItem.createdAt) : 'N/A',
                (bookItem.status?.charAt(0).toUpperCase() + bookItem.status?.slice(1)) || 'N/A'
            ]);

            // Add the table to the document with professional styling
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: tableStartY, // Use our dynamic start position
                theme: 'plain', // Changed to 'plain' for a cleaner look like the reference PDF
                styles: {
                    font: 'helvetica',
                    fontSize: 10,
                    cellPadding: 3,
                    textColor: [51, 51, 51], // Default text color for body
                    valign: 'middle',
                    halign: 'left'
                },
                headStyles: {
                    fillColor: [240, 240, 240], // Light gray header
                    textColor: [51, 51, 51], // Dark text for header
                    fontStyle: 'bold',
                    halign: 'center', // Center align header text
                    valign: 'middle', // Vertically align header text
                    lineWidth: 0.1, // Add a thin border to header cells
                    lineColor: [200, 200, 200] // Light gray border
                },
                bodyStyles: {
                    lineWidth: 0.1, // Add a thin border to body cells
                    lineColor: [200, 200, 200] // Light gray border
                },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 'auto', halign: 'left' },
                    2: { cellWidth: 'auto', halign: 'left' }, 3: { cellWidth: 'auto', halign: 'left' },
                    4: { cellWidth: 'auto', halign: 'left' }, 5: { cellWidth: 'auto', halign: 'right' },
                    6: { cellWidth: 'auto', halign: 'center' }, 7: { cellWidth: 'auto', halign: 'center' },
                    8: { halign: 'center' }, 9: { halign: 'center' }
                },
                margin: { top: 10, right: 14, bottom: 10, left: 14 },
                didDrawPage: function (data) {
                    // Add footer on each page
                    doc.setFontSize(10);
                    doc.setTextColor(100); // Gray color for footer text
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
                }
            });

            // Save the PDF
            // The toLocaleDateString('en-CA') gives YYYY-MM-DD, then replace hyphens with underscores for filename
            doc.save(`Book_Catalog_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`);
            showFlashMessage('Book Catalog list downloaded as PDF!', 'success');
        };

        // 5. **Handle Logo Loading Asynchronously:**
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Important for CORS if using a different domain
        img.onload = () => {
            const logoX = 14; // Left margin for logo
            const logoY = 10; // Top margin for logo
            const imgWidth = 25; // Changed: Reduced logo width
            const imgHeight = (img.height * imgWidth) / img.width; // Maintain aspect ratio

            // Add the logo at the top-left
            doc.addImage(img, 'JPEG', logoX, logoY, imgWidth, imgHeight);

            // Add company name and details next to logo
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(companyName, logoX + imgWidth + 5, logoY + 5); // Company Name

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            doc.text(companyAddress, logoX + imgWidth + 5, logoY + 12); // Address
            doc.text(companyMobile, logoX + imgWidth + 5, logoY + 17); // Mobile
            doc.text(companyGST, logoX + imgWidth + 5, logoY + 22); // GST No.

            // Calculate startYPositionForTable based on logo and company info block
            const calculatedStartY = Math.max(logoY + imgHeight + 10, logoY + 22 + 10); // Ensure enough space
            generateReportBody(calculatedStartY); // Pass the calculated Y position
        };

        img.onerror = () => {
            console.warn("Logo image could not be loaded. Generating PDF without logo.");
            // If logo fails, add only company info block
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(companyName, 14, 20); // Company Name

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            doc.text(companyAddress, 14, 27); // Address
            doc.text(companyMobile, 14, 32); // Mobile
            doc.text(companyGST, 14, 37); // GST No.

            const calculatedStartY = 45; // Adjust startY since no logo
            generateReportBody(calculatedStartY); // Pass the calculated Y position
        };

        img.src = companyLogoUrl; // This will now use the imported image data

        // Add generation date/time to the top right (this part can run immediately)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100); // Gray color for date text
        doc.text(`Date: ${formatDateWithTime(new Date())}`, doc.internal.pageSize.width - 14, 20, { align: 'right' });
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

                        {formData.bookType === 'default' && (
                            <div className="prices-by-class-section">
                                <h4 className="sub-section-title">Prices & ISBNs by Class:</h4>
                                <div className="form-grid-2-cols">
                                    {classes.length === 0 ? (
                                        <p className="loading-state">Loading classes for prices...</p>
                                    ) : (
                                        classes.map(_class => (
                                            <div className="class-fields-group" key={_class._id}>
                                                <div className="form-group">
                                                    <label htmlFor={`price_${_class._id}`}>{_class.name} Price:</label>
                                                    <input
                                                        type="number"
                                                        id={`price_${_class._id}`}
                                                        name={`price_${_class._id}`}
                                                        value={formData.pricesByClass[_class._id] || ''}
                                                        onChange={handleChange}
                                                        placeholder="e.g., 120.00"
                                                        min="0"
                                                        disabled={loading}
                                                        className="form-input"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor={`isbn_${_class._id}`}>{_class.name} ISBN:</label>
                                                    <input
                                                        type="text"
                                                        id={`isbn_${_class._id}`}
                                                        name={`isbn_${_class._id}`}
                                                        value={formData.isbnByClass[_class._id] || ''}
                                                        onChange={handleChange}
                                                        placeholder="e.g., 1234567890"
                                                        disabled={loading}
                                                        className="form-input"
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
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
                        <button onClick={downloadPdf} className="btn btn-info download-pdf-btn" disabled={loading || filteredBookCatalogs.length === 0}>
                            <FaFilePdf className="btn-icon-mr" /> Download PDF
                        </button>
                    </div>

                    {loading && bookCatalogs.length === 0 ? (
                        <p className="loading-state text-center">
                            <FaSpinner className="animate-spin mr-2" /> Loading book catalogs...
                        </p>
                    ) : filteredBookCatalogs.length === 0 ? (
                        <p className="no-data-message text-center">No book catalogs found matching your criteria. Start by adding one!</p>
                    ) : (
                        <div className="table-container"> {/* This div is for table overflow, not layout */}
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
                                        <th>Discount %</th>
                                        <th>Net Profit %</th>
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
                                                    ? `Rs${book.commonPrice?.toFixed(2) || '0.00'}`
                                                    : Object.entries(book.pricesByClass)
                                                        .filter(([classId, price]) => price)
                                                        .map(([classId, price]) => `${getClassName(classId)}/${price?.toFixed(2)}`)
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
                                            <td>{book.discountPercentage?.toFixed(2) || '0.00'}%</td>
                                            <td>{book.gstPercentage?.toFixed(2) || '0.00'}%</td>
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