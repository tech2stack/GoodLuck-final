// src/components/masters/CreateSetManagement.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../../utils/api';
import { toast } from 'sonner';
import { FaPlusCircle, FaSearch, FaCopy, FaEdit, FaTrashAlt, FaSpinner, FaDownload, FaTimesCircle, FaCaretDown } from 'react-icons/fa';

// Stylesheets (ensure these paths are correct in your project)
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';
import '../../styles/CreateSetManagement.css';
import companyLogo from '../../assets/glbs-logo.jpg';

// Define special IDs for dropdown entries that are not actual database IDs
const STATIONERY_SUBTITLE_ID = 'STATIONERY_ITEMS_SPECIAL_ID';

export default function CreateSetManagement({ showFlashMessage }) {
    // --- State for Dropdown Data ---
    const [customers, setCustomers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subtitles, setSubtitles] = useState([]);
    const [bookCatalogs, setBookCatalogs] = useState([]);
    const [stationeryItemsMaster, setStationeryItemsMaster] = useState([]);
    const [existingSetsClasses, setExistingSetsClasses] = useState(new Set());
    const [stationeryCategories, setStationeryCategories] = useState([]);
    const [selectedStationeryCategories, setSelectedStationeryCategories] = useState(new Set());

    // --- State for Main Set Filters/Details ---
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [noOfSets, setNoOfSets] = useState(1);

    // --- State for Current Set Data (Books and Stationery) ---
    const [currentSetId, setCurrentSetId] = useState(null);
    const [booksDetail, setBooksDetail] = useState([]);
    const [stationeryDetail, setStationeryDetail] = useState([]);

    // --- State for Adding New Items ---
    const [selectedItemType, setSelectedItemType] = useState('books');
    const [selectedSubtitle, setSelectedSubtitle] = useState('');
    const [selectedItemToAdd, setSelectedItemToAdd] = useState('');
    const [itemQuantity, setItemQuantity] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [showAllBooksForSubtitle, setShowAllBooksForSubtitle] = useState(false);
    const [showAllStationery, setShowAllStationery] = useState(false);
    const [editingItemType, setEditingItemType] = useState(null);
    const [editingItemId, setEditingItemId] = useState(null);

    // --- State for Copying Sets ---
    const [copyToClass, setCopyToClass] = useState('');
    const [copyStationery, setCopyStationery] = useState(false);

    // --- Loading and Error States ---
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // --- State for Confirmation Modals ---
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showDeleteQuantityModal, setShowDeleteQuantityModal] = useState(false);
    const [quantityToDelete, setQuantityToDelete] = useState(null);

    // --- State for Download Dropdown ---
    const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
    const downloadDropdownRef = useRef(null);

    // --- State for Set Quantity Management ---
    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [setQuantities, setSetQuantities] = useState([]);
    const [editedQuantities, setEditedQuantities] = useState({});

    // --- Calculated Totals ---
    const totalAmount = booksDetail.reduce((sum, item) => sum + (item.quantity * item.price), 0) +
        stationeryDetail.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalItems = booksDetail.length + stationeryDetail.length;
    const totalQuantity = booksDetail.reduce((sum, item) => sum + item.quantity, 0) +
        stationeryDetail.reduce((sum, item) => sum + item.quantity, 0);

    // --- Helper Functions ---
    const getStringValue = (field) => field ? String(field).trim() : 'N/A';

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

    // --- Fetch Dropdown Data ---
    const fetchDropdownData = useCallback(async () => {
        setLoading(true);
        try {
            const [customersRes, classesRes, publicationsRes, stationeryRes, allSetsRes] = await Promise.all([
                api.get('/sets/dropdowns/customers'),
                api.get('/sets/dropdowns/classes'),
                api.get('/publications'),
                api.get('/sets/dropdowns/stationery-items'),
                api.get('/sets/all')
            ]);

            const validCustomers = (customersRes.data.data.customers || []).filter(c => c && c._id && String(c.customerName || '').trim() !== '');
            const validClasses = (classesRes.data.data.classes || []).filter(c => c && c._id && String(c.name || '').trim() !== '');
            const validStationeryItems = (stationeryRes.data.data.stationeryItems || []).filter(i => i && i._id);

            setCustomers(validCustomers);
            setClasses(validClasses);
            setStationeryItemsMaster(validStationeryItems);

            const uniqueCategories = [...new Set(validStationeryItems.map(item => item.category))].filter(Boolean);
            setStationeryCategories(uniqueCategories);
            setSelectedStationeryCategories(new Set(uniqueCategories));

            const allPublications = publicationsRes.data.data.publications || [];
            const allSubtitles = [
                ...allPublications.flatMap(pub => (pub.subtitles || []).map(sub => ({
                    _id: sub._id,
                    name: `${pub.name} - ${sub.name}`
                }))),
            ];
            setSubtitles(allSubtitles);

            if (allSetsRes.data.status === 'success') {
                const classesWithSets = new Set(allSetsRes.data.data.sets.map(set => set.class));
                setExistingSetsClasses(classesWithSets);
            }
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
            showFlashMessage(err.response?.data?.message || 'Network error fetching dropdown data.', 'error');
            setLocalError('Failed to load initial data for dropdowns.');
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]);

    // --- Reset Form ---
    const resetForm = useCallback(() => {
        setCurrentSetId(null);
        setBooksDetail([]);
        setStationeryDetail([]);
        setSelectedItemType('books');
        setSelectedSubtitle('');
        setSelectedItemToAdd('');
        setItemQuantity('');
        setItemPrice('');
        setLocalError(null);
        setIsEditMode(false);
        setNoOfSets(1);
        setCopyToClass('');
        setCopyStationery(false);
        setEditingItemType(null);
        setEditingItemId(null);
        setShowAllBooksForSubtitle(false);
        setShowAllStationery(false);
        setSelectedStationeryCategories(new Set());
        setShowConfirmModal(false);
        setItemToDelete(null);
        setShowQuantityModal(false);
        setSetQuantities([]);
        setEditedQuantities({});
        setShowDeleteQuantityModal(false);
        setQuantityToDelete(null);
        fetchDropdownData();
    }, [fetchDropdownData]);

    // --- Fetch Book Catalogs by Subtitle ---
    const fetchBookCatalogsBySubtitle = useCallback(async () => {
        if (!selectedSubtitle) {
            setBookCatalogs([]);
            setSelectedItemToAdd('');
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/sets/dropdowns/book-catalogs?subtitleId=${selectedSubtitle}`);
            const validBookCatalogs = (response.data.data.bookCatalogs || []).filter(b => b && b._id);
            setBookCatalogs(validBookCatalogs);
        } catch (err) {
            console.error('Error fetching book catalogs by subtitle:', err);
            showFlashMessage(err.response?.data?.message || 'Failed to load books for selected subtitle.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedSubtitle, showFlashMessage]);

    // --- Convert Fetched Data to Local Format ---
    const fetchedToLocalFormat = useCallback((items, type) => {
        return (items || []).map(item => {
            if (type === 'book') {
                let subtitleName = '';
                if (item.book.subtitle && typeof item.book.subtitle === 'object' && item.book.subtitle.name) {
                    subtitleName = item.book.subtitle.name;
                } else if (item.book.subtitle && typeof item.book.subtitle === 'string') {
                    const foundSub = subtitles.find(s => s._id === item.book.subtitle);
                    subtitleName = foundSub ? foundSub.name : `ID: ${item.book.subtitle}`;
                }

                return {
                    book: {
                        _id: item.book?._id || '',
                        bookName: item.book?.bookName || 'Unnamed Book',
                        subtitle: subtitleName
                    },
                    quantity: item.quantity,
                    price: item.price || 0,
                    status: item.status
                };
            } else {
                return {
                    item: {
                        _id: item.item?._id || '',
                        itemName: item.item?.itemName || 'Unnamed Stationery Item'
                    },
                    quantity: item.quantity,
                    price: item.price || 0,
                    status: item.status
                };
            }
        });
    }, [subtitles]);

    // --- Fetch Set Details ---

    // --- Fetch Set Quantities ---
    const fetchSetQuantities = useCallback(async () => {
        if (!selectedCustomer) {
            setSetQuantities([]);
            setEditedQuantities({});
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/sets/set-quantities/${selectedCustomer}`);
            if (response.data.status === 'success') {
                const fetchedQuantities = response.data.data.setQuantities || [];
                setSetQuantities(fetchedQuantities);

                // Initialize editedQuantities with all classes
                const initialQuantities = {};
                classes.forEach(cls => {
                    const existingQuantity = fetchedQuantities.find(sq => sq.classId === cls._id);
                    initialQuantities[cls._id] = existingQuantity ? String(existingQuantity.quantity) : '';
                });
                setEditedQuantities(initialQuantities);

                // Update noOfSets if selectedClass has a quantity
                if (selectedClass) {
                    const classQuantity = fetchedQuantities.find(sq => sq.classId === selectedClass);
                    setNoOfSets(classQuantity ? String(classQuantity.quantity) : '1');
                }

                showFlashMessage('Set quantities fetched successfully!', 'success');
            } else {
                throw new Error(response.data.message || 'Failed to fetch set quantities.');
            }
        } catch (err) {
            console.error('Error fetching set quantities:', err);
            showFlashMessage(err.response?.data?.message || 'Failed to fetch set quantities.', 'error');

            // Initialize editedQuantities with all classes set to empty
            const initialQuantities = {};
            classes.forEach(cls => {
                initialQuantities[cls._id] = '';
            });
            setEditedQuantities(initialQuantities);
            setSetQuantities([]);
            if (selectedClass) {
                setNoOfSets('1'); // Reset to default
            }
        } finally {
            setLoading(false);
        }
    }, [selectedCustomer, selectedClass, classes, showFlashMessage]);

    const fetchSetDetails = useCallback(async () => {
        if (!selectedCustomer || !selectedClass) {
            resetForm();
            showFlashMessage('Please select School Name and Class to show info.', 'warning');
            return;
        }

        setLoading(true);
        setLocalError(null);
        try {
            const queryParams = new URLSearchParams({
                customerId: selectedCustomer,
                classId: selectedClass
            });

            const response = await api.get(`/sets?${queryParams.toString()}`);

            if (response.data.status === 'success' && response.data.data.set) {
                const fetchedSet = response.data.data.set;
                setCurrentSetId(fetchedSet._id);
                setBooksDetail(fetchedToLocalFormat(fetchedSet.books, 'book'));
                setStationeryDetail(fetchedToLocalFormat(fetchedSet.stationeryItems, 'item'));
                setIsEditMode(true);
                showFlashMessage('Existing set loaded successfully!', 'success');
            } else {
                setCurrentSetId(null);
                setBooksDetail([]);
                setStationeryDetail([]);
                setIsEditMode(false);
                showFlashMessage('No existing set found for the selected criteria. You can create a new one.', 'info');
            }

            // Fetch quantities separately to ensure noOfSets is updated
            await fetchSetQuantities();
        } catch (err) {
            console.error('Error fetching set details:', err);
            const errorMessage = err.response?.data?.message || 'Failed to fetch set details due to network error.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
            setCurrentSetId(null);
            setBooksDetail([]);
            setStationeryDetail([]);
            setIsEditMode(false);
            setNoOfSets('1');
            await fetchSetQuantities(); // Still attempt to fetch quantities
        } finally {
            setLoading(false);
        }
    }, [selectedCustomer, selectedClass, showFlashMessage, resetForm, fetchedToLocalFormat, fetchSetQuantities]);


    const handleQuantityChange = (classId, value) => {
        const quantity = value === '' ? '' : Math.max(0, parseInt(value) || 0);
        setEditedQuantities(prev => ({
            ...prev,
            [classId]: quantity
        }));
        if (classId === selectedClass) {
            setNoOfSets(quantity === '' ? '1' : String(quantity));
        }
    };
    // --- Handle Edit Quantity ---
    const handleEditQuantity = (classId, className) => {
        showFlashMessage(`Editing quantity for class ${className}.`, 'info');
        const input = document.querySelector(`input[value="${editedQuantities[classId] ?? ''}"]`);
        if (input) input.focus();
    };

    // --- Handle Delete Quantity ---
    const handleDeleteQuantity = (classId, className) => {
        setQuantityToDelete({ classId, className });
        setShowDeleteQuantityModal(true);
    };

    // --- Confirm Delete Quantity ---
  // --- Confirm Delete Quantity ---
