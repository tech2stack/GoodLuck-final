import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../../utils/api';
import * as XLSX from 'xlsx';
import {
    FaEdit,
    FaTrashAlt,
    FaPlusCircle,
    FaSearch,
    FaFilePdf,
    FaFileExcel,
    FaWhatsapp,
    FaEnvelope,
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
    const [showLanguageField, setShowLanguageField] = useState(false);
    const [showPriceSection, setShowPriceSection] = useState(false);
    const [showAllIsbn, setShowAllIsbn] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

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

    const topRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [editingBookCatalogId, setEditingBookCatalogId] = useState(null);
    const [currentClassIndex, setCurrentClassIndex] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [bookCatalogToDeleteId, setBookCatalogToDeleteId] = useState(null);
    const [bookCatalogToDeleteName, setBookCatalogToDeleteName] = useState('');
    const [bookToDelete, setBookToDelete] = useState(null);
    const [priceDropdownId, setPriceDropdownId] = useState(null);
    const dropdownRef = useRef(null);
    const tableBodyRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [publicationFilter, setPublicationFilter] = useState('all');
    const [subtitleFilter, setSubtitleFilter] = useState('all');
    const [languageFilter, setLanguageFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [highlightedId, setHighlightedId] = useState(null);

    const formatDateWithTime = (dateString) => {
        if (!dateString) return 'N/A';
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        };
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', options);
    };

    const fetchDropdownData = useCallback(async () => {
        try {
            setLoading(true);
            const [publicationsRes, languagesRes, classesRes] = await Promise.all([
                api.get('/publications?status=active&limit=1000'),
                api.get('/languages?status=active&limit=1000'),
                api.get('/classes?status=active&limit=1000'),
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
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
            showFlashMessage('Failed to load necessary data for form (Publications, Languages, Classes).', 'error');
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]);

    const fetchSubtitles = useCallback(
        (publicationId, initialSubtitleId = null) => {
            const selectedPub = publications.find((pub) => pub._id === publicationId);
            if (!selectedPub) {
                setSubtitles([]);
                setFormData((prev) => ({ ...prev, subtitle: '' }));
                setSubtitleFilter('all');
                return;
            }
            const fetchedSubtitles = selectedPub.subtitles || [];
            setSubtitles(fetchedSubtitles);
            if (initialSubtitleId) {
                const subtitleExistsInFetched = fetchedSubtitles.some((sub) => sub._id === initialSubtitleId);
                if (subtitleExistsInFetched) {
                    setFormData((prev) => ({ ...prev, subtitle: initialSubtitleId }));
                } else {
                    setFormData((prev) => ({ ...prev, subtitle: '' }));
                }
            } else {
                setFormData((prev) => ({ ...prev, subtitle: fetchedSubtitles[0]?._id || '' }));
            }
        },
        [publications]
    );

    const fetchBookCatalogs = useCallback(async () => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get(`/book-catalogs`);
            if (response.data.status === 'success') {
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

    useEffect(() => {
        fetchDropdownData();
        fetchBookCatalogs();
    }, [fetchDropdownData, fetchBookCatalogs]);

    useEffect(() => {
        if (publicationFilter !== 'all') {
            const selectedPub = publications.find((pub) => pub._id === publicationFilter);
            if (selectedPub) {
                setSubtitles(selectedPub.subtitles || []);
            } else {
                setSubtitles([]);
            }
        } else {
            setSubtitles([]);
            setSubtitleFilter('all');
        }
        setSubtitleFilter('all');
    }, [publicationFilter, publications]);

    useEffect(() => {
        if (!editingBookCatalogId) {
            fetchSubtitles(formData.publication);
        }
    }, [formData.publication, fetchSubtitles, editingBookCatalogId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setPriceDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
            for (const classId in formData.pricesByClass) {
                const price = formData.pricesByClass[classId];
                if (price === undefined || price === null || isNaN(price) || price === '' || price < 0) {
                    setLocalError(`Price for class ${classes.find(c => c._id === classId)?.name || classId} is invalid. Must be a non-negative number.`);
                    showFlashMessage('Invalid class price detected.', 'error');
                    setLoading(false);
                    return;
                }
            }
        }

        const dataToSend = { ...formData };
        if (dataToSend.subtitle === '') dataToSend.subtitle = null;
        if (dataToSend.language === '') dataToSend.language = null;

        if (dataToSend.bookType === 'default') {
            delete dataToSend.commonPrice;
            delete dataToSend.commonIsbn;
            const numericPricesByClass = {};
            const nonEmptyIsbnByClass = {};
            for (const key in dataToSend.pricesByClass) {
                if (dataToSend.pricesByClass[key] !== '') {
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
        } else {
            delete dataToSend.pricesByClass;
            delete dataToSend.isbnByClass;
            dataToSend.commonPrice = parseFloat(dataToSend.commonPrice);
        }

        try {
            let response;
            if (editingBookCatalogId) {
                response = await api.patch(`/book-catalogs/${editingBookCatalogId}`, dataToSend);
                if (response.data.status === 'success') {
                    showFlashMessage('Book Catalog updated successfully!', 'success');
                    await fetchBookCatalogs();
                } else {
                    throw new Error(response.data.message || 'Failed to update book catalog.');
                }
            } else {
                response = await api.post('/book-catalogs', dataToSend);
                if (response.data.status === 'success') {
                    showFlashMessage('Book Catalog created successfully!', 'success');
                    const newBookCatalog = {
                        ...response.data.data.bookCatalog,
                        publication: publications.find(pub => pub._id === formData.publication) || { name: 'N/A' },
                        subtitle: subtitles.find(sub => sub._id === formData.subtitle) || null,
                        language: languages.find(lang => lang._id === formData.language) || null,
                    };
                    setBookCatalogs(prev => [newBookCatalog, ...prev]);
                    setHighlightedId(newBookCatalog._id);
                    setTimeout(() => setHighlightedId(null), 4000);
                    setSearchTerm('');
                    setPublicationFilter('all');
                    setSubtitleFilter('all');
                    setLanguageFilter('all');
                    setCurrentPage(1);
                    if (topRef.current) {
                        topRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                } else {
                    throw new Error(response.data.message || 'Failed to create book catalog.');
                }
            }

            setFormData({
                bookName: '',
                publication: formData.publication,
                subtitle: formData.subtitle,
                language: formData.language,
                bookType: 'default',
                commonPrice: 0,
                pricesByClass: {},
                commonIsbn: '',
                isbnByClass: {},
                status: 'active',
            });
            setEditingBookCatalogId(null);
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

    const handleEdit = (bookCatalogItem) => {
        const pricesMap = bookCatalogItem.pricesByClass
            ? Object.fromEntries(Object.entries(bookCatalogItem.pricesByClass))
            : {};
        const isbnsMap = bookCatalogItem.isbnByClass
            ? Object.fromEntries(Object.entries(bookCatalogItem.isbnByClass))
            : {};

        setFormData(prev => ({
            ...prev,
            bookName: bookCatalogItem.bookName,
            publication: bookCatalogItem.publication?._id || '',
            language: bookCatalogItem.language?._id || '',
            bookType: bookCatalogItem.bookType,
            commonPrice: bookCatalogItem.commonPrice || '',
            pricesByClass: pricesMap,
            commonIsbn: bookCatalogItem.commonIsbn || '',
            isbnByClass: isbnsMap,
            status: bookCatalogItem.status,
        }));
        setEditingBookCatalogId(bookCatalogItem._id);
        setLocalError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchSubtitles(bookCatalogItem.publication?._id, bookCatalogItem.subtitle?._id);
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
    const totalPages = Math.ceil(totalRecords / itemsPerPage) || 1;

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredBookCatalogs.slice(startIndex, endIndex);
    }, [filteredBookCatalogs, currentPage, itemsPerPage]);

    const handlePageChange = (page) => {
        if (page > 0 && page <= Math.max(totalPages, 1)) {
            setCurrentPage(page);
        }
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const getClassName = (classId) => {
        return classes.find(c => c._id === classId)?.name || 'Unknown';
    };

    const togglePriceDropdown = (bookId, e) => {
        e.stopPropagation();
        setPriceDropdownId(priceDropdownId === bookId ? null : bookId);
    };

    const generatePdfBlob = () => {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation failed: jsPDF library is not loaded.', 'error');
            console.error("PDF generation failed: window.jspdf is not available.");
            return null;
        }

        try {
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
                book.bookType === 'common_price'
                    ? book.commonIsbn || 'N/A'
                    : Object.entries(book.isbnByClass || {})
                        .filter(([classId, isbn]) => isbn)
                        .map(([classId, isbn]) => `${getClassName(classId)}/${isbn}`)
                        .join(', '),
                `${book.discountPercentage}%`,
            ]);

            addTableToDoc(doc, tableColumn, tableRows, startY);
            const blob = doc.output('blob');
            if (!blob || blob.size === 0) {
                throw new Error('Generated PDF blob is empty or invalid.');
            }
            return blob;
        } catch (err) {
            console.error('Error generating PDF blob:', err);
            showFlashMessage('Failed to generate PDF for sharing.', 'error');
            return null;
        }
    };

    const downloadPdf = () => {
        const blob = generatePdfBlob();
        if (!blob) return;

        try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Book_Catalog_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showFlashMessage('Book catalog list downloaded as PDF!', 'success');
        } catch (err) {
            console.error('Error downloading PDF:', err);
            showFlashMessage('Failed to download PDF.', 'error');
        }
    };

    const handleShare = async (method) => {
        setLoading(true);
        const blob = generatePdfBlob();
        if (!blob) {
            setLoading(false);
            showFlashMessage('Failed to generate PDF for sharing.', 'error');
            return;
        }

        const fileName = `Book_Catalog_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.pdf`;
        const file = new File([blob], fileName, { type: 'application/pdf', lastModified: Date.now() });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            // Use Web Share API for direct sharing
            try {
                await navigator.share({
                    files: [file],
                    title: 'Book Catalog PDF',
                    text: 'Please find attached the Book Catalog PDF.',
                });
                showFlashMessage(`PDF shared successfully via ${method === 'whatsapp' ? 'WhatsApp' : 'Email'}!`, 'success');
            } catch (err) {
                console.error(`Error sharing via ${method}:`, err);
                showFlashMessage(`Failed to share PDF via ${method}. Using fallback method.`, 'warning');
                // Fallback to URL-based sharing
                const url = URL.createObjectURL(blob);
                if (method === 'whatsapp') {
                    const message = `Please find the Book Catalog PDF: ${url}`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                    showFlashMessage('WhatsApp opened with PDF link. Please share the PDF manually.', 'info');
                } else if (method === 'email') {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    const subject = 'Book Catalog PDF';
                    const body = `The Book Catalog PDF (${fileName}) has been downloaded to your device. Please attach it to this email and send.`;
                    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    window.location.href = emailUrl;
                    showFlashMessage('Email client opened. Please attach the downloaded PDF manually.', 'info');
                }
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            }
        } else {
            // Fallback for browsers without Web Share API
            const url = URL.createObjectURL(blob);
            if (method === 'whatsapp') {
                try {
                    const message = `Please find the Book Catalog PDF: ${url}`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                    showFlashMessage('WhatsApp opened with PDF link. Please download and share the PDF manually.', 'info');
                } catch (err) {
                    console.error('Error opening WhatsApp:', err);
                    showFlashMessage('Failed to open WhatsApp for sharing.', 'error');
                }
            } else if (method === 'email') {
                try {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    const subject = 'Book Catalog PDF';
                    const body = `The Book Catalog PDF (${fileName}) has been downloaded to your device. Please attach it to this email and send.`;
                    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    window.location.href = emailUrl;
                    showFlashMessage('Email client opened. Please attach the downloaded PDF manually.', 'info');
                } catch (err) {
                    console.error('Error opening email client:', err);
                    showFlashMessage('Failed to open email client for sharing. Please check your email client settings.', 'error');
                }
            }
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
        setLoading(false);
        setShowShareModal(false);
    };

    const downloadExcel = () => {
        const data = filteredBookCatalogs.map((book, index) => ({
            'S.No.': index + 1,
            'Book Name': book.bookName,
            'Publication': book.publication ? book.publication.name : 'N/A',
            'Subtitle': book.subtitle ? book.subtitle.name : 'N/A',
            'Language': book.language ? book.language.name : 'N/A',
            'Price': book.bookType === 'common_price'
                ? book.commonPrice
                : Object.entries(book.pricesByClass || {})
                    .map(([classId, price]) => `${getClassName(classId)}: ${price}`)
                    .join(', '),
            'ISBN': book.bookType === 'common_price'
                ? book.commonIsbn || 'N/A'
                : Object.entries(book.isbnByClass || {})
                    .filter(([classId, isbn]) => isbn)
                    .map(([classId, isbn]) => `${getClassName(classId)}: ${isbn}`)
                    .join(', '),
            'Discount': `${book.discountPercentage}%`,
            'Book Type': book.bookType === 'common_price' ? 'Common Price' : 'By Class',
            'Status': book.status,
            'Created At': formatDateWithTime(book.createdAt),
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Book Catalog');
        XLSX.writeFile(wb, `Book_Catalog_List_${new Date().toLocaleDateString('en-CA').replace(/\//g, '-')}.xlsx`);
        showFlashMessage('Book catalog list downloaded as Excel!', 'success');
    };

    return (
        <div className="book-catalog-management-container">
            <div ref={topRef}></div>
            <h2 className="main-section-title">Book Catalog Management</h2>

            {localError && (
                <p className="error-message text-center">
                    <FaTimesCircle className="error-icon" /> {localError}
                </p>
            )}

            <div className="main-content-layout">
                <div className="form-container-card">
                    <form onSubmit={handleSubmit} className="app-form">
                        <h3 className="form-title">{editingBookCatalogId ? 'Edit Book Catalog' : 'Add Book Catalog'}</h3>
                        <div className="form-group">
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
                                    <option value="">Select</option>
                                    {publications.length === 0 ? (
                                        <option value="" disabled>Loading Publications...</option>
                                    ) : (
                                        publications.map(pub => (
                                            <option key={pub._id} value={pub._id}>
                                                {pub.name}
                                            </option>
                                        ))
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
                                    <option value="">Select</option>
                                    {subtitles.length > 0 ? (
                                        subtitles.map(sub => (
                                            <option key={sub._id} value={sub._id}>
                                                {sub.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No subtitles found</option>
                                    )}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <div className="elective-language-toggle">
                                    <button
                                        type="button"
                                        className={`toggle-btn ${showLanguageField ? "active" : ""}`}
                                        onClick={() => {
                                            setShowLanguageField(prev => !prev);
                                            if (showLanguageField) {
                                                setFormData(prev => ({ ...prev, language: '' }));
                                            }
                                        }}
                                    >
                                        {showLanguageField ? "-Hide Language" : "+Add Language"}
                                    </button>
                                </div>
                                {showLanguageField && (
                                    <select
                                        id="language"
                                        name="language"
                                        value={formData.language}
                                        onChange={handleChange}
                                        disabled={loading || languages.length === 0}
                                        className="form-select mt-2"
                                    >
                                        <option value="">Select</option>
                                        {languages.map(lang => (
                                            <option key={lang._id} value={lang._id}>
                                                {lang.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
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
                            <div className="section-toggle-container">
                                <button
                                    type="button"
                                    className="toggle-section-btn"
                                    onClick={() => setShowPriceSection((prev) => !prev)}
                                >
                                    {showPriceSection ? "- Hide Prices & ISBNs" : "+ Add Prices & ISBNs"}
                                </button>
                            </div>
                        )}
                        {formData.bookType === 'default' && showPriceSection && (
                            <div
                                className="modal-backdrop"
                                onClick={(e) => {
                                    if (e.target === e.currentTarget) {
                                        setShowPriceSection(false);
                                    }
                                }}
                            >
                                <div className="modal-content">
                                    <button
                                        className="modal-close-btn"
                                        onClick={() => setShowPriceSection(false)}
                                    >
                                        ✕
                                    </button>
                                    <h4 className="sub-section-title">Prices & ISBNs by Class</h4>
                                    <div className="isbn-toggle-container">
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={showAllIsbn}
                                                onChange={() => setShowAllIsbn((prev) => !prev)}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                        <span className="toggle-label">
                                            {showAllIsbn ? "Hide ISBNs" : "Show ISBNs"}
                                        </span>
                                    </div>
                                    {classes.length === 0 ? (
                                        <p className="loading-state">Loading classes...</p>
                                    ) : (
                                        <div className="class-price-list">
                                            {classes.map((cls) => (
                                                <div key={cls._id} className="form-group class-row">
                                                    <span className="class-label">Class: {cls.name}</span>
                                                    <input
                                                        type="number"
                                                        id={`price_${cls._id}`}
                                                        name={`price_${cls._id}`}
                                                        value={formData.pricesByClass[cls._id] || ""}
                                                        onChange={handleChange}
                                                        min="0"
                                                        placeholder="Price"
                                                        className="form-input price-input"
                                                    />
                                                    {showAllIsbn && (
                                                        <input
                                                            type="text"
                                                            id={`isbn_${cls._id}`}
                                                            name={`isbn_${cls._id}`}
                                                            value={formData.isbnByClass[cls._id] || ""}
                                                            onChange={handleChange}
                                                            placeholder="ISBN"
                                                            className="form-input isbn-input"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="modal-actions">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => setShowPriceSection(false)}
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                    onClick={() => {
                                        setFormData({
                                            bookName: '',
                                            publication: '',
                                            subtitle: '',
                                            language: '',
                                            bookType: 'default',
                                            commonPrice: 0,
                                            pricesByClass: {},
                                            commonIsbn: '',
                                            isbnByClass: {},
                                            status: 'active',
                                        });
                                        setEditingBookCatalogId(null);
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
                <div className="table-section">
                    {loading && bookCatalogs.length === 0 ? (
                        <p className="loading-state text-center">
                            <FaSpinner className="animate-spin mr-2" /> Loading book catalogs...
                        </p>
                    ) : (
                        <div className="table-container">
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
                                <div className="filter-group">
                                    <label htmlFor="publicationFilter" className="mr-2"></label>
                                    <select
                                        id="publicationFilter"
                                        value={publicationFilter}
                                        onChange={(e) => {
                                            const selectedPublicationId = e.target.value;
                                            setPublicationFilter(selectedPublicationId);
                                            setCurrentPage(1);
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
                                            <option key={sub._id} value={sub._id}>{sub.name}</option>
                                        ))}
                                    </select>
                                    <label htmlFor="languageFilter" className="mr-2"></label>
                                    <select
                                        id="languageFilter"
                                        value={languageFilter}
                                        onChange={(e) => {
                                            setLanguageFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="form-select"
                                        disabled={loading || languages.length === 0}
                                    >
                                        <option value="all">All Languages</option>
                                        {languages.map((lang) => (
                                            <option key={lang._id} value={lang._id}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button onClick={downloadPdf} className="download-pdf-btn" disabled={loading || filteredBookCatalogs.length === 0}>
                                    <FaFilePdf className="btn-icon-mr" /> PDF
                                </button>
                                <button onClick={downloadExcel} className="download-excel-btn" disabled={loading || filteredBookCatalogs.length === 0}>
                                    <FaFileExcel className="btn-icon-mr" /> Excel
                                </button>
                                <button onClick={() => setShowShareModal(true)} className="share-btn" disabled={loading || filteredBookCatalogs.length === 0}>
                                    <FaEnvelope className="btn-icon-mr" /> Share
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
                                        <th>Language</th>
                                        <th>Book Type</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody ref={tableBodyRef}>
                                    {filteredBookCatalogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="text-center no-data-message">
                                                No book catalogs found matching your criteria. Start by adding one!
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedItems.map((book, index) => (
                                            <tr key={book._id} className={highlightedId === book._id ? "highlighted-row" : ""}>
                                                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                <td>{book.publication?.name || 'N/A'}</td>
                                                <td>{book.subtitle?.name || 'N/A'}</td>
                                                <td>{book.bookName}</td>
                                                <td className="price-cell">
                                                    {book.bookType === "common_price" ? (
                                                        `${book.commonPrice}`
                                                    ) : (
                                                        <div className="price-dropdown-container" ref={dropdownRef}>
                                                            <span
                                                                className="view-prices"
                                                                onClick={(e) => togglePriceDropdown(book._id, e)}
                                                            >
                                                                View Prices
                                                            </span>
                                                            {priceDropdownId === book._id && (
                                                                <div className="price-dropdown">
                                                                    <strong>
                                                                        <h5>Class: Price / ISBN</h5>
                                                                    </strong>
                                                                    <ul className="class-price-list">
                                                                        {classes.map((cls) => (
                                                                            <li key={cls._id}>
                                                                                <div className="class-price-item">
                                                                                    <strong>{cls.name}:</strong>{" "}
                                                                                    {book.pricesByClass?.[cls._id] || "N/A"}
                                                                                    {book.isbnByClass?.[cls._id] && (
                                                                                        <span> / {book.isbnByClass[cls._id]}</span>
                                                                                    )}
                                                                                </div>
                                                                                <hr />
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>{book.language?.name || 'General Book'}</td>
                                                <td>{book.bookType === 'common_price' ? 'Common Price' : 'By Class'}</td>
                                                <td>
                                                    <span className={`status-badge ${book.status}`}>{book.status}</span>
                                                </td>
                                                <td className="actions-column">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(book); }}
                                                        className="action-icon-button edit-button"
                                                        title="Edit"
                                                        disabled={loading}
                                                    >
                                                        <FaEdit className="icon" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(book); }}
                                                        className="action-icon-button delete-button"
                                                        title="Delete"
                                                        disabled={loading}
                                                    >
                                                        <FaTrashAlt className="icon" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            <div className="pagination-controls">
                                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} className="btn-page">
                                    <FaChevronLeft className="btn-icon-mr" /> Previous
                                </button>
                                <span>Page {Math.min(currentPage, Math.max(totalPages, 1))} of {Math.max(totalPages, 1)}</span>
                                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages || loading || filteredBookCatalogs.length === 0} className="btn-page">
                                    Next <FaChevronRight className="btn-icon-ml" />
                                </button>
                            </div>
                            <div className="total-records text-center mt-2">
                                Total Records: {filteredBookCatalogs.length}
                            </div>
                        </div>
                    )}
                </div>
            </div>

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

            {showShareModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Share Book Catalog PDF</h3>
                        <p>Choose a method to share the book catalog as a PDF:</p>
                        <div className="modal-actions">
                            <button
                                onClick={() => handleShare('whatsapp')}
                                className="btn btn-success"
                                disabled={loading}
                            >
                                <FaWhatsapp className="btn-icon-mr" /> Share via WhatsApp
                            </button>
                            <button
                                onClick={() => handleShare('email')}
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                <FaEnvelope className="btn-icon-mr" /> Share via Email
                            </button>
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="btn btn-secondary"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookCatalogManagement;