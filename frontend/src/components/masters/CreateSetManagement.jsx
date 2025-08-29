// src/components/masters/CreateSetManagement.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../../utils/api';
import { toast } from 'sonner';
import { FaPlusCircle, FaSearch, FaCopy, FaEdit, FaTrashAlt, FaSpinner, FaDownload, FaTimesCircle, FaCaretDown } from 'react-icons/fa';

// Stylesheets
import '../../styles/Form.css';
import '../../styles/Table.css';
import '../../styles/Modal.css';
import '../../styles/CreateSetManagement.css';
import companyLogo from '../../assets/glbs-logo.jpg';

// Define special IDs
const STATIONERY_SUBTITLE_ID = 'STATIONERY_ITEMS_SPECIAL_ID';

export default function CreateSetManagement({ showFlashMessage }) {
    // State for Dropdown Data
    const [customers, setCustomers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subtitles, setSubtitles] = useState([]);
    const [bookCatalogs, setBookCatalogs] = useState({ requiredBooks: [], optionalBooks: [] });
    const [stationeryItemsMaster, setStationeryItemsMaster] = useState([]);
    const [existingSetsClasses, setExistingSetsClasses] = useState(new Set());
    const [stationeryCategories, setStationeryCategories] = useState([]);
    const [selectedStationeryCategories, setSelectedStationeryCategories] = useState(new Set());

    // State for Main Set Filters/Details
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [noOfSets, setNoOfSets] = useState(1);

    // State for Current Set Data (Books and Stationery)
    const [currentSetId, setCurrentSetId] = useState(null);
    const [booksDetail, setBooksDetail] = useState([]);
    const [stationeryDetail, setStationeryDetail] = useState([]);

    // State for Adding New Items
    const [selectedItemType, setSelectedItemType] = useState('books');
    const [selectedSubtitle, setSelectedSubtitle] = useState('');
    const [selectedItemToAdd, setSelectedItemToAdd] = useState('');
    const [itemQuantity, setItemQuantity] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [showAllBooksForSubtitle, setShowAllBooksForSubtitle] = useState(false);
    const [showAllStationery, setShowAllStationery] = useState(false);
    const [editingItemType, setEditingItemType] = useState(null);
    const [editingItemId, setEditingItemId] = useState(null);

    // State for Copying Sets
    const [copyToClass, setCopyToClass] = useState('');
    const [copyStationery, setCopyStationery] = useState(false);

    // Loading and Error States
    const [loading, setLoading] = useState(false);
    const [itemLoading, setItemLoading] = useState(false); // Granular loading for item operations
    const [localError, setLocalError] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // State for Confirmation Modals
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showDeleteQuantityModal, setShowDeleteQuantityModal] = useState(false);
    const [quantityToDelete, setQuantityToDelete] = useState(null);

    // State for Download Dropdown
    const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
    const downloadDropdownRef = useRef(null);

    // State for Set Quantity Management
    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [setQuantities, setSetQuantities] = useState([]);
    const [editedQuantities, setEditedQuantities] = useState({});

    const totalAmount = useMemo(() => {
        return (
            booksDetail.reduce((sum, item) => {
                const price = Number(item.price) || 0;
                return sum + item.quantity * price;
            }, 0) +
            stationeryDetail.reduce((sum, item) => sum + item.quantity * Number(item.price), 0)
        );
    }, [booksDetail, stationeryDetail]);

    const totalItems = useMemo(() => booksDetail.length + stationeryDetail.length, [booksDetail, stationeryDetail]);
    const totalQuantity = useMemo(
        () => booksDetail.reduce((sum, item) => sum + item.quantity, 0) + stationeryDetail.reduce((sum, item) => sum + item.quantity, 0),
        [booksDetail, stationeryDetail]
    );



    // Helper Functions
    const getStringValue = (field) => String(field ?? 'N/A').trim() || 'N/A';

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

    // Fetch Dropdown Data
    const fetchDropdownData = useCallback(async () => {
        setLoading(true);
        setLocalError(null);
        try {
            const [customersRes, classesRes, publicationsRes, stationeryRes, allSetsRes] = await Promise.all([
                api.get('/sets/dropdowns/customers'),
                api.get('/sets/dropdowns/classes'),
                api.get('/publications'),
                api.get('/sets/dropdowns/stationery-items'),
                api.get('/sets/all'),
            ]);

            const validCustomers = (customersRes.data.data.customers || []).filter((c) => c?._id && String(c.customerName || '').trim());
            const validClasses = (classesRes.data.data.classes || []).filter((c) => c?._id && String(c.name || '').trim());
            const validStationeryItems = (stationeryRes.data.data.stationeryItems || []).filter((i) => i?._id);

            setCustomers(validCustomers);
            setClasses(validClasses);
            setStationeryItemsMaster(validStationeryItems);

            const uniqueCategories = [...new Set(validStationeryItems.map((item) => item.category))].filter(Boolean);
            setStationeryCategories(uniqueCategories);
            setSelectedStationeryCategories(new Set(uniqueCategories));

            const allPublications = publicationsRes.data.data.publications || [];
            const allSubtitles = allPublications.flatMap((pub) =>
                (pub.subtitles || []).map((sub) => ({
                    _id: sub._id,
                    name: `${pub.name} - ${sub.name}`,
                }))
            );
            setSubtitles(allSubtitles);

            if (allSetsRes.data.status === 'success') {
                setExistingSetsClasses(new Set(allSetsRes.data.data.sets.map((set) => set.class)));
            }
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
            const errorMessage = err.response?.data?.message || 'Network error fetching dropdown data.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]);

    // Reset Form
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
        setBookCatalogs({ requiredBooks: [], optionalBooks: [] });
        fetchDropdownData();
    }, [fetchDropdownData]);

    const fetchBookCatalogsBySubtitle = useCallback(async () => {
        if (!selectedSubtitle || !selectedClass) {
            setBookCatalogs({ requiredBooks: [], optionalBooks: [] });
            setSelectedItemToAdd('');
            setItemPrice('');
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/sets/dropdowns/book-catalogs?subtitleId=${selectedSubtitle}&classId=${selectedClass}`);
            const required = (response.data.data.requiredBooks || []).filter((b) => b?._id);
            const optional = (response.data.data.optionalBooks || []).filter((b) => b?._id);
            setBookCatalogs({ requiredBooks: required, optionalBooks: optional });

            if (selectedItemToAdd) {
                const allBooks = [...required, ...optional];
                const selectedBook = allBooks.find((b) => b._id === selectedItemToAdd);
                if (selectedBook) {
                    const price = selectedBook.bookType === 'common_price' ? selectedBook.commonPrice : selectedBook.classPrice;
                    setItemPrice(String(price ?? ''));
                }
            }
        } catch (err) {
            console.error('Error fetching book catalogs:', err);
            const errorMessage = err.response?.data?.message || 'Failed to load books for selected subtitle.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedSubtitle, selectedClass, selectedItemToAdd, showFlashMessage]);

    const handleBookSelection = useCallback((bookId) => {
        setSelectedItemToAdd(bookId);
        const allBooks = [...bookCatalogs.requiredBooks, ...bookCatalogs.optionalBooks];
        const selectedBook = allBooks.find(b => b._id === bookId);
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

    const fetchedToLocalFormat = useCallback(
        (items, type) => {
            return (items || []).map((item) => {
                if (type === 'book') {
                    let subtitleName = '';
                    if (item.book?.subtitle?.name) {
                        subtitleName = item.book.subtitle.name;
                    } else if (item.book?.subtitle && typeof item.book.subtitle === 'string') {
                        const foundSub = subtitles.find((s) => s._id === item.book.subtitle);
                        subtitleName = foundSub ? foundSub.name : `ID: ${item.book.subtitle}`;
                    }

                    return {
                        book: {
                            _id: item.book?._id || '',
                            bookName: item.book?.bookName || 'Unnamed Book',
                            subtitle: subtitleName,
                        },
                        quantity: item.quantity || 1,
                        price: item.price ?? null,
                        status: item.status || 'active',
                    };
                } else {
                    return {
                        item: {
                            _id: item.item?._id || '',
                            itemName: item.item?.itemName || 'Unnamed Stationery Item',
                        },
                        quantity: item.quantity || 1,
                        price: item.price || 0,
                        status: item.status || 'active',
                    };
                }
            });
        },
        [subtitles]
    );

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
                classes.forEach((cls) => {
                    const existingQuantity = fetchedQuantities.find((sq) => sq.classId === cls._id);
                    initialQuantities[cls._id] = existingQuantity ? String(existingQuantity.quantity) : '';
                });
                setEditedQuantities(initialQuantities);

                if (selectedClass) {
                    const classQuantity = fetchedQuantities.find((sq) => sq.classId === selectedClass);
                    setNoOfSets(classQuantity ? String(classQuantity.quantity) : '1');
                }
            } else {
                throw new Error(response.data.message || 'Failed to fetch set quantities.');
            }
        } catch (err) {
            console.error('Error fetching set quantities:', err);
            const errorMessage = err.response?.data?.message || 'Failed to fetch set quantities.';
            showFlashMessage(errorMessage, 'error');
            setEditedQuantities(classes.reduce((acc, cls) => ({ ...acc, [cls._id]: '' }), {}));
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
            const queryParams = new URLSearchParams({ customerId: selectedCustomer, classId: selectedClass });
            const response = await api.get(`/sets?${queryParams.toString()}`);

            if (response.data.status === 'success' && response.data.data.set) {
                const fetchedSet = response.data.data.set;
                setCurrentSetId(fetchedSet._id);
                setBooksDetail(fetchedToLocalFormat(fetchedSet.books, 'book'));
                setStationeryDetail(fetchedToLocalFormat(fetchedSet.stationeryItems, 'item'));
                setIsEditMode(true);
                showFlashMessage('Existing set loaded successfully!', 'success');
            }
            else {
                setCurrentSetId(null);
                setBooksDetail([]);
                setStationeryDetail([]);
                setIsEditMode(false);
            }

            await fetchSetQuantities();
        } catch (err) {
            console.error('Error fetching set details:', err);
            const errorMessage = err.response?.data?.message || 'Failed to fetch set details.';
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

    const handleQuantityChange = useCallback((classId, value) => {
        const quantity = value === '' ? '' : Math.max(0, parseInt(value) || 0);
        setEditedQuantities((prev) => ({ ...prev, [classId]: quantity }));
        if (classId === selectedClass) {
            setNoOfSets(quantity === '' ? '1' : String(quantity));
        }
    }, [selectedClass]);

    const handleEditQuantity = useCallback((classId, className) => {
        showFlashMessage(`Editing quantity for class ${className}.`, 'info');
        const input = document.querySelector(`input[value="${editedQuantities[classId] ?? ''}"]`);
        if (input) input.focus();
    }, [editedQuantities, showFlashMessage]);

    const handleDeleteQuantity = useCallback((classId, className) => {
        setQuantityToDelete({ classId, className });
        setShowDeleteQuantityModal(true);
    }, []);

    const confirmDeleteQuantity = useCallback(async () => {
        if (!quantityToDelete || !selectedCustomer) {
            showFlashMessage('No class selected for deletion or customer not selected.', 'error');
            setShowDeleteQuantityModal(false);
            setQuantityToDelete(null);
            return;
        }

        const { classId, className } = quantityToDelete;
        setLoading(true);
        try {
            const checkResponse = await api.get(`/sets/set-quantities/${selectedCustomer}`);
            const quantityExists = checkResponse.data.status === 'success' && checkResponse.data.data.setQuantities.some((q) => q.classId === classId);

            if (!quantityExists) {
                showFlashMessage(`No quantity found for class ${className}.`, 'warning');
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
            const errorMessage = err.response?.data?.message || `Failed to delete quantity for class ${className}.`;
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
            setShowDeleteQuantityModal(false);
            setQuantityToDelete(null);
        }
    }, [quantityToDelete, selectedCustomer, showFlashMessage, fetchSetQuantities]);

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
                    quantity: parseInt(quantity) || 0,
                }));

            if (classQuantities.length === 0) {
                showFlashMessage('No valid quantities to save.', 'warning');
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

    const handleDeleteSet = useCallback(async (setId) => {
        setLoading(true);
        try {
            const response = await api.delete(`/sets/${setId}`);
            if (response.status === 204) {
                showFlashMessage('Set deleted successfully!', 'success');
                resetForm();
            } else {
                throw new Error(response.data?.message || 'Failed to delete set.');
            }
        } catch (err) {
            console.error('Error deleting set:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete set.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [resetForm, showFlashMessage]);

    const confirmDeletion = useCallback(async () => {
        if (!itemToDelete || !currentSetId) {
            showFlashMessage('No item selected for deletion or set not loaded.', 'error');
            setShowConfirmModal(false);
            setItemToDelete(null);
            return;
        }

        setItemLoading(true);
        try {
            const { id, type } = itemToDelete;
            const response = await api.patch(`/sets/${currentSetId}/removeItem`, { itemId: id, itemType: type });

            if (response.data.status === 'success') {
                if (type === 'book') {
                    setBooksDetail((prev) => prev.filter((item) => item.book._id !== id));
                } else {
                    setStationeryDetail((prev) => prev.filter((item) => item.item._id !== id));
                }
                showFlashMessage(`${itemToDelete.name} removed from set!`, 'success');

                if (booksDetail.length === 1 && type === 'book' || stationeryDetail.length === 1 && type === 'stationery') {
                    handleDeleteSet(currentSetId);
                }
            } else {
                throw new Error(response.data.message || `Failed to remove ${type}.`);
            }
        } catch (err) {
            console.error('Error deleting item:', err);
            const errorMessage = err.response?.data?.message || `Failed to remove ${itemToDelete.name}.`;
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setItemLoading(false);
            setShowConfirmModal(false);
            setItemToDelete(null);
        }
    }, [itemToDelete, currentSetId, booksDetail, stationeryDetail, showFlashMessage, handleDeleteSet]);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    useEffect(() => {
        if (selectedCustomer && selectedClass) {
            fetchSetDetails();
        }
    }, [selectedCustomer, selectedClass, fetchSetDetails]);

    useEffect(() => {
        if (selectedItemToAdd && !editingItemId) {
            if (selectedItemType === 'stationery') {
                const itemInfo = stationeryItemsMaster.find((item) => item._id === selectedItemToAdd);
                if (itemInfo) {
                    setItemQuantity('1');
                    setItemPrice(String(itemInfo.price || '0'));
                }
            } else if (selectedItemType === 'books') {
                const bookInfo = [...bookCatalogs.requiredBooks, ...bookCatalogs.optionalBooks].find((book) => book._id === selectedItemToAdd);
                if (bookInfo) {
                    setItemQuantity('1');
                    const price = bookInfo.bookType === 'common_price' ? bookInfo.commonPrice : bookInfo.classPrice;
                    setItemPrice(String(price ?? '0'));
                }
            }
        } else if (!selectedItemToAdd) {
            setItemQuantity('');
            setItemPrice('');
        }
    }, [selectedItemType, selectedItemToAdd, stationeryItemsMaster, bookCatalogs, editingItemId]);

    const handleAddOrUpdateItem = useCallback(async () => {
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
            showFlashMessage('Please provide a price for the book.', 'warning');
            return;
        }
        if (selectedItemType === 'stationery' && (!itemPrice || Number(itemPrice) <= 0)) {
            showFlashMessage('Please provide a valid price for the stationery item.', 'error');
            return;
        }

        if (selectedItemType === 'books' && !editingItemId && booksDetail.some((item) => item.book._id === selectedItemToAdd)) {
            showFlashMessage('This book is already added to the set.', 'warning');
            return;
        }

        const price = itemPrice ? Number(itemPrice) : null;
        setItemLoading(true);

        try {
            if (editingItemId) {
                if (selectedItemType === 'books') {
                    setBooksDetail((prev) =>
                        prev.map((item) => (item.book._id === editingItemId ? { ...item, quantity, price } : item))
                    );
                } else {
                    setStationeryDetail((prev) =>
                        prev.map((item) => (item.item._id === editingItemId ? { ...item, quantity, price } : item))
                    );
                }
                showFlashMessage('Item updated successfully.', 'success');
            } else {
                if (selectedItemType === 'books') {
                    const book = [...bookCatalogs.requiredBooks, ...bookCatalogs.optionalBooks].find((b) => b._id === selectedItemToAdd);
                    if (book) {
                        setBooksDetail((prev) => [
                            ...prev,
                            {
                                book: {
                                    _id: selectedItemToAdd,
                                    bookName: book.bookName,
                                    subtitle: subtitles.find((s) => s._id === selectedSubtitle)?.name || '',
                                },
                                quantity,
                                price,
                                status: 'active',
                            },
                        ]);
                    }
                } else {
                    const item = stationeryItemsMaster.find((i) => i._id === selectedItemToAdd);
                    if (item) {
                        setStationeryDetail((prev) => [
                            ...prev,
                            {
                                item: { _id: selectedItemToAdd, itemName: item.itemName },
                                quantity,
                                price,
                                status: 'active',
                            },
                        ]);
                    }
                }
                showFlashMessage('Item added successfully.', 'success');
            }

            const payload = {
                customer: selectedCustomer,
                class: selectedClass,
                books: booksDetail.map((b) => ({
                    book: b.book._id,
                    quantity: b.quantity,
                    price: b.price,
                    status: b.status,
                })),
                stationeryItems: stationeryDetail.map((s) => ({
                    item: s.item._id,
                    quantity: s.quantity,
                    price: s.price,
                    status: s.status,
                })),
                quantity: Number(noOfSets) || 1,
            };

            if (selectedItemType === 'books') {
                const existingBookIndex = payload.books.findIndex((b) => b.book === selectedItemToAdd);
                if (existingBookIndex !== -1 && editingItemId) {
                    payload.books[existingBookIndex] = { book: selectedItemToAdd, quantity, price, status: 'active' };
                } else if (existingBookIndex === -1) {
                    payload.books.push({ book: selectedItemToAdd, quantity, price, status: 'active' });
                }
            } else {
                const existingStationeryIndex = payload.stationeryItems.findIndex((s) => s.item === selectedItemToAdd);
                if (existingStationeryIndex !== -1 && editingItemId) {
                    payload.stationeryItems[existingStationeryIndex] = { item: selectedItemToAdd, quantity, price, status: 'active' };
                } else {
                    payload.stationeryItems.push({ item: selectedItemToAdd, quantity, price, status: 'active' });
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
            setItemLoading(false);
        }
    }, [
        selectedItemType,
        selectedItemToAdd,
        itemQuantity,
        itemPrice,
        bookCatalogs,
        stationeryItemsMaster,
        editingItemId,
        showFlashMessage,
        selectedSubtitle,
        subtitles,
        selectedCustomer,
        selectedClass,
        booksDetail,
        stationeryDetail,
        noOfSets,
        currentSetId,
        fetchedToLocalFormat,
    ]);

    const handleDeleteBook = useCallback((bookId, bookName) => {
        if (!currentSetId) {
            setBooksDetail((prev) => prev.filter((item) => item.book._id !== bookId));
            showFlashMessage('Book removed from list (not yet saved).', 'info');
            return;
        }
        setItemToDelete({ id: bookId, type: 'book', name: bookName });
        setShowConfirmModal(true);
    }, [currentSetId, showFlashMessage]);

    const handleDeleteStationery = useCallback((itemId, itemName) => {
        if (!currentSetId) {
            setStationeryDetail((prev) => prev.filter((item) => item.item._id !== itemId));
            showFlashMessage('Stationery item removed from list (not yet saved).', 'info');
            return;
        }
        setItemToDelete({ id: itemId, type: 'stationery', name: itemName });
        setShowConfirmModal(true);
    }, [currentSetId, showFlashMessage]);

    const handleEditBook = useCallback(
        (bookItem) => {
            const foundSubtitle = subtitles.find((s) => s.name === bookItem.book.subtitle);
            const subtitleIdToSet = foundSubtitle ? foundSubtitle._id : '';
            setSelectedItemType('books');
            setSelectedSubtitle(subtitleIdToSet);
            setSelectedItemToAdd(bookItem.book._id);
            setItemQuantity(String(bookItem.quantity));
            setItemPrice(String(bookItem.price ?? ''));
            setEditingItemType('book');
            setEditingItemId(bookItem.book._id);
            setShowAllBooksForSubtitle(true);
            showFlashMessage('Book loaded for editing.', 'info');
        },
        [subtitles, showFlashMessage]
    );

    const handleEditStationery = useCallback((stationeryItem) => {
        setSelectedItemType('stationery');
        setSelectedSubtitle('');
        setSelectedItemToAdd(stationeryItem.item._id);
        setItemQuantity(String(stationeryItem.quantity));
        setItemPrice(String(stationeryItem.price));
        setEditingItemType('stationery');
        setEditingItemId(stationeryItem.item._id);
        setShowAllStationery(true);
        setSelectedStationeryCategories(new Set(stationeryCategories));
        showFlashMessage('Stationery item loaded for editing.', 'info');
    }, [stationeryCategories, showFlashMessage]);

    const handleSaveSet = useCallback(async () => {
        if (!selectedCustomer || !selectedClass) {
            showFlashMessage('Please select School Name and Class.', 'error');
            return;
        }

        if (booksDetail.length === 0 && stationeryDetail.length === 0) {
            if (isEditMode && currentSetId) {
                handleDeleteSet(currentSetId);
                return;
            } else {
                showFlashMessage('Cannot save an empty set.', 'error');
                return;
            }
        }

        setLoading(true);
        const payload = {
            customer: selectedCustomer,
            class: selectedClass,
            books: booksDetail.map((item) => ({
                book: item.book._id,
                quantity: item.quantity,
                price: item.price,
                status: item.status,
            })),
            stationeryItems: stationeryDetail.map((item) => ({
                item: item.item._id,
                quantity: item.quantity,
                price: item.price,
                status: item.status,
            })),
        };

        try {
            let response;
            if (isEditMode && currentSetId) {
                response = await api.patch(`/sets/${currentSetId}`, payload);
            } else {
                response = await api.post('/sets', payload);
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
            const errorMessage = err.response?.data?.message || 'Failed to save set.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedCustomer, selectedClass, booksDetail, stationeryDetail, isEditMode, currentSetId, showFlashMessage, saveSetQuantities, fetchSetDetails, handleDeleteSet]);

    const handleCopySet = useCallback(async () => {
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
                copyStationery,
            };

            const response = await api.post('/sets/copy', payload);
            if (response.data.status === 'success') {
                showFlashMessage('Set copied successfully! Some book prices may be unset.', 'success');
                setSelectedClass(copyToClass);
                setCopyToClass('');
                setCopyStationery(false);
                await fetchSetDetails();
                const updatedSet = response.data.data.set;
                if (updatedSet.books.some((book) => book.price == null)) {
                    showFlashMessage('Some books have unset prices. Please update them.', 'warning');
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
    }, [currentSetId, copyToClass, selectedCustomer, copyStationery, showFlashMessage, fetchSetDetails]);

    const handleDownload = useCallback(
        (type) => {
            setShowDownloadDropdown(false);

            if (!window.jspdf || !window.jspdf.jsPDF) {
                showFlashMessage('PDF generation library not loaded.', 'error');
                console.error('PDF generation failed: jsPDF not available.');
                return;
            }

            const doc = new window.jspdf.jsPDF('portrait', 'mm', 'a4');

            if (!doc.autoTable) {
                showFlashMessage('PDF table plugin not loaded.', 'error');
                console.error('PDF generation failed: autoTable not available.');
                return;
            }

            const customerName = customers.find((c) => c._id === selectedCustomer)?.customerName || 'Unknown School';
            const className = classes.find((c) => c._id === selectedClass)?.name || 'Unknown Class';
            let finalFilename = '';
            let finalTitle = '';

            const companyName = 'GOOD LUCK BOOK STORE';
            const companyAddress = 'Shop NO. 2, Shriji Tower, Ashoka Garden, Bhopal';
            const companyMobile = 'Mobile Number: 7024136476';
            const companyGST = 'GST NO: 23EAVPP3772F1Z8';

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
                const companyTextStartX = img ? marginX + imgWidth + textOffsetFromLogo : marginX;
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

                const maxHeaderY = Math.max(img ? marginY + imgHeight : marginY, currentCompanyTextY);

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
                    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], valign: 'middle', halign: 'left' },
                    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', valign: 'middle', lineWidth: 0.1, lineColor: [200, 200, 200] },
                    bodyStyles: { lineWidth: 0.1, lineColor: [200, 200, 200] },
                    didParseCell: (data) => {
                        if (data.section === 'body') {
                            data.cell.styles.fillColor = data.row.index % 2 === 0 ? [240, 248, 255] : [255, 255, 255];
                        }
                    },
                    columnStyles: { 0: { cellWidth: 15, halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
                    margin: { top: 10, right: 14, bottom: 10, left: 14 },
                    didDrawPage: (data) => {
                        const str = `Page ${docInstance.internal.getNumberOfPages()}`;
                        docInstance.setFontSize(8);
                        docInstance.text(str, data.settings.margin.left, docInstance.internal.pageSize.height - 10);
                    },
                });
                return docInstance.autoTable.previous.finalY + 10;
            };

            const generateBooksData = () => {
                let totalQty = 0;
                let totalAmt = 0;
                const tableColumn = ['S.No.', 'Sub Title', 'Book', 'QTY', 'Price', 'Total'];
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
                        item.price != null ? `Rs.${item.price}` : 'N/A',
                        item.price != null ? `Rs.${itemTotal}` : 'N/A',
                    ]);
                });
                tableRows.push(['', '', 'Total QTY/Amount', totalQty, '', `Rs.${totalAmt}`]);
                return { columns: tableColumn, rows: tableRows };
            };

            const generateStationeryData = () => {
                let totalQty = 0;
                let totalAmt = 0;
                const tableColumn = ['S.No.', 'Item', 'QTY', 'Price', 'Total'];
                const tableRows = [];
                stationeryDetail.forEach((item, index) => {
                    const itemTotal = item.quantity * item.price;
                    totalQty += item.quantity;
                    totalAmt += itemTotal;
                    tableRows.push([index + 1, getStringValue(item.item.itemName), item.quantity, `Rs.${item.price}`, `Rs.${itemTotal}`]);
                });
                tableRows.push(['', 'Total QTY/Amount', totalQty, '', `Rs.${totalAmt}`]);
                return { columns: tableColumn, rows: tableRows };
            };

            const generatePdfContent = (docInstance, img, imgWidth, imgHeight) => {
                let currentY;

                if (type === 'books' || type === 'both') {
                    if (booksDetail.length > 0) {
                        finalTitle = `${customerName} - ${className} Class`;
                        currentY = addHeaderAndSetStartY(docInstance, finalTitle, img, imgWidth, imgHeight);
                        const { columns, rows } = generateBooksData();
                        currentY = addTableToDoc(docInstance, 'Books Detail', columns, rows, currentY);
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
                        } else if (booksDetail.length > 0 && currentY > docInstance.internal.pageSize.height - 50) {
                            docInstance.addPage();
                            currentY = addHeaderAndSetStartY(docInstance, `Stationery Item Detail for ${customerName} - ${className}`, img, imgWidth, imgHeight);
                        } else if (booksDetail.length === 0) {
                            currentY = addHeaderAndSetStartY(docInstance, `Stationery Item Detail for ${customerName} - ${className}`, img, imgWidth, imgHeight);
                        }
                        const { columns, rows } = generateStationeryData();
                        addTableToDoc(docInstance, 'Stationery Item Detail', columns, rows, currentY);
                    } else if (type === 'stationery') {
                        showFlashMessage('No stationery items to download.', 'warning');
                        return;
                    }
                }

                if (type === 'both' && booksDetail.length === 0 && stationeryDetail.length === 0) {
                    showFlashMessage('No books or stationery items to download.', 'warning');
                    return;
                }

                finalFilename =
                    type === 'both'
                        ? `Complete_Set_Detail_${customerName.replace(/\s/g, '_')}_${className.replace(/\s/g, '_')}.pdf`
                        : type === 'books'
                            ? `Books_Detail_${customerName.replace(/\s/g, '_')}_${className.replace(/\s/g, '_')}.pdf`
                            : `Stationery_Detail_${customerName.replace(/\s/g, '_')}_${className.replace(/\s/g, '_')}.pdf`;

                docInstance.save(finalFilename);
                showFlashMessage(`${finalTitle} downloaded as PDF!`, 'success');
            };

            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const imgWidth = 25;
                const imgHeight = (img.height * imgWidth) / img.width;
                generatePdfContent(doc, img, imgWidth, imgHeight);
            };
            img.onerror = () => {
                console.warn('Logo image could not be loaded. Generating PDF without logo.');
                generatePdfContent(doc, null, 0, 0);
            };
            img.src = companyLogo;
        },
        [booksDetail, stationeryDetail, customers, selectedCustomer, classes, selectedClass, showFlashMessage]
    );

    const itemDropdownOptions = useMemo(() => {
        if (selectedItemType === 'stationery') {
            if (showAllStationery) {
                return stationeryItemsMaster;
            }
            if (selectedStationeryCategories.size > 0) {
                return stationeryItemsMaster.filter((item) => selectedStationeryCategories.has(item.category));
            }
            return [];
        }
        if (selectedItemType === 'books' && selectedSubtitle) {
            const allBooks = [...bookCatalogs.requiredBooks, ...bookCatalogs.optionalBooks];
            if (isEditMode && !showAllBooksForSubtitle) {
                const selectedSubtitleObj = subtitles.find((s) => s._id === selectedSubtitle);
                const selectedSubtitleName = selectedSubtitleObj ? selectedSubtitleObj.name : null;
                if (!selectedSubtitleName) return [];

                const booksInCurrentSet = booksDetail
                    .filter((item) => item.book.subtitle === selectedSubtitleName)
                    .map((item) => ({
                        _id: item.book._id,
                        bookName: item.book.bookName,
                        price: item.price,
                    }));

                if (editingItemType === 'book' && editingItemId) {
                    const currentBook = allBooks.find((book) => book._id === editingItemId);
                    if (currentBook && !booksInCurrentSet.some((b) => b._id === currentBook._id)) {
                        booksInCurrentSet.push({
                            _id: currentBook._id,
                            bookName: currentBook.bookName,
                            price: currentBook.commonPrice || currentBook.classPrice,
                        });
                    }
                }
                return booksInCurrentSet;
            }
            return allBooks.map((book) => ({
                ...book,
                price: book.bookType === 'common_price' ? book.commonPrice : book.classPrice,
            }));
        }
        return [];
    }, [
        selectedItemType,
        selectedSubtitle,
        isEditMode,
        showAllBooksForSubtitle,
        showAllStationery,
        selectedStationeryCategories,
        stationeryItemsMaster,
        booksDetail,
        bookCatalogs,
        subtitles,
        editingItemType,
        editingItemId,
    ]);

    const isFormDisabled = !selectedCustomer;
    const isAddItemFormDisabled = !selectedCustomer || !selectedClass;
    const isAddItemButtonDisabled = isAddItemFormDisabled || !selectedItemToAdd || itemQuantity === '' || (selectedItemType === 'books' && !selectedSubtitle);
    const isSaveSetDisabled = (!booksDetail.length && !stationeryDetail.length && !currentSetId) || !selectedCustomer || !selectedClass;
    const availableClassesForCopy = useMemo(() => classes.filter((cls) => !existingSetsClasses.has(cls._id)), [classes, existingSetsClasses]);
    const isCopySetButtonDisabled = !currentSetId || !selectedCustomer || !copyToClass || availableClassesForCopy.length === 0;

    const handleCategoryChange = useCallback((category) => {
        setSelectedStationeryCategories((prev) => {
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
    }, []);

    const handleShowAllStationeryChange = useCallback((e) => {
        const isChecked = e.target.checked;
        setShowAllStationery(isChecked);
        setSelectedItemToAdd('');
        setSelectedStationeryCategories(isChecked ? new Set(stationeryCategories) : new Set());
    }, [stationeryCategories]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target)) {
                setShowDownloadDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Split books into required and optional before rendering ---
    const optionalBooksDetail = booksDetail.filter(
        (item) => bookCatalogs.optionalBooks.some((ob) => ob._id === item.book._id)
    );
    const requiredBooksDetail = booksDetail.filter(
        (item) => bookCatalogs.requiredBooks.some((rb) => rb._id === item.book._id)
    );

    // Grand totals based on the 3 tables
    const grandTotalItems =
        requiredBooksDetail.length +
        optionalBooksDetail.length +
        stationeryDetail.length;

    const grandTotalQty =
        requiredBooksDetail.reduce((sum, item) => sum + item.quantity, 0) +
        optionalBooksDetail.reduce((sum, item) => sum + item.quantity, 0) +
        stationeryDetail.reduce((sum, item) => sum + item.quantity, 0);

    const grandTotalPrice =
        requiredBooksDetail.reduce((sum, item) => sum + (item.quantity * (item.price ?? 0)), 0) +
        optionalBooksDetail.reduce((sum, item) => sum + (item.quantity * (item.price ?? 0)), 0) +
        stationeryDetail.reduce((sum, item) => sum + (item.quantity * (item.price ?? 0)), 0);


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
                        <div className="form-grid-2x2">
                            <div className="form-group">
                                <label htmlFor="customer-select" className="form-label">School Name:</label>
                                <select
                                    id="customer-select"
                                    value={selectedCustomer}
                                    onChange={(e) => {
                                        setSelectedCustomer(e.target.value);
                                        setSelectedClass('');
                                        setCurrentSetId(null);
                                        setBooksDetail([]);
                                        setStationeryDetail([]);
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
                                    aria-label="Select School"
                                >
                                    <option value="">-- Select --</option>
                                    {customers.map((customer) => (
                                        <option key={customer._id} value={customer._id}>
                                            {customer.customerName} {customer.schoolCode ? `(${customer.schoolCode})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Add Quantities in Class:</label>
                                <button
                                    onClick={() => setShowQuantityModal(true)}
                                    className="btn-primary"
                                    disabled={loading || !selectedCustomer}
                                    aria-label="Manage Set Quantities"
                                >
                                    <FaEdit className="btn-icon-mr" /> Set Quantity
                                </button>
                            </div>

                            <div className="form-group">
                                <label htmlFor="class-select" className="form-label">Class:</label>
                                <select
                                    id="class-select"
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    disabled={isFormDisabled || classes.length === 0}
                                    className="form-select"
                                    aria-label="Select Class"
                                >
                                    <option value="">-- Select --</option>
                                    {classes.map((cls) => (
                                        <option key={cls._id} value={cls._id}>
                                            {cls.name}
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
                                        const value = e.target.value === '' ? '' : Math.max(1, Number(e.target.value) || 1);
                                        setNoOfSets(value);
                                        if (selectedClass) handleQuantityChange(selectedClass, value);
                                    }}
                                    onBlur={() => {
                                        if (noOfSets === '' || Number(noOfSets) < 1) {
                                            setNoOfSets('1');
                                            if (selectedClass) handleQuantityChange(selectedClass, '1');
                                        }
                                    }}
                                    min="1"
                                    disabled={true}
                                    className="form-input"
                                    aria-label="Number of Sets"
                                />
                            </div>
                        </div>
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
                                        aria-label="Select Books"
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
                                        aria-label="Select Stationery"
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
                                    disabled={isAddItemFormDisabled || subtitles.length === 0}
                                    className="form-select"
                                    aria-label="Select Subtitle"
                                >
                                    <option value="">-- Select --</option>
                                    {subtitles.map((subtitle) => (
                                        <option key={subtitle._id} value={subtitle._id}>
                                            {subtitle.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {selectedItemType === 'stationery' && (
                            <div className="form-group">
                                <label className="form-label">Filter by Category:</label>
                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    {stationeryCategories.length > 0 ? (
                                        stationeryCategories.map((category) => (
                                            <div key={category} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`category-checkbox-${category}`}
                                                    value={category}
                                                    checked={selectedStationeryCategories.has(category)}
                                                    onChange={() => handleCategoryChange(category)}
                                                    disabled={isAddItemFormDisabled || loading}
                                                    className="checkbox-input"
                                                    aria-label={`Filter by ${category}`}
                                                />
                                                <label htmlFor={`category-checkbox-${category}`} className="ml-2 form-label">{category}</label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No categories found.</p>
                                    )}
                                </div>
                                <div className="checkbox-group mt-2">
                                    <input
                                        type="checkbox"
                                        id="show-all-stationery-checkbox"
                                        checked={showAllStationery}
                                        onChange={handleShowAllStationeryChange}
                                        disabled={isAddItemFormDisabled || loading}
                                        className="checkbox-input"
                                        aria-label="Show all stationery items"
                                    />
                                    <label htmlFor="show-all-stationery-checkbox" className="checkbox-label">Show all stationery items</label>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="item-select" className="form-label">
                                {selectedItemType === 'stationery' ? 'Stationery Item:' : 'Book:'}
                            </label>
                            <select
                                id="item-select"
                                value={selectedItemToAdd}
                                onChange={(e) => handleBookSelection(e.target.value)}
                                disabled={isAddItemFormDisabled || (selectedItemType === 'books' && !selectedSubtitle) || itemDropdownOptions.length === 0}
                                className="form-select"
                                aria-label={`Select ${selectedItemType === 'stationery' ? 'Stationery Item' : 'Book'}`}
                            >
                                <option value="">-- Select --</option>
                                {selectedItemType === 'books' ? (
                                    <>
                                        {bookCatalogs.requiredBooks.length > 0 && (
                                            <optgroup label="Required Books">
                                                {bookCatalogs.requiredBooks.map((book) => (
                                                    <option key={book._id} value={book._id}>
                                                        {book.bookName} ({book.language?.name || 'N/A'})
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {bookCatalogs.optionalBooks.length > 0 && (
                                            <optgroup label="Optional Books">
                                                {bookCatalogs.optionalBooks.map((book) => (
                                                    <option key={book._id} value={book._id}>
                                                        {book.bookName} ({book.language?.name || 'N/A'})
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </>
                                ) : (
                                    itemDropdownOptions.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.itemName}
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
                                    aria-label="Show all books for subtitle"
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
                                        if (!itemQuantity || Number(itemQuantity) < 1) setItemQuantity('1');
                                    }}
                                    min="1"
                                    disabled={isAddItemFormDisabled || !selectedItemToAdd || loading}
                                    className="form-input"
                                    aria-label="Order Quantity"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="item-price" className="form-label">Price:</label>
                                <input
                                    type="number"
                                    id="item-price"
                                    value={itemPrice}
                                    onChange={(e) => setItemPrice(String(Math.max(0, Number(e.target.value) || 0)))}
                                    min="0"
                                    disabled={isAddItemFormDisabled || !selectedItemToAdd || loading}
                                    className="form-input"
                                    aria-label="Item Price"
                                />
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handleAddOrUpdateItem}
                                disabled={isAddItemButtonDisabled || itemLoading}
                                className="btn-success"
                                aria-label={editingItemId ? 'Update Item' : 'Add Item'}
                            >
                                {itemLoading ? <FaSpinner className="btn-icon-mr animate-spin" /> : <FaPlusCircle className="btn-icon-mr" />}
                                {editingItemId ? 'Update Item' : 'Add Item'}
                            </button>
                        </div>
                    </section>

                    <section className="section-container">
                        <h2 className="section-header1">Copy Set</h2>
                        <div className="form-grid-left-right">
                            <div className="form-left">
                                <div className="form-group">
                                    <label htmlFor="copy-to-class" className="form-label">Copy To Class:</label>
                                    <select
                                        id="copy-to-class"
                                        value={copyToClass}
                                        onChange={(e) => setCopyToClass(e.target.value)}
                                        disabled={loading || availableClassesForCopy.length === 0 || !selectedCustomer}
                                        className="form-select"
                                        aria-label="Select Class to Copy To"
                                    >
                                        <option value="">-- Select --</option>
                                        {availableClassesForCopy.length === 0 ? (
                                            <option value="" disabled>No available classes</option>
                                        ) : (
                                            availableClassesForCopy.map((cls) => (
                                                <option key={cls._id} value={cls._id}>
                                                    {cls.name}
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
                                        aria-label="Copy Stationery Items"
                                    />
                                    <label htmlFor="copy-stationery-checkbox" className="checkbox-label">Copy stationery also</label>
                                </div>
                            </div>
                            <div className="form-right">
                                <button
                                    onClick={handleCopySet}
                                    disabled={isCopySetButtonDisabled || loading}
                                    className="btn-purple"
                                    aria-label="Copy Set"
                                >
                                    <FaCopy className="btn-icon-mr" /> Copy Set
                                </button>
                            </div>
                        </div>
                    </section>

                    <div className="flex gap-4">
                        <button
                            onClick={handleSaveSet}
                            disabled={isSaveSetDisabled || loading}
                            className="w-1/2 btn-blue"
                            aria-label={isEditMode ? 'Update Set' : 'Save Set'}
                        >
                            {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : (isEditMode ? 'Update Set' : 'Save Set')}
                        </button>
                        <button
                            onClick={resetForm}
                            disabled={loading}
                            className="w-1/2 btn-secondary"
                            aria-label="Create New Set"
                        >
                            New Set
                        </button>
                    </div>
                </div>

                <div className="right-panel">
                    <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200">
                        <h2 className="section-header"></h2>
                        <div className="relative" ref={downloadDropdownRef}>
                            <button
                                onClick={() => setShowDownloadDropdown((prev) => !prev)}
                                className="btn-download"
                                disabled={(booksDetail.length === 0 && stationeryDetail.length === 0) || loading}
                                aria-label="Download Options"
                            >
                                <FaDownload className="btn-download-icon-mr" /> Download <FaCaretDown className="ml-2" />
                            </button>
                            {showDownloadDropdown && (
                                <div className="download-dropdown-menu">
                                    <button onClick={() => handleDownload('books')} disabled={booksDetail.length === 0}>
                                        Only Books
                                    </button>
                                    <button onClick={() => handleDownload('stationery')} disabled={stationeryDetail.length === 0}>
                                        Only Stationery
                                    </button>
                                    <button onClick={() => handleDownload('both')} disabled={booksDetail.length === 0 && stationeryDetail.length === 0}>
                                        Both/Complete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <section className="section-container">
                        <header className="moved-header-container">
                            <h1 className="moved-header-title"></h1>
                            <div className="moved-header-totals">
                                <div className="total-item">Items: {grandTotalItems}</div>
                                <div className="total-item1">Total Price: Rs.{grandTotalPrice.toFixed(2)}</div>
                                <div className="total-item">Qty: {grandTotalQty}</div>
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
                                        {(requiredBooksDetail || []).length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center">No required books added yet.</td>
                                            </tr>
                                        ) : (
                                            requiredBooksDetail.map((item, index) => (
                                                <tr key={item.book._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                                                    <td className="table-cell whitespace-nowrap font-medium">{index + 1}</td>
                                                    <td className="table-cell whitespace-nowrap">{getStringValue(item.book.subtitle)}</td>
                                                    <td className="table-cell whitespace-normal">{getStringValue(item.book.bookName)}</td>
                                                    <td className="table-cell whitespace-nowrap">{item.quantity}</td>
                                                    <td className="table-cell whitespace-nowrap">
                                                        {item.price != null ? `Rs.${item.price}` : 'N/A'}
                                                    </td>
                                                    <td className="table-cell whitespace-nowrap">
                                                        {item.price != null ? `Rs.${(item.quantity * item.price)}` : 'N/A'}
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
                                            <td colSpan="3" className="table-footer-cell text-right">Total QTY/Amount</td>
                                            <td className="table-footer-cell text-left">
                                                {requiredBooksDetail.reduce((sum, item) => sum + item.quantity, 0)}
                                            </td>
                                            <td colSpan="2" className="table-footer-cell text-left">
                                                Rs.{requiredBooksDetail.reduce((sum, item) => sum + (item.quantity * (item.price ?? 0)), 0).toFixed(2)}
                                            </td>
                                            <td className="table-footer-cell"></td>
                                        </tr>
                                    </tfoot>

                                </table>
                            </div>
                            <div className="table-container mt-6">
                                <h2 className="section-header">Optional Books Details</h2>
                                <table className="app-table">
                                    <thead className="table-header-group">
                                        <tr>
                                            <th>No.</th>
                                            <th>Subtitle</th>
                                            <th>Book Name</th>
                                            <th>QTY</th>
                                            <th>Price</th>
                                            <th>Total</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {optionalBooksDetail.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center">No optional books added yet.</td>
                                            </tr>
                                        ) : (
                                            optionalBooksDetail.map((item, index) => (
                                                <tr key={item.book._id}>
                                                    <td>{index + 1}</td>
                                                    <td>{item.book.subtitle}</td>
                                                    <td>{item.book.bookName}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>Rs.{item.price}</td>
                                                    <td>Rs.{item.quantity * item.price}</td>
                                                    <td>
                                                        <button onClick={() => handleEditBook(item)} className="table-action-btn edit-btn"><FaEdit /></button>
                                                        <button onClick={() => handleDeleteBook(item.book._id, item.book.bookName)} className="table-action-btn delete-btn"><FaTrashAlt /></button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="table-footer-row">
                                            <td colSpan="3" className="table-footer-cell text-right">Total QTY/Amount</td>
                                            <td className="table-footer-cell text-left">
                                                {optionalBooksDetail.reduce((sum, item) => sum + item.quantity, 0)}
                                            </td>
                                            <td colSpan="2" className="table-footer-cell text-left">
                                                Rs.{optionalBooksDetail.reduce((sum, item) => sum + (item.quantity * (item.price ?? 0)), 0).toFixed(2)}
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
                                        {stationeryDetail.length === 0 ? (
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
                                                            disabled={loading || itemLoading}
                                                            aria-label={`Edit ${item.item.itemName}`}
                                                        >
                                                            <FaEdit className="table-action-icon" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteStationery(item.item._id, item.item.itemName)}
                                                            className="table-action-btn delete-btn"
                                                            title="Delete Stationery Item"
                                                            disabled={loading || itemLoading}
                                                            aria-label={`Delete ${item.item.itemName}`}
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
                                                Rs.{stationeryDetail.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)}
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
                        <p className="modal-message">Are you sure you want to delete {itemToDelete?.name || 'this item'} from the set?</p>
                        <div className="modal-buttons">
                            <button
                                onClick={confirmDeletion}
                                disabled={loading || itemLoading}
                                className="btn-danger"
                                aria-label="Confirm Deletion"
                            >
                                {itemLoading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Confirm'}
                            </button>

                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setItemToDelete(null);
                                }}
                                disabled={loading || itemLoading}
                                className="btn-secondary"
                                aria-label="Cancel Deletion"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}


{showQuantityModal && (
  <div
    className="modal-overlay"
    onClick={() => {
      setShowQuantityModal(false);
      setEditedQuantities({});
      setSetQuantities([]);
    }}
  >
    <div
      className="modal-content modal-content-wide"
      onClick={(e) => e.stopPropagation()} // prevent inside clicks from closing
    >
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
                                {loading ? <FaSpinner className="btn-icon-mr animate-spin" /> : 'Save '}
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
  <div
    className="modal-overlay"
    onClick={() => {
      setShowDeleteQuantityModal(false);
      setQuantityToDelete(null);
    }}
  >
    <div
      className="modal-content"
      onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
    >
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