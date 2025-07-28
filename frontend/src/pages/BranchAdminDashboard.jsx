// src/pages/BranchAdminDashboard/BranchAdminDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // <<< Naya: useNavigate import karein
import api from '../utils/api'; 
import { toast } from 'sonner'; 
import { 
    FaShoppingCart, FaRupeeSign, FaMoneyBillWave, FaCreditCard, 
    FaReceipt, FaPrint, FaUndo, FaHistory, FaSearch, FaTimesCircle, FaSpinner, FaSync 
} from 'react-icons/fa'; 

import '../styles/BranchAdminDashboard.css'; 

const BranchAdminDashboard = ({ showFlashMessage }) => { // onGoToCounterSale prop ki ab zaroorat nahin
    const navigate = useNavigate(); // <<< useNavigate hook ka use karein

    // --- Dashboard Metrics ke liye State ---
    const [metrics, setMetrics] = useState({
        totalSetsSold: 0,
        totalValueSetsSold: 0,
        totalAmountCash: 0,
        totalAmountUpi: 0,
        totalAmountReceived: 0,
        nextBillNo: 1 
    });

    // --- Admin aur Branch Info ke liye State ---
    const [adminName, setAdminName] = useState('Loading Admin...');
    const [branchName, setBranchName] = useState('Loading Branch...');
    const [currentBranchId, setCurrentBranchId] = useState(null); 

    // --- Modals ke liye State ---
    const [showReturnAmountModal, setShowReturnAmountModal] = useState(false);
    const [showPrinterSettingModal, setShowPrinterSettingModal] = useState(false);

    // --- Modal Inputs ke liye State ---
    const [returnBillNo, setReturnBillNo] = useState('');
    const [printerIpAddress, setPrinterIpAddress] = useState('192.168.1.1');
    const [printerPort, setPrinterPort] = useState('9100');

    // --- Loading aur Error States ---
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);

    // --- Admin aur Branch Info ko Backend se fetch karna ---
    const fetchAdminAndBranchInfo = useCallback(async () => {
        setLoading(true);
        setLocalError(null);
        try {
            const userDetailsResponse = await api.get('/auth/me'); 
            
            let fetchedAdminName = 'Admin';
            let userBranchId = null;
            let fetchedBranchName = 'Unknown Branch';

            if (userDetailsResponse.data.status === 'success' && userDetailsResponse.data.data.user) {
                const userData = userDetailsResponse.data.data.user;
                fetchedAdminName = userData.name || 'Admin';
                userBranchId = userData.branchId; 
                fetchedBranchName = userData.branchName || 'Unknown Branch'; // authController se branchName direct mil raha hai
            } else {
                console.warn("User details nahin mile ya API response mein failure hai.");
                if (showFlashMessage) {
                    showFlashMessage('User details nahin fetch kar paye. Default dikha rahe hain.', 'warning');
                }
            }

            setAdminName(fetchedAdminName);
            setCurrentBranchId(userBranchId); 
            setBranchName(fetchedBranchName); // Direct use the fetched branchName

        } catch (err) {
            console.error('Admin ya branch details backend se fetch karne mein error:', err);
            const errorMessage = err.response?.data?.message || 'Network error ke karan admin/branch details load nahin ho paye.';
            setLocalError(errorMessage);
            if (showFlashMessage) {
                showFlashMessage(errorMessage, 'error');
            }
            setAdminName('Error');
            setBranchName('Error');
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]); 

    // --- Dashboard Metrics ko fetch karna ---
    const fetchDashboardMetrics = useCallback(async () => {
        if (!currentBranchId) { 
            if (showFlashMessage) {
                showFlashMessage('Branch information available nahin hai. Dashboard metrics fetch nahin kar sakte.', 'warning');
            }
            setLoading(false);
            return;
        }

        setLoading(true);
        setLocalError(null);
        try {
            const response = await api.get(`/dashboard/metrics?branchId=${currentBranchId}`);
            
            if (response.data.status === 'success' && response.data.data) {
                const fetchedMetrics = response.data.data;
                setMetrics({
                    totalSetsSold: fetchedMetrics.totalSetsSold || 0,
                    totalValueSetsSold: fetchedMetrics.totalValueSetsSold || 0,
                    totalAmountCash: fetchedMetrics.totalAmountCash || 0,
                    totalAmountUpi: fetchedMetrics.totalAmountUpi || 0,
                    totalAmountReceived: (fetchedMetrics.totalAmountCash || 0) + (fetchedMetrics.totalAmountUpi || 0), 
                    nextBillNo: fetchedMetrics.nextBillNo || 1
                });
                if (showFlashMessage) {
                    showFlashMessage('Dashboard metrics successfully load ho gaye!', 'success');
                }
            } else {
                setMetrics({ 
                    totalSetsSold: 0,
                    totalValueSetsSold: 0,
                    totalAmountCash: 0,
                    totalAmountUpi: 0,
                    totalAmountReceived: 0,
                    nextBillNo: 1
                });
                if (showFlashMessage) {
                    showFlashMessage(response.data.message || 'Is branch ke liye koi dashboard data nahin mila.', 'info');
                }
            }
        } catch (err) {
            console.error('Dashboard metrics fetch karne mein error:', err);
            const errorMessage = err.response?.data?.message || 'Network error ke karan dashboard metrics fetch nahin ho paye.';
            if (showFlashMessage) {
                setLocalError(errorMessage);
                showFlashMessage(errorMessage, 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [currentBranchId, showFlashMessage]); 


    // --- Effects ---
    useEffect(() => {
        fetchAdminAndBranchInfo(); 
    }, [fetchAdminAndBranchInfo]);

    useEffect(() => {
        if (currentBranchId) {
            fetchDashboardMetrics();
        }
    }, [currentBranchId, fetchDashboardMetrics]);


    // --- Modals ke Handlers ---
    const handleOpenReturnAmountModal = () => {
        setShowReturnAmountModal(true);
        setReturnBillNo(''); 
    };

    const handleCloseReturnAmountModal = () => {
        setShowReturnAmountModal(false);
    };

    const handleSearchBill = () => {
        if (!returnBillNo) {
            if (showFlashMessage) {
                showFlashMessage('Bill No. enter karein search karne ke liye.', 'error');
            }
            return;
        }
        if (showFlashMessage) {
                showFlashMessage(`Bill No: ${returnBillNo} search kar rahe hain... (Abhi implement nahin kiya gaya)`, 'info');
            }
            handleCloseReturnAmountModal();
        };

        const handleOpenPrinterSettingModal = () => {
            setShowPrinterSettingModal(true);
        };

        const handleClosePrinterSettingModal = () => {
            setShowPrinterSettingModal(false);
        };

        const handleTestPrint = () => {
            if (!printerIpAddress || !printerPort) {
                if (showFlashMessage) {
                    showFlashMessage('IP Address aur Port dono enter karein.', 'error');
                }
                return;
            }
            if (showFlashMessage) {
                showFlashMessage(`IP: ${printerIpAddress}, Port: ${printerPort} par test print ki koshish kar rahe hain... (Abhi implement nahin kiya gaya)`, 'info');
            }
            handleClosePrinterSettingModal();
        };

        // --- Navigation/Action Handlers ---
        const handleCounterSale = () => {
            navigate('/counter-sale'); // <<< useNavigate ka use karein
        };

        const handleSearchBillPage = () => {
            if (showFlashMessage) {
                showFlashMessage('Search Bill page par navigate kar rahe hain... (Abhi implement nahin kiya gaya)', 'info');
            }
        };

        const handleReturnBill = () => {
            handleOpenReturnAmountModal(); 
        };

        const handlePaymentHistory = () => {
            if (showFlashMessage) {
                showFlashMessage('Payment History par navigate kar rahe hain... (Abhi implement nahin kiya gaya)', 'info');
            }
        };

        return (
            <div className="branch-admin-dashboard-container">
                <header className="branch-admin-dashboard-header">
                    <div className="branch-admin-dashboard-title-group">
                        <h1 className="branch-admin-dashboard-title">Dashboard</h1>
                        <button 
                            onClick={() => {
                                fetchAdminAndBranchInfo(); 
                                fetchDashboardMetrics(); 
                            }}
                            className="branch-admin-refresh-button"
                            title="Data Refresh karein"
                            disabled={loading}
                        >
                            {loading ? <FaSpinner className="animate-spin refresh-icon" /> : <FaSync className="refresh-icon" />}
                        </button>
                    </div>
                    <p className="branch-admin-admin-info">
                        Welcome, {adminName} | Branch: {branchName}
                    </p>
                </header>

                {localError && (
                    <p className="branch-admin-error-message">
                        <FaTimesCircle className="branch-admin-error-icon" /> {localError}
                    </p>
                )}

                {/* Metrics Grid */}
                <div className="branch-admin-metrics-grid">
                    <div className="branch-admin-metric-card blue-card"> 
                        <FaShoppingCart className="metric-icon" />
                        <span className="metric-value">{metrics.totalSetsSold}</span>
                        <span className="metric-label">Total sets bik gaye</span>
                    </div>
                    <div className="branch-admin-metric-card green-card"> 
                        <FaRupeeSign className="metric-icon" />
                        <span className="metric-value">{metrics.totalValueSetsSold.toFixed(1)}</span> 
                        <span className="metric-label">Bik gaye sets ki kul keemat</span>
                    </div>
                    <div className="branch-admin-metric-card red-card"> 
                        <FaMoneyBillWave className="metric-icon" />
                        <span className="metric-value">{metrics.totalAmountCash.toFixed(1)}</span> 
                        <span className="metric-label">Cash se mili kul rakam</span>
                    </div>
                    <div className="branch-admin-metric-card yellow-card"> 
                        <FaCreditCard className="metric-icon" />
                        <span className="metric-value">{metrics.totalAmountUpi.toFixed(1)}</span> 
                        <span className="metric-label">UPI se mili kul rakam</span>
                    </div>
                    <div className="branch-admin-metric-card gray-card"> 
                        <FaReceipt className="metric-icon" />
                        <span className="metric-value">{metrics.totalAmountReceived.toFixed(1)}</span> 
                        <span className="metric-label">Kul rakam mili</span>
                    </div>
                    <div className="branch-admin-metric-card purple-card"> 
                        <span className="metric-value">{metrics.nextBillNo}</span>
                        <span className="metric-label">Agla Token No.</span>
                        <button className="branch-admin-generate-token-btn">Token Generate karein</button> 
                    </div>
                </div>

                {/* Action Buttons Grid */}
                <div className="branch-admin-action-buttons-grid">
                    <button onClick={handleCounterSale} className="branch-admin-action-btn green-btn"> 
                        COUNTER SALE
                    </button>
                    <button onClick={handleSearchBillPage} className="branch-admin-action-btn blue-btn"> 
                        SEARCH BILL
                    </button>
                    <button onClick={handleOpenPrinterSettingModal} className="branch-admin-action-btn black-btn"> 
                        PRINTER SETTING
                    </button>
                    <button onClick={handleReturnBill} className="branch-admin-action-btn red-btn"> 
                        RETURN BILL
                    </button>
                    <button onClick={handlePaymentHistory} className="branch-admin-action-btn purple-btn col-span-2"> 
                        PAYMENT HISTORY
                    </button>
                </div>

                {/* Return Amount Modal */}
                {showReturnAmountModal && (
                    <div className="branch-admin-modal-backdrop">
                        <div className="branch-admin-modal-content"> 
                            <h3 className="branch-admin-modal-header">Rakam Wapas karein</h3> 
                            <div className="branch-admin-form-group">
                                <label htmlFor="return-bill-no" className="branch-admin-form-label branch-admin-sr-only">Bill No.</label> 
                                <input
                                    type="text"
                                    id="return-bill-no"
                                    value={returnBillNo}
                                    onChange={(e) => setReturnBillNo(e.target.value)}
                                    className="branch-admin-form-input" 
                                    placeholder="Bill No."
                                />
                            </div>
                            <div className="branch-admin-modal-actions"> 
                                <button onClick={handleCloseReturnAmountModal} className="btn btn-secondary">BAND KAREIN</button> 
                                <button onClick={handleSearchBill} className="btn btn-primary">BILL SEARCH KAREIN</button> 
                            </div>
                        </div>
                    </div>
                )}

                {/* Printer Setting Modal */}
                {showPrinterSettingModal && (
                    <div className="branch-admin-modal-backdrop">
                        <div className="branch-admin-modal-content"> 
                            <h3 className="branch-admin-modal-header">Printer Setting</h3> 
                            <div className="form-grid-2-cols"> 
                                <div className="branch-admin-form-group">
                                    <label htmlFor="printer-ip" className="branch-admin-form-label branch-admin-sr-only">IP Address</label>
                                    <input
                                        type="text"
                                        id="printer-ip"
                                        value={printerIpAddress}
                                        onChange={(e) => setPrinterIpAddress(e.target.value)}
                                        className="branch-admin-form-input" 
                                        placeholder="IP Address"
                                    />
                                </div>
                                <div className="branch-admin-form-group">
                                    <label htmlFor="printer-port" className="branch-admin-form-label branch-admin-sr-only">Port</label>
                                    <input
                                        type="text"
                                        id="printer-port"
                                        value={printerPort}
                                        onChange={(e) => setPrinterPort(e.target.value)}
                                        className="branch-admin-form-input" 
                                        placeholder="Port"
                                    />
                                </div>
                            </div>
                            <div className="branch-admin-modal-actions"> 
                                <button onClick={handleClosePrinterSettingModal} className="btn btn-secondary">BAND KAREIN</button> 
                                <button onClick={handleTestPrint} className="btn btn-primary">TEST PRINT</button> 
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    export default BranchAdminDashboard;
