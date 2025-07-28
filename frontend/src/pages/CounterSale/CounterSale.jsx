// src/pages/CounterSale/CounterSale.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from '../../utils/api'; 
import { toast } from 'sonner'; 
import { FaArrowLeft, FaPlus, FaMinus, FaTrash, FaRupeeSign, FaShoppingCart, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa'; 

import './styles/CounterSale.css';

const CounterSale = ({ showFlashMessage }) => {
    const navigate = useNavigate(); 

    // --- State Variables ---
    const [currentPage, setCurrentPage] = useState('customerSelection'); 
    const [customers, setCustomers] = useState([]); 
    const [selectedCustomer, setSelectedCustomer] = useState(null); 
    const [customerSearch, setCustomerSearch] = useState(''); 
    const [filteredCustomers, setFilteredCustomers] = useState([]); 

    const [classesForCustomer, setClassesForCustomer] = useState([]); 
    const [selectedClass, setSelectedClass] = useState(null); 

    const [setsForClass, setSetsForClass] = useState([]); 
    const [selectedSetsInCart, setSelectedSetsInCart] = useState([]); 

    const [totalBillAmount, setTotalBillAmount] = useState(0); 
    const [billNo, setBillNo] = useState(''); 
    const [billDate, setBillDate] = useState(''); 

    const [paymentMethod, setPaymentMethod] = useState('cash'); 
    const [amountReceived, setAmountReceived] = useState(''); 
    const [customerNameInModal, setCustomerNameInModal] = useState(''); 
    const [customerMobileInModal, setCustomerMobileInModal] = useState(''); 
    const [showPaymentModal, setShowPaymentModal] = useState(false); 

    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);

    const [currentBranchId, setCurrentBranchId] = useState(null); 

    // --- Fetch Current Branch ID (on component mount) ---
    useEffect(() => {
        const fetchBranchId = async () => {
            try {
                const userDetailsResponse = await api.get('/auth/me');
                if (userDetailsResponse.data.status === 'success' && userDetailsResponse.data.data.user) {
                    setCurrentBranchId(userDetailsResponse.data.data.user.branchId);
                } else {
                    showFlashMessage('Branch ID fetch nahin kar paye. Customer data load nahin hoga.', 'error');
                }
            } catch (err) {
                console.error('Error fetching branch ID:', err);
                showFlashMessage('Branch ID fetch karne mein error.', 'error');
            }
        };
        fetchBranchId();
    }, [showFlashMessage]);

    // --- Fetch Customers (Branch-wise) ---
    const fetchCustomers = useCallback(async () => {
        if (!currentBranchId) return; 

        setLoading(true);
        setLocalError(null);
        try {
            // Actual API call to fetch customers for the current branch
            const response = await api.get(`/customers?branch=${currentBranchId}`);
            
            if (response.data.status === 'success' && Array.isArray(response.data.data)) { // Ensure data is an array
                setCustomers(response.data.data);
                setFilteredCustomers(response.data.data); 
                showFlashMessage('Customers successfully load ho gaye.', 'success');
            } else {
                setCustomers([]);
                setFilteredCustomers([]); 
                showFlashMessage(response.data.message || 'Is branch ke liye koi customers nahin mile.', 'info');
            }
        } catch (err) {
            console.error('Customers fetch karne mein error:', err);
            const errorMessage = err.response?.data?.message || 'Customers load nahin ho paye.';
            setLocalError(errorMessage);
            setCustomers([]); 
            setFilteredCustomers([]); 
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage, currentBranchId]);

    // --- Fetch Classes for a Customer ---
    const fetchClassesForCustomer = useCallback(async (customerId) => {
        setLoading(true);
        setLocalError(null);
        try {
            // TODO: Backend se customer ki classes fetch karein.
            // Assuming an endpoint like /customers/:customerId/classes
            // For now, using dummy data as per your image.
            const dummyClassesResponse = {
                status: 'success',
                data: [
                    { _id: 'cls1', name: 'Nursery' },
                    { _id: 'cls2', name: 'KG - 1' },
                    { _id: 'cls3', name: '6th' },
                    { _id: 'cls4', name: 'Pre Nursery' },
                    { _id: 'cls5', name: '1st' },
                    { _id: 'cls6', name: '2nd' },
                    { _id: 'cls7', name: '3rd' },
                    { _id: 'cls8', name: '4th' },
                    { _id: 'cls9', name: '5th' },
                    { _id: 'cls10', name: '7th' },
                    { _id: 'cls11', name: '8th' },
                    { _id: 'cls12', name: '9th' },
                    { _id: 'cls13', name: '11th' },
                    { _id: 'cls14', name: '12th' },
                ]
            };
            setClassesForCustomer(dummyClassesResponse.data);
            showFlashMessage('Classes loaded (dummy data).', 'info');

            // const response = await api.get(`/customers/${customerId}/classes`); 
            // if (response.data.status === 'success' && response.data.data) {
            //     setClassesForCustomer(response.data.data);
            // } else {
            //     setClassesForCustomer([]);
            //     showFlashMessage(response.data.message || 'Is customer ke liye koi classes nahin mile.', 'info');
            // }
        } catch (err) {
            console.error('Classes fetch karne mein error:', err);
            const errorMessage = err.response?.data?.message || 'Classes load nahin ho paye.';
            setLocalError(errorMessage);
            setClassesForCustomer([]); 
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]);

    // --- Fetch Sets for a Class (and Customer) ---
    const fetchSetsForClass = useCallback(async (customerId, classId) => {
        setLoading(true);
        setLocalError(null);
        try {
            // TODO: Backend se sets fetch karein.
            // Assuming an endpoint like /sets?customer=customerId&class=classId
            // For now, using dummy data as per your image.
            const dummySetsResponse = {
                status: 'success',
                data: [
                    {
                        _id: 'set1', name: 'Burlington (Set of 11 Books) - Pre Nur', totalPrice: 1745.0,
                        books: [{ book: { name: 'Burlington (Set of 11 Books) - Pre Nur', subTitle: 'Burlington English' }, quantity: 1, price: 1745.0 }],
                        stationeryItems: []
                    },
                    {
                        _id: 'set2', name: 'Grafalco Book', totalPrice: 170.0,
                        books: [{ book: { name: 'Grafalco Book', subTitle: 'Eng Pre - School Big & Small' }, quantity: 1, price: 170.0 }],
                        stationeryItems: []
                    },
                    {
                        _id: 'set3', name: 'Flowell Pub. Hello Picture Dictionary', totalPrice: 150.0,
                        books: [{ book: { name: 'Flowell Pub. Hello Picture Dictionary', subTitle: 'Flowell Pub.' }, quantity: 1, price: 150.0 }],
                        stationeryItems: []
                    },
                    {
                        _id: 'set4', name: 'Grafalco Book', totalPrice: 130.0,
                        books: [{ book: { name: 'Grafalco Book', subTitle: 'Maths Pre - School Number - (1-10) - 20' }, quantity: 1, price: 130.0 }],
                        stationeryItems: []
                    },
                    {
                        _id: 'set5', name: 'Lakecity Book', totalPrice: 440.0,
                        books: [{ book: { name: 'Lakecity Book', subTitle: 'My Work Of Art Book - (Pre - Nur)' }, quantity: 1, price: 440.0 }],
                        stationeryItems: []
                    },
                    {
                        _id: 'set6', name: 'DPS School Kit 19, item - (Pre - Nur)', totalPrice: 2161.0,
                        books: [],
                        stationeryItems: [{ item: { name: 'DPS School Kit 19, item - (Pre - Nur)' }, quantity: 1, price: 2161.0 }]
                    },
                    {
                        _id: 'set7', name: 'DPS School Bag - 14 inch', totalPrice: 600.0,
                        books: [],
                        stationeryItems: [{ item: { name: 'DPS School Bag - 14 inch' }, quantity: 1, price: 600.0 }]
                    },
                ]
            };
            setSetsForClass(dummySetsResponse.data);
            showFlashMessage('Sets loaded (dummy data).', 'info');

            // const response = await api.get(`/sets?customer=${customerId}&class=${classId}`); 
            // if (response.data.status === 'success' && response.data.data) {
            //     setSetsForClass(response.data.data);
            // } else {
            //     setSetsForClass([]);
            //     showFlashMessage(response.data.message || 'Is class ke liye koi sets nahin mile.', 'info');
            // }
        } catch (err) {
            console.error('Sets fetch karne mein error:', err);
            const errorMessage = err.response?.data?.message || 'Sets load nahin ho paye.';
            setLocalError(errorMessage);
            setSetsForClass([]); 
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]);

    // --- Initial Data Fetch (Customers only) ---
    useEffect(() => {
        if (currentBranchId) {
            fetchCustomers();
        }
    }, [fetchCustomers, currentBranchId]);

    // --- Customer Search Logic ---
    useEffect(() => {
        if (customerSearch && Array.isArray(customers)) { 
            setFilteredCustomers(
                customers.filter(customer =>
                    customer.customerName.toLowerCase().includes(customerSearch.toLowerCase())
                )
            );
        } else if (Array.isArray(customers)) { 
            setFilteredCustomers(customers);
        } else {
            setFilteredCustomers([]); 
        }
    }, [customerSearch, customers]);

    // --- Handlers for Navigation ---
    const handleCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        setCustomerNameInModal(customer.customerName); 
        setCustomerMobileInModal(customer.mobileNumber || ''); 
        fetchClassesForCustomer(customer._id); 
        setCurrentPage('setSelection'); 
    };

    const handleClassSelect = (classObj) => {
        setSelectedClass(classObj);
        fetchSetsForClass(selectedCustomer._id, classObj._id); 
    };

    const handleGoBackToCustomerSelection = () => {
        setCurrentPage('customerSelection');
        setSelectedCustomer(null);
        setClassesForCustomer([]);
        setCustomerSearch('');
        setFilteredCustomers(customers); 
        setSetsForClass([]); 
        setSelectedSetsInCart([]); 
        setTotalBillAmount(0);
    };

    const handleGoBackToSetSelection = () => {
        setShowPaymentModal(false);
    };

    const handleGoBackToDashboard = () => { 
        navigate('/branch-admin-dashboard'); 
    };

    // --- Cart/Set Management (for Set Selection Page) ---
    const handleSetQuantityChange = (setId, newQuantity) => {
        const quantity = parseInt(newQuantity, 10);
        if (isNaN(quantity) || quantity < 0) { 
            showFlashMessage('Quantity 0 या उससे ज़्यादा होनी चाहिए।', 'error');
            return;
        }

        setSelectedSetsInCart(prevSets => {
            const existingSet = prevSets.find(s => s._id === setId);
            if (quantity === 0) {
                return prevSets.filter(s => s._id !== setId); 
            } else if (existingSet) {
                return prevSets.map(s => s._id === setId ? { ...s, quantity: quantity } : s);
            } else {
                const setToAdd = setsForClass.find(s => s._id === setId);
                return setToAdd ? [...prevSets, { ...setToAdd, quantity: quantity }] : prevSets;
            }
        });
    };

    const handleToggleSetInCart = (set) => {
        setSelectedSetsInCart(prevSets => {
            const existingSet = prevSets.find(s => s._id === set._id);
            if (existingSet) {
                showFlashMessage(`${set.name} cart se remove ho gaya.`, 'info');
                return prevSets.filter(s => s._id !== set._id);
            } else {
                showFlashMessage(`${set.name} cart mein add ho gaya.`, 'success');
                return [...prevSets, { ...set, quantity: 1 }];
            }
        });
    };

    // --- Calculate Total Bill Amount ---
    useEffect(() => {
        const total = selectedSetsInCart.reduce((sum, set) => sum + (set.totalPrice * set.quantity), 0);
        setTotalBillAmount(total);
    }, [selectedSetsInCart]);

    // --- Handle Pay Now Click (Open Payment Modal) ---
    const handlePayNow = () => {
        if (selectedSetsInCart.length === 0) {
            showFlashMessage('Kripya sets select karein payment karne ke liye.', 'error');
            return;
        }
        setShowPaymentModal(true);
        setBillNo('4998'); 
        setBillDate(new Date().toLocaleDateString('en-GB')); 
    };

    // --- Handle Payment Submission (Final Sale) ---
    const handlePaymentSubmit = async () => {
        if (!selectedCustomer || !currentBranchId || selectedSetsInCart.length === 0 || !billNo || !billDate || !amountReceived) {
            showFlashMessage('Kripya sabhi zaroori details bharein.', 'error');
            return;
        }

        setLoading(true);
        setLocalError(null);

        const saleData = {
            billNo: billNo,
            billDate: billDate,
            customer: selectedCustomer._id,
            branch: currentBranchId,
            totalAmount: totalBillAmount, 
            amountReceived: parseFloat(amountReceived), 
            paymentMethod: paymentMethod,
            items: selectedSetsInCart.map(set => ({
                itemType: 'set', 
                itemId: set._id,
                quantity: set.quantity,
                price: set.totalPrice, 
                totalPrice: set.totalPrice * set.quantity
            }))
        };

        try {
            const response = await api.post('/sales', saleData); 
            if (response.data.status === 'success') {
                showFlashMessage('Sale successfully place ho gayi!', 'success');
                setShowPaymentModal(false); 
                setSelectedSetsInCart([]); 
                setTotalBillAmount(0);
                setCurrentPage('customerSelection'); 
            } else {
                showFlashMessage(response.data.message || 'Sale place karne mein error aa gaya.', 'error');
            }
        } catch (err) {
            console.error('Sale place karne mein error:', err);
            const errorMessage = err.response?.data?.message || 'Network error ke karan sale place nahin ho payi.';
            setLocalError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Render Logic based on Current Page ---
    const renderContent = () => {
        if (loading) {
            return (
                <div className="loading-spinner">
                    <FaSpinner className="animate-spin" size={50} />
                    <p>Loading data...</p>
                </div>
            );
        }

        if (localError) {
            return (
                <p className="counter-sale-error-message">
                    <FaTimesCircle className="error-icon" /> {localError}
                </p>
            );
        }

        switch (currentPage) {
            case 'customerSelection':
                return (
                    <>
                        <header className="counter-sale-header">
                            <h1 className="counter-sale-title">Customers</h1>
                            <button onClick={handleGoBackToDashboard} className="counter-sale-back-btn">
                                <FaArrowLeft /> Dashboard
                            </button>
                        </header>
                        <section className="counter-sale-section customer-selection-section">
                            <div className="form-group">
                                <label htmlFor="customer-search-input" className="sr-only">Customer Search</label>
                                <input
                                    type="text"
                                    id="customer-search-input"
                                    className="form-input"
                                    placeholder="Customer ka naam search karein..."
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                />
                            </div>
                            <div className="customer-list">
                                {/* Added Array.isArray check for safety */}
                                {Array.isArray(filteredCustomers) && filteredCustomers.length === 0 ? (
                                    <p className="empty-message">Koi customers nahin mile.</p>
                                ) : (
                                    // Ensure filteredCustomers is an array before mapping
                                    Array.isArray(filteredCustomers) && filteredCustomers.map(customer => (
                                        <div key={customer._id} className="customer-card" onClick={() => handleCustomerSelect(customer)}>
                                            <h3 className="customer-name">{customer.customerName}</h3>
                                            <p className="customer-info">({customer.schoolCode || 'N/A'})</p>
                                            <div className="customer-classes">
                                                {/* Classes for this customer (Dummy for now, will fetch from backend) */}
                                                {/* In real scenario, you might fetch classes associated with sets for this customer */}
                                                {/* For now, showing dummy classes or classes from customer object if available */}
                                                {customer.classes && customer.classes.length > 0 ? (
                                                    customer.classes.map(cls => (
                                                        <span key={cls._id} className="class-tag">{cls.name}</span>
                                                    ))
                                                ) : (
                                                    // Dummy classes if no actual classes found in customer object
                                                    <>
                                                        <span className="class-tag">Nursery</span>
                                                        <span className="class-tag">KG - 1</span>
                                                        <span className="class-tag">6th</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </>
                );

            case 'setSelection':
                return (
                    <>
                        <header className="counter-sale-header">
                            <button onClick={handleGoBackToCustomerSelection} className="counter-sale-back-btn">
                                <FaArrowLeft /> Customers
                            </button>
                            <h1 className="counter-sale-title">Sets for {selectedCustomer?.customerName}</h1>
                            <button onClick={handleGoBackToDashboard} className="counter-sale-back-btn">
                                <FaArrowLeft /> Dashboard
                            </button>
                        </header>
                        <section className="counter-sale-section set-selection-section">
                            <h2 className="section-title">Class Select karein</h2>
                            <div className="class-tags-container">
                                {classesForCustomer.length === 0 ? (
                                    <p className="empty-message">Is customer ke liye koi classes nahin mile.</p>
                                ) : (
                                    classesForCustomer.map(cls => (
                                        <button 
                                            key={cls._id} 
                                            className={`class-filter-tag ${selectedClass?._id === cls._id ? 'active' : ''}`}
                                            onClick={() => handleClassSelect(cls)}
                                        >
                                            {cls.name}
                                        </button>
                                    ))
                                )}
                            </div>

                            {selectedClass && (
                                <>
                                    <h2 className="section-title mt-4">Available Sets for {selectedClass.name}</h2>
                                    <div className="sets-list">
                                        {setsForClass.length === 0 ? (
                                            <p className="empty-message">Is class ke liye koi sets nahin mile.</p>
                                        ) : (
                                            setsForClass.map(set => (
                                                <div key={set._id} className="set-card">
                                                    <div className="set-info">
                                                        <span className="set-name">{set.name}</span>
                                                        <span className="set-price">₹{set.totalPrice.toFixed(1)}</span>
                                                    </div>
                                                    <div className="set-actions">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={selectedSetsInCart.find(s => s._id === set._id)?.quantity || 0}
                                                            onChange={(e) => handleSetQuantityChange(set._id, e.target.value)}
                                                            className="set-quantity-input"
                                                        />
                                                        <button
                                                            onClick={() => handleToggleSetInCart(set)}
                                                            className={`set-toggle-btn ${selectedSetsInCart.some(s => s._id === set._id) ? 'remove-from-cart' : 'add-to-cart'}`}
                                                        >
                                                            {selectedSetsInCart.some(s => s._id === set._id) ? <FaMinus /> : <FaPlus />}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="bill-summary-section">
                                <div className="bill-header">
                                    <div className="bill-info">
                                        <span>Bill No. {billNo || 'N/A'}</span>
                                        <span>Bill Date: {billDate || 'N/A'}</span>
                                    </div>
                                    <div className="remove-all-items">
                                        <input type="checkbox" id="remove-all-checkbox" />
                                        <label htmlFor="remove-all-checkbox">Remove all items</label>
                                    </div>
                                </div>
                                <div className="bill-items-table">
                                    {/* Books Table */}
                                    <h4>Books</h4>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Sub Title</th>
                                                <th>Books</th>
                                                <th>QTY.</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedSetsInCart.length === 0 ? (
                                                <tr><td colSpan="6">No books selected.</td></tr>
                                            ) : (
                                                selectedSetsInCart.flatMap((set, setIndex) => 
                                                    set.books.map((book, bookIndex) => (
                                                        <tr key={`${set._id}-book-${book._id}`}>
                                                            <td>{setIndex * 10 + bookIndex + 1}</td> {/* Dummy indexing */}
                                                            <td>{book.book.subTitle || 'N/A'}</td> {/* Assuming subTitle exists */}
                                                            <td>{book.book.name || 'N/A'}</td> {/* Assuming book name exists */}
                                                            <td>{book.quantity * set.quantity}</td> {/* Book quantity in set * set quantity */}
                                                            <td>{book.price.toFixed(1)}</td>
                                                            <td>{(book.price * book.quantity * set.quantity).toFixed(1)}</td>
                                                        </tr>
                                                    ))
                                                )
                                            )}
                                            <tr>
                                                <td colSpan="3"><strong>Total Books Value</strong></td>
                                                <td>{selectedSetsInCart.reduce((sum, set) => sum + set.quantity * set.books.reduce((bookSum, book) => bookSum + book.quantity, 0), 0)}</td>
                                                <td colSpan="2"><strong>{selectedSetsInCart.reduce((sum, set) => sum + set.quantity * set.books.reduce((bookSum, book) => bookSum + (book.price * book.quantity), 0), 0).toFixed(1)}</strong></td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    {/* Copies & Stationery Table */}
                                    <h4 className="mt-4">Copies & Stationery</h4>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Stationery item</th>
                                                <th>QTY.</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedSetsInCart.length === 0 ? (
                                                <tr><td colSpan="5">No stationery items selected.</td></tr>
                                            ) : (
                                                selectedSetsInCart.flatMap((set, setIndex) => 
                                                    set.stationeryItems.map((item, itemIndex) => (
                                                        <tr key={`${set._id}-stationery-${item._id}`}>
                                                            <td>{setIndex * 10 + itemIndex + 1}</td> {/* Dummy indexing */}
                                                            <td>{item.item.name || 'N/A'}</td> {/* Assuming stationery item name exists */}
                                                            <td>{item.quantity * set.quantity}</td> {/* Item quantity in set * set quantity */}
                                                            <td>{item.price.toFixed(1)}</td>
                                                            <td>{(item.price * item.quantity * set.quantity).toFixed(1)}</td>
                                                        </tr>
                                                    ))
                                                )
                                            )}
                                            <tr>
                                                <td colSpan="2"><strong>Total Copies Value</strong></td>
                                                <td>{selectedSetsInCart.reduce((sum, set) => sum + set.quantity * set.stationeryItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}</td>
                                                <td colSpan="2"><strong>{selectedSetsInCart.reduce((sum, set) => sum + set.quantity * set.stationeryItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0), 0).toFixed(1)}</strong></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bill-footer">
                                    <button className="btn btn-secondary print-token-btn">PRINT TOKEN</button>
                                    <div className="total-display">
                                        <span className="total-amount-display">₹{totalBillAmount.toFixed(1)}</span>
                                        <button onClick={handlePayNow} className="btn btn-primary pay-now-btn">PAY NOW</button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="counter-sale-container">
            {renderContent()}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="modal-backdrop">
                    <div className="modal-content payment-modal-content">
                        <h3 className="modal-header">Pay Now</h3>
                        <div className="payment-modal-grid">
                            <div className="form-group">
                                <label htmlFor="modal-name" className="sr-only">Name</label>
                                <input type="text" id="modal-name" className="form-input" placeholder="Name" value={customerNameInModal} onChange={(e) => setCustomerNameInModal(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="modal-mobile" className="sr-only">Mobile No.</label>
                                <input type="text" id="modal-mobile" className="form-input" placeholder="Mobile No." value={customerMobileInModal} onChange={(e) => setCustomerMobileInModal(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="modal-books-value" className="sr-only">Books Value</label>
                                <input type="text" id="modal-books-value" className="form-input" placeholder="Books Value" value={selectedSetsInCart.reduce((sum, set) => sum + set.quantity * set.books.reduce((bookSum, book) => bookSum + (book.price * book.quantity), 0), 0).toFixed(1)} readOnly />
                            </div>
                            <div className="form-group">
                                <label htmlFor="modal-copies-value" className="sr-only">Copies Value</label>
                                <input type="text" id="modal-copies-value" className="form-input" placeholder="Copies Value" value={selectedSetsInCart.reduce((sum, set) => sum + set.quantity * set.stationeryItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0), 0).toFixed(1)} readOnly />
                            </div>
                            <div className="form-group radio-group">
                                <label className="radio-label">
                                    <input type="radio" name="payment-method" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} /> Cash
                                </label>
                                <label className="radio-label">
                                    <input type="radio" name="payment-method" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} /> UPI
                                </label>
                                <label className="radio-label">
                                    <input type="radio" name="payment-method" value="both" checked={paymentMethod === 'both'} onChange={(e) => setPaymentMethod(e.target.value)} /> Both
                                </label>
                            </div>
                            <div className="form-group">
                                <label htmlFor="modal-total" className="sr-only">Total</label>
                                <input type="text" id="modal-total" className="form-input" placeholder="Total" value={totalBillAmount.toFixed(1)} readOnly />
                            </div>
                            <div className="form-group">
                                <label htmlFor="modal-amount-rec" className="sr-only">Amount Rec...</label>
                                <input type="number" id="modal-amount-rec" className="form-input" placeholder="Amount Rec..." value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleGoBackToSetSelection} className="btn btn-secondary">CLOSE</button>
                            <button onClick={handlePaymentSubmit} className="btn btn-primary" disabled={loading}>
                                {loading ? <FaSpinner className="animate-spin" /> : 'SUBMIT'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CounterSale;