const confirmDeleteQuantity = async () => {
    if (!quantityToDelete || !selectedCustomer) {
        showFlashMessage('Error: No class selected for deletion or customer not selected.', 'error');
        setShowDeleteQuantityModal(false);
        setQuantityToDelete(null);
        return;
    }

    const { classId, className } = quantityToDelete;

    // Debug: Log the IDs to verify correctness
    console.log('Attempting to delete quantity for:', {
        customerId: selectedCustomer,
        classId,
        className
    });

    setLoading(true);
    try {
        // Optional: Verify the quantity exists before deleting
        const checkResponse = await api.get(`/sets/set-quantities/${selectedCustomer}`);
        const quantityExists = checkResponse.data.status === 'success' &&
            checkResponse.data.data.setQuantities.some(q => q.classId === classId);

        if (!quantityExists) {
            showFlashMessage(`No quantity found for class ${className}. It may have already been deleted.`, 'warning');
            setShowDeleteQuantityModal(false);
            setQuantityToDelete(null);
            await fetchSetQuantities();
            return;
        }

        const response = await api.delete(`/sets/set-quantities/${selectedCustomer}/${classId}`);
        if (response.status === 204 || response.data.status === 'success') {
            showFlashMessage(`Quantity for class ${className} deleted successfully!`, 'success');
            await fetchSetQuantities();
        } else {
            throw new Error(response.data.message || 'Failed to delete set quantity.');
        }
    } catch (err) {
        console.error('Error deleting set quantity:', err);
        let errorMessage = 'Failed to delete set quantity.';
        if (err.response) {
            if (err.response.status === 404) {
                errorMessage = `Set quantity for class ${className} not found on the server. It may have been deleted already.`;
            } else {
                errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
            }
        } else if (err.request) {
            errorMessage = 'No response from server. Please check your network connection.';
        } else {
            errorMessage = err.message || 'An unexpected error occurred.';
        }
        showFlashMessage(errorMessage, 'error');
    } finally {
        setLoading(false);
        setShowDeleteQuantityModal(false);
        setQuantityToDelete(null);
    }
};

    // --- Save Set Quantities ---
    const saveSetQuantities = useCallback(async () => {
        if (!selectedCustomer) {
            showFlashMessage('Please select a customer to manage quantities.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const classQuantities = Object.entries(editedQuantities)
                .filter(([_, quantity]) => quantity !== '' && quantity >= 0)
                .map(([classId, quantity]) => ({
                    classId,
                    quantity: parseInt(quantity) || 0
                }));

            if (classQuantities.length === 0) {
                showFlashMessage('No valid quantities to save.', 'warning');
                setLoading(false);
                return;
            }

            await api.post(`/sets/set-quantities/${selectedCustomer}`, { classQuantities });
            showFlashMessage('Set quantities updated successfully!', 'success');
            setShowQuantityModal(false);
            await fetchSetQuantities(); // Refresh quantities after saving
        } catch (err) {
            console.error('Error saving set quantities:', err);
            showFlashMessage(err.response?.data?.message || 'Failed to save set quantities.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedCustomer, editedQuantities, showFlashMessage, fetchSetQuantities]);
    // --- Effects ---
    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    useEffect(() => {
        if (selectedItemType === 'books') {
            fetchBookCatalogsBySubtitle();
        }
    }, [fetchBookCatalogsBySubtitle, selectedItemType]);

    useEffect(() => {
        if (selectedItemToAdd) {
            if (selectedItemType === 'stationery') {
                const itemInfo = stationeryItemsMaster.find(item => item._id === selectedItemToAdd);
                if (itemInfo) {
                    if (!(editingItemType === 'stationery' && editingItemId === selectedItemToAdd)) {
                        setItemQuantity('1');
                        setItemPrice(String(itemInfo.price || ''));
                    }
                } else {
                    setItemQuantity('');
                    setItemPrice('');
                }
            } else if (selectedItemType === 'books') {
                const bookInfo = bookCatalogs.find(book => book._id === selectedItemToAdd);
                if (bookInfo) {
                    if (!(editingItemType === 'book' && editingItemId === selectedItemToAdd)) {
                        setItemQuantity('1');
                        setItemPrice(String(bookInfo.commonPrice || ''));
                    }
                } else {
                    setItemQuantity('');
                    setItemPrice('');
                }
            }
        } else {
            setItemQuantity('');
            setItemPrice('');
        }
    }, [selectedItemType, selectedItemToAdd, stationeryItemsMaster, bookCatalogs, editingItemType, editingItemId]);

    // --- Handlers for Adding/Updating Items ---
    const handleAddOrUpdateItem = () => {
        if (!selectedItemToAdd || itemQuantity === '' || itemPrice === '') {
            showFlashMessage('Please select an item, quantity, and price.', 'error');
            return;
        }
        const qty = Number(itemQuantity);
        const price = Number(itemPrice);
        if (isNaN(qty) || qty < 1 || isNaN(price) || price < 0) {
            showFlashMessage('Please enter valid numbers for quantity and price (min 1 for qty, min 0 for price).', 'error');
            return;
        }

        if (selectedItemType === 'stationery') {
            const itemInfo = stationeryItemsMaster.find(item => item._id === selectedItemToAdd);
            if (!itemInfo) {
                showFlashMessage('Selected stationery item not found.', 'error');
                return;
            }

            if (editingItemType === 'stationery' && editingItemId) {
                setStationeryDetail(prev => prev.map(item =>
                    item.item._id === editingItemId ? { ...item, quantity: qty, price: price } : item
                ));
                showFlashMessage('Stationery item successfully updated.', 'success');
            } else {
                const existingItemIndex = stationeryDetail.findIndex(item => item.item._id === selectedItemToAdd);
                if (existingItemIndex > -1) {
                    setStationeryDetail(prev => {
                        const updatedItems = [...prev];
                        updatedItems[existingItemIndex] = {
                            ...updatedItems[existingItemIndex],
                            quantity: qty,
                            price: price
                        };
                        return updatedItems;
                    });
                    showFlashMessage('Stationery item quantity/price updated in list.', 'info');
                } else {
                    setStationeryDetail(prev => [
                        ...prev,
                        {
                            item: { _id: selectedItemToAdd, itemName: itemInfo.itemName || 'Unnamed Stationery Item' },
                            quantity: qty,
                            price: price,
                            status: 'pending'
                        }
                    ]);
                    showFlashMessage('Stationery item added to list.', 'success');
                }
            }
        } else {
            const bookInfo = bookCatalogs.find(book => book._id === selectedItemToAdd);
            if (!bookInfo) {
                showFlashMessage('Selected book not found in catalog.', 'error');
                return;
            }
            const subtitleName = subtitles.find(s => s._id === selectedSubtitle)?.name || '';

            if (editingItemType === 'book' && editingItemId) {
                setBooksDetail(prev => prev.map(item =>
                    item.book._id === editingItemId ? { ...item, quantity: qty, price: price, book: { ...item.book, subtitle: subtitleName } } : item
                ));
                showFlashMessage('Book successfully updated.', 'success');
            } else {
                const existingBookIndex = booksDetail.findIndex(item => item.book._id === selectedItemToAdd);
                if (existingBookIndex > -1) {
                    setBooksDetail(prev => {
                        const updatedBooks = [...prev];
                        updatedBooks[existingBookIndex] = {
                            ...updatedBooks[existingBookIndex],
                            quantity: qty,
                            price: price
                        };
                        return updatedBooks;
                    });
                    showFlashMessage('Book quantity/price updated in list.', 'info');
                } else {
                    setBooksDetail(prev => [
                        ...prev,
                        {
                            book: { _id: selectedItemToAdd, bookName: bookInfo.bookName || 'Unnamed Book', subtitle: subtitleName },
                            quantity: qty,
                            price: price,
                            status: 'pending'
                        }
                    ]);
                    showFlashMessage('Book added to list.', 'success');
                }
            }
        }

        setSelectedSubtitle('');
        setSelectedItemToAdd('');
        setItemQuantity('');
        setItemPrice('');
        setEditingItemType(null);
        setEditingItemId(null);
        setShowAllBooksForSubtitle(false);
        setShowAllStationery(false);
        setSelectedStationeryCategories(new Set(stationeryCategories));
    };

    // --- Handlers for Deleting Items ---
    const handleDeleteBook = (bookId, bookName) => {
        if (!currentSetId) {
            setBooksDetail(prev => prev.filter(item => item.book._id !== bookId));
            showFlashMessage('Book removed from list (not yet saved to DB).', 'info');
            return;
        }
        setItemToDelete({ id: bookId, type: 'book', name: bookName });
        setShowConfirmModal(true);
    };

    const handleDeleteStationery = (itemId, itemName) => {
        if (!currentSetId) {
            setStationeryDetail(prev => prev.filter(item => item.item._id !== itemId));
            showFlashMessage('Stationery item removed from list (not yet saved to DB).', 'info');
            return;
        }
        setItemToDelete({ id: itemId, type: 'stationery', name: itemName });
        setShowConfirmModal(true);
    };

    // --- Confirm Deletion ---
    const confirmDeletion = async () => {
        if (!itemToDelete || !currentSetId) {
            showFlashMessage('Error: No item selected for deletion or set not loaded.', 'error');
            setShowConfirmModal(false);
            setItemToDelete(null);
            return;
        }

        setLoading(true);
        setLocalError(null);
        try {
            const { id, type } = itemToDelete;
            const response = await api.patch(`/sets/${currentSetId}/removeItem`, {
                itemId: id,
                itemType: type
            });

            if (response.data.status === 'success') {
                let updatedBooks = [...booksDetail];
                let updatedStationery = [...stationeryDetail];

                if (type === 'book') {
                    updatedBooks = updatedBooks.filter(item => item.book._id !== id);
                    setBooksDetail(updatedBooks);
                } else {
                    updatedStationery = updatedStationery.filter(item => item.item._id !== id);
                    setStationeryDetail(updatedStationery);
                }
                showFlashMessage(`${itemToDelete.name} successfully removed from set!`, 'success');

                if (updatedBooks.length === 0 && updatedStationery.length === 0) {
                    handleDeleteSet(currentSetId);
                }
            } else {
                throw new Error(response.data.message || `Failed to remove ${type} from set.`);
            }
        } catch (err) {
            console.error(`Error deleting ${itemToDelete.name} from set:`, err);
            const errorMessage = err.response?.data?.message || `Failed to remove ${itemToDelete.name} from set due to network error.`;
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
            setShowConfirmModal(false);
            setItemToDelete(null);
        }
    };

    const cancelDeletion = () => {
        setShowConfirmModal(false);
        setItemToDelete(null);
        showFlashMessage('Deletion cancelled.', 'info');
    };

    // --- Handlers for Editing Items ---
    const handleEditBook = (bookItem) => {
        const foundSubtitle = subtitles.find(s => s.name === bookItem.book.subtitle);
        const subtitleIdToSet = foundSubtitle ? foundSubtitle._id : '';

        setSelectedItemType('books');
        setSelectedSubtitle(subtitleIdToSet);
        setSelectedItemToAdd(bookItem.book._id);
        setItemQuantity(String(bookItem.quantity));
        setItemPrice(String(bookItem.price));
        setEditingItemType('book');
        setEditingItemId(bookItem.book._id);
        setShowAllBooksForSubtitle(true);
        showFlashMessage('Book loaded for editing.', 'info');
    };

    const handleEditStationery = (stationeryItem) => {
        setSelectedItemType('stationery');
        setSelectedSubtitle('');
        setSelectedItemToAdd(stationeryItem.item._id);
        setItemQuantity(String(stationeryItem.quantity));
        setItemPrice(String(stationeryItem.price));
        setEditingItemType('stationery');
        setEditingItemId(stationeryItem.item._id);
        setShowAllBooksForSubtitle(false);
        setShowAllStationery(true);
        setSelectedStationeryCategories(new Set(stationeryCategories));
        showFlashMessage('Stationery item loaded for editing.', 'info');
    };

    // --- Handle Delete Set ---
    const handleDeleteSet = async (setId) => {
        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.delete(`/sets/${setId}`);
            if (response.status === 204) {
                showFlashMessage(`Set successfully deleted!`, 'success');
                resetForm();
            } else {
                throw new Error(response.data?.message || 'Failed to delete set.');
            }
        } catch (err) {
            console.error('Error deleting set:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete set due to network error.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Save/Update Set ---
    const handleSaveSet = async () => {
        if (!selectedCustomer || !selectedClass) {
            showFlashMessage('Please select School Name and Class.', 'error');
            return;
        }

        if (booksDetail.length === 0 && stationeryDetail.length === 0) {
            if (isEditMode && currentSetId) {
                handleDeleteSet(currentSetId);
                return;
            } else {
                showFlashMessage('Cannot save an empty set. Please add items.', 'error');
                resetForm();
                return;
            }
        }

        setLoading(true);
        setLocalError(null);

        const payload = {
            customer: selectedCustomer,
            class: selectedClass,
            books: booksDetail.map(item => ({
                book: item.book._id,
                quantity: item.quantity,
                price: item.price,
                status: item.status
            })),
            stationeryItems: stationeryDetail.map(item => ({
                item: item.item._id,
                quantity: item.quantity,
                price: item.price,
                status: item.status
            }))
        };

        try {
            let response;
            if (isEditMode && currentSetId) {
                response = await api.patch(`/sets/${currentSetId}`, payload);
            } else {
                response = await api.post(`/sets`, payload);
            }

            if (response.data.status === 'success') {
                showFlashMessage(response.data.message, 'success');
                setCurrentSetId(response.data.data.set._id);
                setIsEditMode(true);
                await saveSetQuantities();
                fetchSetDetails();
            } else {
                throw new Error(response.data.message || 'Failed to save set.');
            }
        } catch (err) {
            console.error('Error saving set:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save set due to network error.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Handle Copy Set ---
    const handleCopySet = async () => {
        if (!currentSetId) {
            showFlashMessage('Please load an existing set to copy from.', 'error');
            return;
        }
        if (!copyToClass || !selectedCustomer) {
            showFlashMessage('Please select a target class for copying, and ensure School Name is selected.', 'error');
            return;
        }
        if (existingSetsClasses.has(copyToClass)) {
            showFlashMessage('A set already exists for the target class. Please select a different class or update the existing set.', 'error');
            return;
        }

        setLoading(true);
        setLocalError(null);

        const copyPayload = {
            sourceSetId: currentSetId,
            targetCustomerId: selectedCustomer,
            targetClassId: copyToClass,
            copyStationery: copyStationery
        };

        try {
            const response = await api.post(`/sets/copy`, copyPayload);

            if (response.data.status === 'success') {
                showFlashMessage(response.data.message, 'success');
                resetForm();
            } else {
                throw new Error(response.data.message || 'Failed to copy set.');
            }
        } catch (err) {
            console.error('Error copying set:', err);
            const errorMessage = err.response?.data?.message || 'Failed to copy set due to network error.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Handle Download ---
    const handleDownload = (type) => {
        setShowDownloadDropdown(false);

        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            showFlashMessage('PDF generation libraries not fully loaded or accessible. Check console for details.', 'error');
            console.error("PDF generation failed: window.jspdf or window.jspdf.jsPDF is not available/callable.");
            return;
        }

        const doc = new window.jspdf.jsPDF('portrait', 'mm', 'a4');

        if (typeof doc.autoTable !== 'function') {
            showFlashMessage('PDF Table plugin (jspdf-autotable) not loaded or accessible.', 'error');
            console.error("PDF generation failed: doc.autoTable is not a function.");
            return;
        }

        const customerName = customers.find(c => c._id === selectedCustomer)?.customerName || 'Unknown School';
        const className = classes.find(c => c._id === selectedClass)?.name || 'Unknown Class';
        let finalFilename = "";
        let finalTitle = "";

        const companyName = "GOOD LUCK BOOK STORE";
        const companyAddress = "Shop NO. 2, Shriji Tower, Ashoka Garden, Bhopal";
        const companyMobile = "Mobile Number: 7024136476";
        const companyGST = "GST NO: 23EAVPP3772F1Z8";

        const addHeaderAndSetStartY = (docInstance, reportTitle, img, imgWidth, imgHeight) => {
            const marginX = 14;
            const marginY = 10;
            const textOffsetFromLogo = 5;

            if (img) {
                docInstance.addImage(img, 'JPEG', marginX, marginY, imgWidth, imgHeight);
            }

            docInstance.setFontSize(10);
            docInstance.setFont('helvetica', 'normal');
            docInstance.setTextColor(100, 100, 100);
            docInstance.text(`Date: ${formatDateWithTime(new Date())}`, docInstance.internal.pageSize.width - marginX, marginY + 10, { align: 'right' });

            docInstance.setFontSize(12);
            docInstance.setFont('helvetica', 'bold');
            docInstance.setTextColor(30, 30, 30);
            const companyTextStartX = img ? (marginX + imgWidth + textOffsetFromLogo) : marginX;
            let currentCompanyTextY = marginY + textOffsetFromLogo;

            docInstance.text(companyName, companyTextStartX, currentCompanyTextY);
            docInstance.setFontSize(9);
            docInstance.setFont('helvetica', 'normal');
            docInstance.setTextColor(50, 50, 50);
            currentCompanyTextY += 7;
            docInstance.text(companyAddress, companyTextStartX, currentCompanyTextY);
            currentCompanyTextY += 5;
            docInstance.text(companyMobile, companyTextStartX, currentCompanyTextY);
            currentCompanyTextY += 5;
            docInstance.text(companyGST, companyTextStartX, currentCompanyTextY);

            const maxHeaderY = Math.max(img ? (marginY + imgHeight) : marginY, currentCompanyTextY);

            docInstance.setFontSize(18);
            docInstance.setFont('helvetica', 'bold');
            docInstance.setTextColor(30, 30, 30);
            const reportTitleY = maxHeaderY + 10;
            docInstance.text(reportTitle, docInstance.internal.pageSize.width / 2, reportTitleY, { align: 'center' });

            docInstance.setLineWidth(0.5);
            docInstance.line(marginX, reportTitleY + 5, docInstance.internal.pageSize.width - marginX, reportTitleY + 5);

            return reportTitleY + 10;
        };

        const addTableToDoc = (docInstance, title, columns, rows, startY) => {
            docInstance.setFontSize(14);
            docInstance.setFont('helvetica', 'bold');
            docInstance.setTextColor(30, 30, 30);
            docInstance.text(title, 14, startY);

            docInstance.autoTable({
                head: [columns],
                body: rows,
                startY: startY + 5,
                theme: 'striped',
                styles: {
                    font: 'helvetica',
                    fontSize: 8,
                    cellPadding: 2,
                    textColor: [0, 0, 0],
                    valign: 'middle',
                    halign: 'left'
                },
                headStyles: {
                    fillColor: [37, 99, 235],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    lineWidth: 0.1,
                    lineColor: [200, 200, 200]
                },
                bodyStyles: {
                    lineWidth: 0.1,
                    lineColor: [200, 200, 200]
                },
                didParseCell: function (data) {
                    if (data.section === 'body') {
                        if (data.row.index % 2 === 0) {
                            data.cell.styles.fillColor = [240, 248, 255];
                        } else {
                            data.cell.styles.fillColor = [255, 255, 255];
                        }
                    }
                },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'right' },
                    5: { halign: 'right' }
                },
                margin: { top: 10, right: 14, bottom: 10, left: 14 },
                didDrawPage: function (data) {
                    let str = "Page " + docInstance.internal.getNumberOfPages();
                    docInstance.setFontSize(8);
                    docInstance.text(str, data.settings.margin.left, docInstance.internal.pageSize.height - 10);
                }
            });
            return docInstance.autoTable.previous.finalY + 10;
        };

        const generateBooksData = () => {
            let totalQty = 0;
            let totalAmt = 0;
            const tableColumn = ["S.No.", "Sub Title", "Book", "QTY", "Price", "Total"];
            const tableRows = [];
            booksDetail.forEach((item, index) => {
                const itemTotal = item.quantity * item.price;
                totalQty += item.quantity;
                totalAmt += itemTotal;
                tableRows.push([
                    index + 1,
                    getStringValue(item.book.subtitle),
                    getStringValue(item.book.bookName),
                    item.quantity,
                    `Rs.${item.price.toFixed(2)}`,
                    `Rs.${itemTotal.toFixed(2)}`
                ]);
            });
            tableRows.push([
                "", "", "Total QTY/Amount",
                totalQty,
                "",
                `Rs.${totalAmt.toFixed(2)}`
            ]);
            return { columns: tableColumn, rows: tableRows };
        };

        const generateStationeryData = () => {
            let totalQty = 0;
            let totalAmt = 0;
            const tableColumn = ["S.No.", "Item", "QTY", "Price", "Total"];
            const tableRows = [];
            stationeryDetail.forEach((item, index) => {
                const itemTotal = item.quantity * item.price;
                totalQty += item.quantity;
                totalAmt += itemTotal;
                tableRows.push([
                    index + 1,
                    getStringValue(item.item.itemName),
                    item.quantity,
                    `Rs.${item.price.toFixed(2)}`,
                    `Rs.${itemTotal.toFixed(2)}`
                ]);
            });
            tableRows.push([
                "", "Total QTY/Amount",
                totalQty,
                "",
                `Rs.${totalAmt.toFixed(2)}`
            ]);
            return { columns: tableColumn, rows: tableRows };
        };

        const generatePdfContent = (docInstance, img, imgWidth, imgHeight) => {
            let currentY;

            if (type === 'books' || type === 'both') {
                if (booksDetail.length > 0) {
                    finalTitle = `${customerName} - ${className} Class`;
                    currentY = addHeaderAndSetStartY(docInstance, finalTitle, img, imgWidth, imgHeight);
                    const { columns, rows } = generateBooksData();
                    currentY = addTableToDoc(docInstance, "Books Detail", columns, rows, currentY);
                } else if (type === 'books') {
                    showFlashMessage('No books to download.', 'warning');
                    return;
                }
            }

            if (type === 'stationery' || type === 'both') {
                if (stationeryDetail.length > 0) {
                    if (type === 'stationery') {
                        finalTitle = `Stationery Item Detail for ${customerName} - ${className}`;
                        currentY = addHeaderAndSetStartY(docInstance, finalTitle, img, imgWidth, imgHeight);
                    } else {
                        if (booksDetail.length > 0 && currentY > (docInstance.internal.pageSize.height - 50)) {
                            docInstance.addPage();
                            currentY = addHeaderAndSetStartY(docInstance, `Stationery Item Detail for ${customerName} - ${className}`, img, imgWidth, imgHeight);
                        } else if (booksDetail.length === 0) {
                            currentY = addHeaderAndSetStartY(docInstance, `Stationery Item Detail for ${customerName} - ${className}`, img, imgWidth, imgHeight);
                        }
                    }
                    const { columns, rows } = generateStationeryData();
                    addTableToDoc(docInstance, "Stationery Item Detail", columns, rows, currentY);
                } else if (type === 'stationery') {
                    showFlashMessage('No stationery items to download.', 'warning');
                    return;
                }
            }

            if (type === 'both') {
                if (booksDetail.length === 0 && stationeryDetail.length === 0) {
                    showFlashMessage('No books or stationery items to download.', 'warning');
                    return;
                }
                finalFilename = `Complete_Set_Detail_${customerName.replace(/\s/g, '_')}_${className.replace(/\s/g, '_')}.pdf`;
            } else if (type === 'books') {
                finalFilename = `Books_Detail_${customerName.replace(/\s/g, '_')}_${className.replace(/\s/g, '_')}.pdf`;
            } else if (type === 'stationery') {
                finalFilename = `Stationery_Detail_${customerName.replace(/\s/g, '_')}_${className.replace(/\s/g, '_')}.pdf`;
            }

            docInstance.save(finalFilename);
            showFlashMessage(`${finalTitle} downloaded as PDF!`, 'success');
        };

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const logoX = 14;
            const logoY = 10;
            const imgWidth = 25;
            const imgHeight = (img.height * imgWidth) / img.width;

            generatePdfContent(doc, img, imgWidth, imgHeight);
        };

        img.onerror = () => {
            console.warn("Logo image could not be loaded. Generating PDF without logo.");
            generatePdfContent(doc, null, 0, 0);
        };

        img.src = companyLogo;
    };

    // --- Memoized Item Dropdown Options ---
    const itemDropdownOptions = useMemo(() => {
        if (selectedItemType === 'stationery') {
            if (showAllStationery) {
                return stationeryItemsMaster;
            } else if (selectedStationeryCategories.size > 0) {
                return stationeryItemsMaster.filter(item => selectedStationeryCategories.has(item.category));
            } else {
                return [];
            }
        } else if (selectedItemType === 'books' && selectedSubtitle) {
            if (isEditMode && !showAllBooksForSubtitle) {
                const selectedSubtitleObj = subtitles.find(s => s._id === selectedSubtitle);
                const selectedSubtitleName = selectedSubtitleObj ? selectedSubtitleObj.name : null;

                if (!selectedSubtitleName) {
                    return [];
                }

                const booksInCurrentSetForSubtitle = (booksDetail || []).filter(item =>
                    item.book.subtitle === selectedSubtitleName
                ).map(item => ({
                    _id: item.book._id,
                    bookName: item.book.bookName,
                    price: item.book.price
                }));

                if (editingItemType === 'book' && editingItemId) {
                    const currentBookBeingEdited = (bookCatalogs || []).find(book => book._id === editingItemId);
                    if (currentBookBeingEdited && !booksInCurrentSetForSubtitle.some(b => b._id === currentBookBeingEdited._id)) {
                        booksInCurrentSetForSubtitle.push({
                            _id: currentBookBeingEdited._id,
                            bookName: currentBookBeingEdited.bookName,
                            price: currentBookBeingEdited.commonPrice || currentBookBeingEdited.price
                        });
                    }
                }
                return booksInCurrentSetForSubtitle;
            } else {
                return bookCatalogs.map(book => ({
                    ...book,
                    price: book.commonPrice
                }));
            }
        }
        return [];
    }, [selectedItemType, selectedSubtitle, isEditMode, showAllBooksForSubtitle, showAllStationery, selectedStationeryCategories, stationeryItemsMaster, booksDetail, bookCatalogs, subtitles, editingItemType, editingItemId]);

    // --- UI States ---
    const isFormDisabled = !selectedCustomer;
    const isAddItemFormDisabled = !selectedCustomer;
    const isAddItemButtonDisabled = isAddItemFormDisabled || !selectedItemToAdd || itemQuantity === '' || itemPrice === '' || (selectedItemType === 'books' && !selectedSubtitle);
    const isSaveSetDisabled = (!booksDetail.length && !stationeryDetail.length && !currentSetId) || !selectedCustomer || !selectedClass;
    const availableClassesForCopy = useMemo(() => {
        return classes.filter(_class => !existingSetsClasses.has(_class._id));
    }, [classes, existingSetsClasses]);
    const isCopySetButtonDisabled = useMemo(() => {
        return !currentSetId || !selectedCustomer || !copyToClass || availableClassesForCopy.length === 0;
    }, [currentSetId, selectedCustomer, copyToClass, availableClassesForCopy]);

    // --- Handle Category Change ---
    const handleCategoryChange = (category) => {
        setSelectedStationeryCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            setShowAllStationery(false);
            setSelectedItemToAdd('');
            return newSet;
        });
    };

    const handleShowAllStationeryChange = (e) => {
        const isChecked = e.target.checked;
        setShowAllStationery(isChecked);
        setSelectedItemToAdd('');
        if (isChecked) {
            setSelectedStationeryCategories(new Set(stationeryCategories));
        } else {
            setSelectedStationeryCategories(new Set());
        }
    };

    // --- Close Download Dropdown on Outside Click ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target)) {
                setShowDownloadDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="create-set-management-container">
            <h2 className="main-section-title">Create Set Management</h2>
            {localError && (
                <p className="error-message">
                    <FaTimesCircle className="error-icon" /> {localError}
                </p>
            )}

            <div className="main-grid">
                {/* Left Panel: Order Details, Add, Copy */}
                <div className="left-panel">
                    <section className="section-container">
                        <h2 className="section-header1">Order Details</h2>
                        <div className="form-group">
                            <label htmlFor="customer-select" className="form-label">School Name:</label>
                            <select
                                id="customer-select"
                                value={selectedCustomer}
                                onChange={(e) => {
                                    setSelectedCustomer(e.target.value);
                                    setCurrentSetId(null);
                                    setBooksDetail([]);
                                    setStationeryDetail([]);
                                    setSelectedClass('');
                                    setSelectedSubtitle('');
                                    setSelectedItemToAdd('');
                                    setItemQuantity('');
                                    setItemPrice('');
                                    setIsEditMode(false);
                                    setEditingItemType(null);
                                    setEditingItemId(null);
                                    setShowAllBooksForSubtitle(false);
                                    setShowAllStationery(false);
                                    setSelectedStationeryCategories(new Set());
                                }}
                                disabled={loading}
                                className="form-select"
                            >
                                <option value="">-- Select --</option>
                                {(customers || []).map(customer => (
                                    <option key={customer._id} value={customer._id}>
                                        {customer.customerName} {customer.schoolCode ? `(${customer.schoolCode})` : ''}
                                    </option>
                                ))}
                            </select>

                            <div>
                                <button
                            onClick={() => {
                                setShowQuantityModal(true);
                                fetchSetQuantities();
                            }}
                            className="btn-primary"
                            disabled={loading || !selectedCustomer}
                        >
                            <FaEdit className="btn-icon-mr" /> Manage Set Quantity
                        </button>
                            </div>
                        </div>
                        <div className="form-grid-2-cols">
                            <div className="form-group">
                                <label htmlFor="class-select" className="form-label">Class:</label>
                                <select
                                    id="class-select"
                                    value={selectedClass}
                                    onChange={(e) => {
                                        setSelectedClass(e.target.value);
                                        setCurrentSetId(null);
                                        setBooksDetail([]);
                                        setStationeryDetail([]);
                                        setIsEditMode(false);
                                        setShowAllBooksForSubtitle(false);
                                    }}
                                    disabled={isFormDisabled || (classes || []).length === 0}
                                    className="form-select"
                                >
                                    <option value="">-- Select --</option>
                                    {(classes || []).map(_class => (
                                        <option key={_class._id} value={_class._id}>
                                            {_class.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="no-of-sets" className="form-label">No. of Sets:</label>
                                <input
                                    type="number"
                                    id="no-of-sets"
                                    value={noOfSets}
                                    onChange={(e) => {
                                        const value = e.target.value === '' ? '' : Math.max(1, Number(e.target.value) || 0);
                                        setNoOfSets(value);
                                        if (selectedClass) {
                                            handleQuantityChange(selectedClass, value);
                                        }
                                    }}
                                    onBlur={() => {
                                        if (noOfSets === '' || Number(noOfSets) < 1) {
                                            setNoOfSets('1');
                                            if (selectedClass) {
                                                handleQuantityChange(selectedClass, '1');
                                            }
                                        }
                                    }}
                                    min="1"
                                    disabled={true}
                                    className="form-input"
                                />
                            </div>
                        </div>
                        <button
                            onClick={fetchSetDetails}
                            disabled={isFormDisabled || !selectedClass || loading}
                            className="btn-primary"
                        >
                            {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : <FaSearch className="btn-icon-mr" />} Show Info
                        </button>
                    </section>

                    <section className="section-container">
                        <h2 className="section-header1">Add Items to Set</h2>
                        <div className="form-group">
                            <label className="form-label">Item Type:</label>
                            <div className="flex gap-4 items-center">
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="item-type-books"
                                        name="item-type"
                                        value="books"
                                        checked={selectedItemType === 'books'}
                                        onChange={(e) => {
                                            setSelectedItemType(e.target.value);
                                            setSelectedSubtitle('');
                                            setSelectedItemToAdd('');
                                            setItemQuantity('');
                                            setItemPrice('');
                                            setEditingItemType(null);
                                            setEditingItemId(null);
                                            setShowAllBooksForSubtitle(false);
                                            setShowAllStationery(false);
                                            setSelectedStationeryCategories(new Set());
                                        }}
                                        disabled={isAddItemFormDisabled}
                                        className="radio-input"
                                    />
                                    <label htmlFor="item-type-books" className="ml-2 form-label">Books</label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="item-type-stationery"
                                        name="item-type"
                                        value="stationery"
                                        checked={selectedItemType === 'stationery'}
                                        onChange={(e) => {
                                            setSelectedItemType(e.target.value);
                                            setSelectedSubtitle('');
                                            setSelectedItemToAdd('');
                                            setItemQuantity('');
                                            setItemPrice('');
                                            setEditingItemType(null);
                                            setEditingItemId(null);
                                            setShowAllBooksForSubtitle(false);
                                            setShowAllStationery(true);
                                            setSelectedStationeryCategories(new Set(stationeryCategories));
                                        }}
                                        disabled={isAddItemFormDisabled}
                                        className="radio-input"
                                    />
                                    <label htmlFor="item-type-stationery" className="ml-2 form-label">Stationery Items</label>
                                </div>
                            </div>
                        </div>

                        {selectedItemType === 'books' && (
                            <div className="form-group">
                                <label htmlFor="subtitle-select" className="form-label">Sub Title:</label>
                                <select
                                    id="subtitle-select"
                                    value={selectedSubtitle}
                                    onChange={(e) => {
                                        setSelectedSubtitle(e.target.value);
                                        setSelectedItemToAdd('');
                                        setItemQuantity('');
                                        setItemPrice('');
                                        setEditingItemType(null);
                                        setEditingItemId(null);
                                        setShowAllBooksForSubtitle(false);
                                    }}
                                    disabled={isAddItemFormDisabled || (subtitles || []).length === 0}
                                    className="form-select"
                                >
                                    <option value="">-- Select --</option>
                                    {(subtitles || []).map(subtitle => (
                                        <option key={subtitle._id} value={subtitle._id}>
                                            {subtitle.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {selectedItemType === 'stationery' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Filter by Category:</label>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {stationeryCategories.length > 0 ? (
                                            stationeryCategories.map(category => (
                                                <div key={category} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id={`category-checkbox-${category}`}
                                                        value={category}
                                                        checked={selectedStationeryCategories.has(category)}
                                                        onChange={() => handleCategoryChange(category)}
                                                        disabled={isAddItemFormDisabled || loading}
                                                        className="checkbox-input"
                                                    />
                                                    <label htmlFor={`category-checkbox-${category}`} className="ml-2 form-label">{category}</label>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500">No categories found.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="checkbox-group mb-4">
                                    <input
                                        type="checkbox"
                                        id="show-all-stationery-checkbox"
                                        checked={showAllStationery}
                                        onChange={handleShowAllStationeryChange}
                                        disabled={isAddItemFormDisabled || loading}
                                        className="checkbox-input"
                                    />
                                    <label htmlFor="show-all-stationery-checkbox" className="checkbox-label">Show all stationery items</label>
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label htmlFor="item-select" className="form-label">
                                {selectedItemType === 'stationery' ? 'Stationery Item:' : 'Book:'}
                            </label>
                            <select
                                id="item-select"
                                value={selectedItemToAdd}
                                onChange={(e) => setSelectedItemToAdd(e.target.value)}
                                disabled={isAddItemFormDisabled || (selectedItemType === 'books' && !selectedSubtitle) ||
                                    (itemDropdownOptions || []).length === 0 || loading
                                }
                                className="form-select"
                            >
                                <option value="">-- Select --</option>
                                {selectedItemType === 'stationery' ? (
                                    (itemDropdownOptions || []).map(item => (
                                        <option key={item._id} value={item._id}>
                                            {item.itemName || 'Unnamed Stationery Item'}
                                        </option>
                                    ))
                                ) : (
                                    (itemDropdownOptions || []).map(book => (
                                        <option key={book._id} value={book._id}>
                                            {book.bookName || 'Unnamed Book'}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                        {selectedItemType === 'books' && isEditMode && (
                            <div className="checkbox-group mb-4">
                                <input
                                    type="checkbox"
                                    id="show-all-books-checkbox"
                                    checked={showAllBooksForSubtitle}
                                    onChange={(e) => setShowAllBooksForSubtitle(e.target.checked)}
                                    disabled={isAddItemFormDisabled || loading}
                                    className="checkbox-input"
                                />
                                <label htmlFor="show-all-books-checkbox" className="checkbox-label">Show all books for this subtitle</label>
                            </div>
                        )}
                        <div className="form-grid-2-cols">
                            <div className="form-group">
                                <label htmlFor="item-quantity" className="form-label">Order Quantity:</label>
                                <input
                                    type="number"
                                    id="item-quantity"
                                    value={itemQuantity}
                                    onChange={(e) => setItemQuantity(e.target.value)}
                                    onBlur={() => {
                                        if (!itemQuantity || Number(itemQuantity) < 1) {
                                            setItemQuantity("1");
                                        }
                                    }}
                                    min="1"
                                    disabled={isAddItemFormDisabled || !selectedItemToAdd || loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="item-price" className="form-label">Price:</label>
                                <input
                                    type="number"
                                    id="item-price"
                                    value={itemPrice}
                                    onChange={(e) => setItemPrice(String(Math.max(0, Number(e.target.value || 0))))}
                                    min="0"
                                    disabled={isAddItemFormDisabled || !selectedItemToAdd || loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        
                        <button
                            onClick={handleAddOrUpdateItem}
                            disabled={isAddItemButtonDisabled || loading}
                            className="btn-success"
                        >
                            <FaPlusCircle className="btn-icon-mr" />
                            {editingItemId ? 'Update Item' : 'Add Item'}
                        </button>
                    </section>

                    <section className="section-container">
                        <h2 className="section-header1">Copy Set</h2>
                        <div className="form-group">
                            <label htmlFor="copy-to-class" className="form-label">Copy To Class:</label>
                            <select
                                id="copy-to-class"
                                value={copyToClass}
                                onChange={(e) => setCopyToClass(e.target.value)}
                                disabled={loading || availableClassesForCopy.length === 0 || !selectedCustomer}
                                className="form-select"
                            >
                                <option value="">-- Select --</option>
                                {availableClassesForCopy.length === 0 ? (
                                    <option value="" disabled>No available classes for copying</option>
                                ) : (
                                    availableClassesForCopy.map(_class => (
                                        <option key={_class._id} value={_class._id}>
                                            {_class.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="copy-stationery-checkbox"
                                checked={copyStationery}
                                onChange={(e) => setCopyStationery(e.target.checked)}
                                disabled={isCopySetButtonDisabled || loading}
                                className="checkbox-input"
                            />
                            <label htmlFor="copy-stationery-checkbox" className="checkbox-label">Copy stationery also</label>
                        </div>
                        <button
                            onClick={handleCopySet}
                            disabled={isCopySetButtonDisabled || loading}
                            className="btn-purple"
                        >
                            <FaCopy className="btn-icon-mr" />
                            Copy Set
                        </button>
                    </section>

                    <div className="flex gap-4">
                        <button
                            onClick={handleSaveSet}
                            disabled={isSaveSetDisabled || loading}
                            className="w-1/2 btn-blue"
                        >
                            {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : (isEditMode ? 'Update Set' : 'Save Set')}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={loading}
                            className="w-1/2 btn-secondary"
                        >
                            New Set
                        </button>
                    </div>
                </div>

                {/* Right Panel: Books and Stationery Tables */}
                <div className="right-panel">
                    <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200">
                        <h2 className="section-header"> </h2>
                        <div className="relative" ref={downloadDropdownRef}>
                            <button
                                onClick={() => setShowDownloadDropdown(prev => !prev)}
                                className="btn-download"
                                title="Download Details"
                                disabled={(booksDetail.length === 0 && stationeryDetail.length === 0) || loading}
                            >
                                <FaDownload className="btn-download-icon-mr" /> Download <FaCaretDown className="ml-2" />
                            </button>
                            {showDownloadDropdown && (
                                <div className="download-dropdown-menu">
                                    <button
                                        onClick={() => handleDownload('books')}
                                        disabled={booksDetail.length === 0}
                                    >
                                        Only Books
                                    </button>
                                    <button
                                        onClick={() => handleDownload('stationery')}
                                        disabled={stationeryDetail.length === 0}
                                    >
                                        Only Stationery
                                    </button>
                                    <button
                                        onClick={() => handleDownload('both')}
                                        disabled={booksDetail.length === 0 && stationeryDetail.length === 0}
                                    >
                                        Both/Complete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <section className="section-container">
                        <header className="moved-header-container">
                            <h1 className="moved-header-title"> </h1>
                            <div className="moved-header-totals">
                                <div className="total-item">Items: {totalItems}</div>
                                <div className="total-item1">Total Set Value: Rs.{totalAmount.toFixed(2)}</div>
                                <div className="total-item">Qty: {totalQuantity * noOfSets}</div>
                            </div>
                        </header>

                        <div className="table-container">
                            <h2 className="section-header">Books List Details</h2>
                            <table className="app-table">
                                <thead className="table-header-group">
                                    <tr>
                                        <th className="table-header-cell">No.</th>
                                        <th className="table-header-cell">Sub Title</th>
                                        <th className="table-header-cell">Book</th>
                                        <th className="table-header-cell">QTY</th>
                                        <th className="table-header-cell">Price</th>
                                        <th className="table-header-cell">Total</th>
                                        <th className="table-header-cell table-cell-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="table-body">
                                    {(booksDetail || []).length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center">No books added yet.</td>
                                        </tr>
                                    ) : (
                                        booksDetail.map((item, index) => (
                                            <tr key={item.book._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                                                <td className="table-cell whitespace-nowrap font-medium">{index + 1}</td>
                                                <td className="table-cell whitespace-nowrap">{getStringValue(item.book.subtitle)}</td>
                                                <td className="table-cell whitespace-normal">{getStringValue(item.book.bookName)}</td>
                                                <td className="table-cell whitespace-nowrap">{item.quantity}</td>
                                                <td className="table-cell whitespace-nowrap">Rs.{item.price.toFixed(2)}</td>
                                                <td className="table-cell whitespace-nowrap">Rs.{(item.quantity * item.price).toFixed(2)}</td>
                                                <td className="table-cell whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => handleEditBook(item)}
                                                        className="table-action-btn edit-btn"
                                                        title="Edit Book"
                                                        disabled={loading}
                                                    >
                                                        <FaEdit className="table-action-icon" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBook(item.book._id, item.book.bookName)}
                                                        className="table-action-btn delete-btn"
                                                        title="Delete Book"
                                                        disabled={loading}
                                                    >
                                                        <FaTrashAlt className="table-action-icon" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="table-footer-row">
                                        <td colSpan="3" className="table-footer-cell text-right">Total QTY/Amount</td>
                                        <td className="table-footer-cell text-left">{booksDetail.reduce((sum, item) => sum + item.quantity, 0)}</td>
                                        <td colSpan="2" className="table-footer-cell text-left">Rs.{booksDetail.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </section>

                    {(booksDetail.length > 0 || stationeryDetail.length > 0) && (
                        <section className="section-container">
                            <div className="table-container">
                                <h2 className="section-header">Stationery Item Details</h2>
                                <table className="app-table">
                                    <thead className="table-header-group">
                                        <tr>
                                            <th className="table-header-cell">No.</th>
                                            <th className="table-header-cell">Item</th>
                                            <th className="table-header-cell">QTY</th>
                                            <th className="table-header-cell">Price</th>
                                            <th className="table-header-cell">Total</th>
                                            <th className="table-header-cell table-cell-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="table-body">
                                        {(stationeryDetail || []).length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center">No stationery items added yet.</td>
                                            </tr>
                                        ) : (
                                            stationeryDetail.map((item, index) => (
                                                <tr key={item.item._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                                                    <td className="table-cell whitespace-nowrap font-medium">{index + 1}</td>
                                                    <td className="table-cell whitespace-normal">{getStringValue(item.item.itemName)}</td>
                                                    <td className="table-cell whitespace-nowrap">{item.quantity}</td>
                                                    <td className="table-cell whitespace-nowrap">Rs.{item.price.toFixed(2)}</td>
                                                    <td className="table-cell whitespace-nowrap">Rs.{(item.quantity * item.price).toFixed(2)}</td>
                                                    <td className="table-cell whitespace-nowrap text-center">
                                                        <button
                                                            onClick={() => handleEditStationery(item)}
                                                            className="table-action-btn edit-btn"
                                                            title="Edit Stationery Item"
                                                            disabled={loading}
                                                        >
                                                            <FaEdit className="table-action-icon" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteStationery(item.item._id, item.item.itemName)}
                                                            className="table-action-btn delete-btn"
                                                            title="Delete Stationery Item"
                                                            disabled={loading}
                                                        >
                                                            <FaTrashAlt className="table-action-icon" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="table-footer-row">
                                            <td colSpan="2" className="table-footer-cell text-right">Total QTY/Amount</td>
                                            <td className="table-footer-cell text-left">{stationeryDetail.reduce((sum, item) => sum + item.quantity, 0)}</td>
                                            <td colSpan="2" className="table-footer-cell text-left">Rs.{stationeryDetail.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* Item Deletion Confirmation Modal */}
            {showConfirmModal && itemToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-header">Confirm Deletion</h3>
                        <p className="modal-body">
                            Are you sure you want to delete the {itemToDelete.type} "{itemToDelete.name}" from this set? This action cannot be undone.
                        </p>
                        <div className="modal-footer">
                            <button onClick={cancelDeletion} className="btn-secondary mr-2" disabled={loading}>
                                Cancel
                            </button>
                            <button onClick={confirmDeletion} className="btn-danger" disabled={loading}>
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showQuantityModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-header">Manage Set Quantities</h3>
                        <div className="modal-body">
                            <p>Update quantities for sets associated with the selected school.</p>
                            {classes.length === 0 ? (
                                <p>No classes available to manage quantities.</p>
                            ) : (
                                <table className="app-table">
                                    <thead className="table-header-group">
                                        <tr>
                                            <th className="table-header-cell">Class</th>
                                            <th className="table-header-cell">Quantity</th>
                                            <th className="table-header-cell table-cell-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="table-body">
                                        {classes.map((cls, index) => {
                                            const classId = cls._id;
                                            const className = cls.name;
                                            const quantity = editedQuantities[classId] ?? '';
                                            return (
                                                <tr key={classId} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                                                    <td className="table-cell">{className}</td>
                                                    <td className="table-cell">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={quantity}
                                                            onChange={(e) => handleQuantityChange(classId, e.target.value)}
                                                            onBlur={() => {
                                                                if (quantity === '' || Number(quantity) < 0) {
                                                                    handleQuantityChange(classId, '');
                                                                }
                                                            }}
                                                            disabled={loading}
                                                            className="form-input w-full"
                                                        />
                                                    </td>
                                                    <td className="table-cell whitespace-nowrap text-center">
                                                        <button
                                                            onClick={() => handleEditQuantity(classId, className)}
                                                            className="table-action-btn edit-btn"
                                                            title="Edit Quantity"
                                                            disabled={loading}
                                                        >
                                                            <FaEdit className="table-action-icon" />
                                                        </button>
                                                        {setQuantities.some(sq => sq.classId === classId) && (
                                                            <button
                                                                onClick={() => handleDeleteQuantity(classId, className)}
                                                                className="table-action-btn delete-btn"
                                                                title="Delete Quantity"
                                                                disabled={loading}
                                                            >
                                                                <FaTrashAlt className="table-action-icon" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setShowQuantityModal(false)}
                                className="btn-secondary mr-2"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSetQuantities}
                                className="btn-primary"
                                disabled={loading || !Object.values(editedQuantities).some(qty => qty !== '' && qty >= 0)}
                            >
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Save Quantities'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Set Quantity Deletion Confirmation Modal */}
            {showDeleteQuantityModal && quantityToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-header">Confirm Delete Quantity</h3>
                        <p className="modal-body">
                            Are you sure you want to delete the set quantity for class "{quantityToDelete.className}"? This action cannot be undone.
                        </p>
                        <div className="modal-footer">
                            <button
                                onClick={() => {
                                    setShowDeleteQuantityModal(false);
                                    setQuantityToDelete(null);
                                    showFlashMessage('Deletion cancelled.', 'info');
                                }}
                                className="btn-secondary mr-2"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteQuantity}
                                className="btn-danger"
                                disabled={loading}
                            >
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}