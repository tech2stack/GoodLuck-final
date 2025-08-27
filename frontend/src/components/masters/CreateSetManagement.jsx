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

    const totalAmount = booksDetail.reduce((sum, item) => {
        const price = item.price ?? 0; // Use 0 for undefined/null prices in calculations
        return sum + (item.quantity * price);
    }, 0) +
        stationeryDetail.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    const totalItems = booksDetail.length + stationeryDetail.length;
    const totalQuantity = booksDetail.reduce((sum, item) => sum + item.quantity, 0) +
        stationeryDetail.reduce((sum, item) => sum + item.quantity, 0);

    // --- Helper Functions ---
    const getStringValue = (field) => {
        if (field === null || field === undefined) return 'N/A';
        return String(field).trim() || 'N/A';
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
        console.log('DEBUG: resetForm called');
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

    const fetchBookCatalogsBySubtitle = useCallback(async () => {
        if (!selectedSubtitle || !selectedClass) {
            setBookCatalogs([]);
            setSelectedItemToAdd('');
            setItemPrice('');
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/sets/dropdowns/book-catalogs?subtitleId=${selectedSubtitle}&classId=${selectedClass}`);
            const validBookCatalogs = (response.data.data.bookCatalogs || []).filter(b => b && b._id);
            setBookCatalogs(validBookCatalogs);

            if (selectedItemToAdd) {
                const selectedBook = validBookCatalogs.find(b => b._id === selectedItemToAdd);
                if (selectedBook) {
                    const price = selectedBook.bookType === 'common_price' ? selectedBook.commonPrice : selectedBook.classPrice;
                    setItemPrice(price?.toString() || '');
                }
            }
        } catch (err) {
            console.error('Error fetching book catalogs by subtitle:', err);
            showFlashMessage(err.response?.data?.message || 'Failed to load books for selected subtitle.', 'error');
            setLocalError('Failed to load books for selected subtitle.');
        } finally {
            setLoading(false);
        }
    }, [selectedSubtitle, selectedClass, selectedItemToAdd, showFlashMessage]);

    const handleBookSelection = useCallback((bookId) => {
        setSelectedItemToAdd(bookId);
        const selectedBook = bookCatalogs.find(b => b._id === bookId);
        if (selectedBook) {
            const price = selectedBook.bookType === 'common_price' ? selectedBook.commonPrice : selectedBook.classPrice;
            setItemPrice(price?.toString() || '');
        } else {
            setItemPrice('');
        }
    }, [bookCatalogs]);

    useEffect(() => {
        if (selectedItemType === 'books' && selectedSubtitle && selectedClass) {
            fetchBookCatalogsBySubtitle();
        }
    }, [selectedSubtitle, selectedClass, selectedItemType, fetchBookCatalogsBySubtitle]);

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
                    price: item.price ?? null,
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

                const initialQuantities = {};
                classes.forEach(cls => {
                    const existingQuantity = fetchedQuantities.find(sq => sq.classId === cls._id);
                    initialQuantities[cls._id] = existingQuantity ? String(existingQuantity.quantity) : '';
                });
                setEditedQuantities(initialQuantities);

                if (selectedClass) {
                    const classQuantity = fetchedQuantities.find(sq => sq.classId === selectedClass);
                    setNoOfSets(classQuantity ? String(classQuantity.quantity) : '1');
                }

                // showFlashMessage('Set quantities fetched successfully!', 'success');
            } else {
                throw new Error(response.data.message || 'Failed to fetch set quantities.');
            }
        } catch (err) {
            console.error('Error fetching set quantities:', err);
            showFlashMessage(err.response?.data?.message || 'Failed to fetch set quantities.', 'error');

            const initialQuantities = {};
            classes.forEach(cls => {
                initialQuantities[cls._id] = '';
            });
            setEditedQuantities(initialQuantities);
            setSetQuantities([]);
            if (selectedClass) {
                setNoOfSets('1');
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
                // showFlashMessage('No existing set found for the selected criteria. You can create a new one.', 'info');
            }

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
            await fetchSetQuantities();
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

    const handleEditQuantity = (classId, className) => {
        showFlashMessage(`Editing quantity for class ${className}.`, 'info');
        const input = document.querySelector(`input[value="${editedQuantities[classId] ?? ''}"]`);
        if (input) input.focus();
    };

    const handleDeleteQuantity = (classId, className) => {
        setQuantityToDelete({ classId, className });
        setShowDeleteQuantityModal(true);
    };

    const confirmDeleteQuantity = async () => {
        if (!quantityToDelete || !selectedCustomer) {
            showFlashMessage('Error: No class selected for deletion or customer not selected.', 'error');
            setShowDeleteQuantityModal(false);
            setQuantityToDelete(null);
            return;
        }

        const { classId, className } = quantityToDelete;

        console.log('Attempting to delete quantity for:', {
            customerId: selectedCustomer,
            classId,
            className
        });

        setLoading(true);
        try {
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
            await fetchSetQuantities();
        } catch (err) {
            console.error('Error saving set quantities:', err);
            showFlashMessage(err.response?.data?.message || 'Failed to save set quantities.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedCustomer, editedQuantities, showFlashMessage, fetchSetQuantities]);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    useEffect(() => {
    if (selectedCustomer && selectedClass) {
        fetchSetDetails();
    }
}, [selectedCustomer, selectedClass, fetchSetDetails]);

    useEffect(() => {
        if (selectedItemToAdd) {
            if (selectedItemType === 'stationery') {
                const itemInfo = stationeryItemsMaster.find(item => item._id === selectedItemToAdd);
                if (itemInfo && !(editingItemType === 'stationery' && editingItemId === selectedItemToAdd)) {
                    setItemQuantity('1');
                    setItemPrice(String(itemInfo.price || '0'));
                }
            } else if (selectedItemType === 'books') {
                if (!(editingItemType === 'book' && editingItemId === selectedItemToAdd)) {
                    const bookInfo = bookCatalogs.find(book => book._id === selectedItemToAdd);
                    if (bookInfo) {
                        setItemQuantity('1');
                        const price = bookInfo.bookType === 'common_price' ? bookInfo.commonPrice : bookInfo.classPrice;
                        setItemPrice(price?.toString() || '0');
                    }
                }
            }
        } else {
            setItemQuantity('');
            setItemPrice('');
        }
    }, [selectedItemType, selectedItemToAdd, stationeryItemsMaster, bookCatalogs, editingItemType, editingItemId]);


const handleAddOrUpdateItem = useCallback(async () => {
    console.log('DEBUG: handleAddOrUpdateItem called', { selectedItemType, selectedItemToAdd, itemPrice, itemQuantity });

    if (!selectedItemToAdd || !itemQuantity) {
        showFlashMessage('Please select an item and quantity.', 'error');
        return;
    }

    const quantity = Number(itemQuantity);
    if (quantity <= 0) {
        showFlashMessage('Quantity must be greater than zero.', 'error');
        return;
    }

    if (selectedItemType === 'books' && !itemPrice && itemPrice !== '0') {
        showFlashMessage('Please provide a price for the book or confirm if it should be unset.', 'warning');
        return;
    }
    if (selectedItemType === 'stationery' && (!itemPrice || Number(itemPrice) <= 0)) {
        showFlashMessage('Please provide a valid price for the stationery item.', 'error');
        return;
    }

    // Check for duplicate book when adding (not editing)
    if (selectedItemType === 'books' && !editingItemId && booksDetail.some(item => item.book._id === selectedItemToAdd)) {
        showFlashMessage('This book is already added to the set.', 'warning');
        return;
    }

    const price = itemPrice ? Number(itemPrice) : null;

    try {
        setLoading(true);

        if (editingItemId) {
            if (selectedItemType === 'books') {
                setBooksDetail(prev => prev.map(item =>
                    item.book._id === editingItemId ? { ...item, quantity, price } : item
                ));
            } else {
                setStationeryDetail(prev => prev.map(item =>
                    item.item._id === editingItemId ? { ...item, quantity, price } : item
                ));
            }
            showFlashMessage('Item updated successfully.', 'success');
        } else {
            if (selectedItemType === 'books') {
                const book = bookCatalogs.find(b => b._id === selectedItemToAdd);
                if (book) {
                    setBooksDetail(prev => [...prev, {
                        book: {
                            _id: selectedItemToAdd,
                            bookName: book.bookName,
                            subtitle: subtitles.find(s => s._id === selectedSubtitle)?.name || ''
                        },
                        quantity,
                        price,
                        status: 'active'
                    }]);
                }
            } else {
                const item = stationeryItemsMaster.find(i => i._id === selectedItemToAdd);
                if (item) {
                    setStationeryDetail(prev => [...prev, {
                        item: {
                            _id: selectedItemToAdd,
                            itemName: item.itemName
                        },
                        quantity,
                        price,
                        status: 'active'
                    }]);
                }
            }
            showFlashMessage('Item added successfully.', 'success');
        }

        const payload = {
            customer: selectedCustomer,
            class: selectedClass,
            books: booksDetail.map(b => ({
                book: b.book._id,
                quantity: b.quantity,
                price: b.price != null ? b.price : null,
                status: b.status
            })),
            stationeryItems: stationeryDetail.map(s => ({
                item: s.item._id,
                quantity: s.quantity,
                price: s.price,
                status: s.status
            })),
            quantity: Number(noOfSets) || 1
        };

        if (selectedItemType === 'books') {
            const existingBookIndex = payload.books.findIndex(b => b.book === selectedItemToAdd);
            if (existingBookIndex !== -1 && editingItemId) {
                payload.books[existingBookIndex] = {
                    book: selectedItemToAdd,
                    quantity,
                    price,
                    status: 'active'
                };
            } else if (existingBookIndex === -1) {
                payload.books.push({
                    book: selectedItemToAdd,
                    quantity,
                    price,
                    status: 'active'
                });
            }
        } else {
            const existingStationeryIndex = payload.stationeryItems.findIndex(s => s.item === selectedItemToAdd);
            if (existingStationeryIndex !== -1 && editingItemId) {
                payload.stationeryItems[existingStationeryIndex] = {
                    item: selectedItemToAdd,
                    quantity,
                    price,
                    status: 'active'
                };
            } else {
                payload.stationeryItems.push({
                    item: selectedItemToAdd,
                    quantity,
                    price,
                    status: 'active'
                });
            }
        }

        let response;
        if (currentSetId) {
            response = await api.patch(`/sets/${currentSetId}`, payload);
        } else {
            response = await api.post('/sets', payload);
        }

        if (response.data.status === 'success') {
            const updatedSet = response.data.data.set;
            setCurrentSetId(updatedSet._id);
            setBooksDetail(fetchedToLocalFormat(updatedSet.books, 'book'));
            setStationeryDetail(fetchedToLocalFormat(updatedSet.stationeryItems, 'stationery'));
            setNoOfSets(updatedSet.quantity);
            setIsEditMode(true);
            showFlashMessage(currentSetId ? 'Set updated successfully!' : 'Set created successfully!', 'success');
        } else {
            throw new Error(response.data.message || 'Failed to save set.');
        }

        setItemQuantity('1');
        setItemPrice('');
        setEditingItemType(null);
        setEditingItemId(null);
    } catch (err) {
        console.error('Error adding/updating item:', err);
        showFlashMessage(err.response?.data?.message || 'Failed to add/update item.', 'error');
    } finally {
        setLoading(false);
    }
}, [selectedItemType, selectedItemToAdd, itemQuantity, itemPrice, bookCatalogs, stationeryItemsMaster, editingItemId, showFlashMessage, selectedSubtitle, subtitles, selectedCustomer, selectedClass, booksDetail, stationeryDetail, noOfSets, currentSetId, fetchedToLocalFormat]);

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

    const handleEditBook = (bookItem) => {
        const foundSubtitle = subtitles.find(s => s.name === bookItem.book.subtitle);
        const subtitleIdToSet = foundSubtitle ? foundSubtitle._id : '';

        setSelectedItemType('books');
        setSelectedSubtitle(subtitleIdToSet);
        setSelectedItemToAdd(bookItem.book._id);
        setItemQuantity(String(bookItem.quantity));
        setItemPrice(bookItem.price != null ? String(bookItem.price) : '');
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

    const handleCopySet = async () => {
        if (!currentSetId || !copyToClass) {
            showFlashMessage('Please select a class to copy to.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                sourceSetId: currentSetId,
                targetCustomerId: selectedCustomer,
                targetClassId: copyToClass,
                copyStationery
            };

            const response = await api.post('/sets/copy', payload);
            if (response.data.status === 'success') {
                showFlashMessage('Set copied successfully! Some book prices may be unset and need to be updated.', 'success');
                setSelectedClass(copyToClass);
                setCopyToClass('');
                setCopyStationery(false);
                await fetchSetDetails();
                const updatedSet = response.data.data.set;
                const hasNullPrices = updatedSet.books.some(book => book.price == null);
                if (hasNullPrices) {
                    showFlashMessage('Some books in the copied set have unset prices. Please review and update them.', 'warning');
                }
            } else {
                throw new Error(response.data.message || 'Failed to copy set.');
            }
        } catch (err) {
            console.error('Error copying set:', err);
            showFlashMessage(err.response?.data?.message || 'Failed to copy set.', 'error');
        } finally {
            setLoading(false);
        }
    };

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
                const itemTotal = item.price != null ? item.quantity * item.price : 0;
                totalQty += item.quantity;
                totalAmt += itemTotal;
                tableRows.push([
                    index + 1,
                    getStringValue(item.book.subtitle),
                    getStringValue(item.book.bookName),
                    item.quantity,
                    item.price != null ? `Rs.${item.price.toFixed(2)}` : 'N/A',
                    item.price != null ? `Rs.${itemTotal.toFixed(2)}` : 'N/A'
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
                <div className="left-panel">
                    <section className="section-container">
                        <h2 className="section-header1">Create Set</h2>
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
                        {/* <button
                            onClick={fetchSetDetails}
                            disabled={isFormDisabled || !selectedClass || loading}
                            className="btn-primary"
                        >
                            {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : <FaSearch className="btn-icon-mr" />} Show Info
                        </button> */}
                    </section>

                    <section className="section-container">
                        <h2 className="section-header1">Add Items to Set & Stationery</h2>
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
                                            console.log('DEBUG: Changing itemType to books', { newType: e.target.value });
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
                                            console.log('DEBUG: Changing itemType to stationery', { newType: e.target.value });
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
                                        console.log('DEBUG: Changing subtitle', { newSubtitle: e.target.value });
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
                            </>
                        )}

                        <div className="form-group">
                            <label htmlFor="item-select" className="form-label">
                                {selectedItemType === 'stationery' ? 'Stationery Item:' : 'Book:'}
                            </label>
                            <select
                                id="item-select"
                                value={selectedItemToAdd}
                                onChange={(e) => {
                                    console.log('DEBUG: Changing item selection', { itemType: selectedItemType, itemId: e.target.value });
                                    if (selectedItemType === 'books') {
                                        handleBookSelection(e.target.value);
                                    } else {
                                        setSelectedItemToAdd(e.target.value);
                                        const selectedItem = stationeryItemsMaster.find(item => item._id === e.target.value);
                                        setItemPrice(selectedItem ? selectedItem.price?.toString() || '0' : '');
                                    }
                                }}
                                disabled={isAddItemFormDisabled || (selectedItemType === 'books' && !selectedSubtitle) ||
                                    (selectedItemType === 'books' ? bookCatalogs : stationeryItemsMaster.filter(item =>
                                        selectedStationeryCategories.size === 0 || selectedStationeryCategories.has(item.category)
                                    )).length === 0 || loading
                                }
                                className="form-select"
                            >
                                <option value="">-- Select --</option>
                                {selectedItemType === 'stationery' ? (
                                    stationeryItemsMaster
                                        .filter(item => selectedStationeryCategories.size === 0 || selectedStationeryCategories.has(item.category))
                                        .map(item => (
                                            <option key={item._id} value={item._id}>
                                                {item.itemName || 'Unnamed Stationery Item'}
                                            </option>
                                        ))
                                ) : (
                                    bookCatalogs.map(book => (
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
                                    onChange={(e) => {
                                        console.log('DEBUG: Changing itemQuantity', { newQuantity: e.target.value });
                                        setItemQuantity(e.target.value);
                                    }}
                                    onBlur={() => {
                                        if (!itemQuantity || Number(itemQuantity) < 1) {
                                            setItemQuantity('1');
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
                                    onChange={(e) => {
                                        console.log('DEBUG: Changing itemPrice manually', { newPrice: e.target.value });
                                        setItemPrice(String(Math.max(0, Number(e.target.value || 0))));
                                    }}
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

                       
                    </section>

                    {(booksDetail.length > 0 || stationeryDetail.length > 0) && (
                        <section className="section-container">
                            <div className="table-container">
                                <h2 className="section-header">Books Details</h2>
                                <table className="app-table">
                                    <thead className="table-header-group">
                                        <tr>
                                            <th className="table-header-cell">No.</th>
                                            <th className="table-header-cell">Subtitle</th>
                                            <th className="table-header-cell">Book Name</th>
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
                                                    <td className="table-cell whitespace-nowrap">
                                                        {item.price != null ? `Rs.${item.price.toFixed(2)}` : 'N/A'}
                                                    </td>
                                                    <td className="table-cell whitespace-nowrap">
                                                        {item.price != null ? `Rs.${(item.quantity * item.price).toFixed(2)}` : 'N/A'}
                                                    </td>
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
                                            <td colSpan="3" className="table-footer-cell                                             text-right">Total QTY/Amount</td>
                                            <td className="table-footer-cell text-left">{booksDetail.reduce((sum, item) => sum + item.quantity, 0)}</td>
                                            <td colSpan="2" className="table-footer-cell text-left">
                                                Rs.{booksDetail.reduce((sum, item) => {
                                                    const price = item.price ?? 0;
                                                    return sum + (item.quantity * price);
                                                }, 0).toFixed(2)}
                                            </td>
                                            <td className="table-footer-cell"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="table-container mt-6">
                                <h2 className="section-header">Stationery Items Details</h2>
                                <table className="app-table">
                                    <thead className="table-header-group">
                                        <tr>
                                            <th className="table-header-cell">No.</th>
                                            <th className="table-header-cell">Item Name</th>
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
                                            <td colSpan="2" className="table-footer-cell text-left">
                                                Rs.{stationeryDetail.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
                                            </td>
                                            <td className="table-footer-cell"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">Confirm Deletion</h2>
                        <p className="modal-message">
                            Are you sure you want to delete {itemToDelete?.name || 'this item'} from the set?
                        </p>
                        <div className="modal-buttons">
                            <button
                                onClick={confirmDeletion}
                                disabled={loading}
                                className="btn-danger"
                            >
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Confirm'}
                            </button>
                            <button
                                onClick={cancelDeletion}
                                disabled={loading}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showQuantityModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-content-wide">
                        <h2 className="modal-title">Manage Set Quantities</h2>
                        <p className="modal-message">Update the number of sets for each class for {customers.find(c => c._id === selectedCustomer)?.customerName || 'the selected school'}.</p>
                        <div className="table-container">
                            <table className="app-table">
                                <thead className="table-header-group">
                                    <tr>
                                        <th className="table-header-cell">Class</th>
                                        <th className="table-header-cell">Quantity</th>
                                        <th className="table-header-cell table-cell-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="table-body">
                                    {(classes || []).length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="text-center">No classes available.</td>
                                        </tr>
                                    ) : (
                                        classes.map((cls, index) => (
                                            <tr key={cls._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                                                <td className="table-cell whitespace-nowrap">{cls.name}</td>
                                                <td className="table-cell whitespace-nowrap">
                                                    <input
                                                        type="number"
                                                        value={editedQuantities[cls._id] ?? ''}
                                                        onChange={(e) => handleQuantityChange(cls._id, e.target.value)}
                                                        onBlur={() => {
                                                            if (!editedQuantities[cls._id] || Number(editedQuantities[cls._id]) < 0) {
                                                                handleQuantityChange(cls._id, '');
                                                            }
                                                        }}
                                                        min="0"
                                                        disabled={loading}
                                                        className="form-input w-20"
                                                    />
                                                </td>
                                                <td className="table-cell whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => handleEditQuantity(cls._id, cls.name)}
                                                        className="table-action-btn edit-btn"
                                                        title="Edit Quantity"
                                                        disabled={loading}
                                                    >
                                                        <FaEdit className="table-action-icon" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteQuantity(cls._id, cls.name)}
                                                        className="table-action-btn delete-btn"
                                                        title="Delete Quantity"
                                                        disabled={loading || !editedQuantities[cls._id]}
                                                    >
                                                        <FaTrashAlt className="table-action-icon" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-buttons">
                            <button
                                onClick={saveSetQuantities}
                                disabled={loading || Object.values(editedQuantities).every(q => !q || Number(q) <= 0)}
                                className="btn-success"
                            >
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Save Quantities'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowQuantityModal(false);
                                    setEditedQuantities({});
                                    setSetQuantities([]);
                                }}
                                disabled={loading}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteQuantityModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">Confirm Quantity Deletion</h2>
                        <p className="modal-message">
                            Are you sure you want to delete the quantity for {quantityToDelete?.className || 'this class'}?
                        </p>
                        <div className="modal-buttons">
                            <button
                                onClick={confirmDeleteQuantity}
                                disabled={loading}
                                className="btn-danger"
                            >
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Confirm'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowDeleteQuantityModal(false);
                                    setQuantityToDelete(null);
                                }}
                                disabled={loading}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}