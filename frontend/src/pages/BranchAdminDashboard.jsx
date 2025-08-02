// src/pages/BranchAdminDashboard/BranchAdminDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    FaShoppingCart, FaRupeeSign, FaMoneyBillWave, FaCreditCard,
    FaReceipt, FaPrint, FaUndo, FaHistory, FaSearch, FaTimesCircle,
    FaSpinner, FaSync, FaChevronLeft, FaArrowRight
} from 'react-icons/fa';
import api from '../utils/api';

const BranchAdminDashboard = ({ showFlashMessage }) => {
    const navigate = useNavigate();

    // State to manage which view is visible (buttons or dashboard)
    const [isDashboardVisible, setIsDashboardVisible] = useState(false);

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
                fetchedBranchName = userData.branchName || 'Unknown Branch';
            } else {
                console.warn("User details nahin mile ya API response mein failure hai.");
                if (showFlashMessage) {
                    showFlashMessage('User details nahin fetch kar paye. Default dikha rahe hain.', 'warning');
                }
            }

            setAdminName(fetchedAdminName);
            setCurrentBranchId(userBranchId);
            setBranchName(fetchedBranchName);

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
        navigate('/counter-sale');
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

    // Naya handler 'Token Generate karein' button ke liye
    const handleGenerateToken = () => {
      if (showFlashMessage) {
          showFlashMessage(`Agla token number ${metrics.nextBillNo} generate ho raha hai... (Abhi implement nahin kiya gaya)`, 'info');
      }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-sans flex flex-col items-center">
            {/* Header section with responsive layout for different screens */}
            <header className="w-full flex flex-col md:flex-row justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <button
                        onClick={() => {
                            fetchAdminAndBranchInfo();
                            fetchDashboardMetrics();
                        }}
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                        title="Data Refresh karein"
                        disabled={loading}
                    >
                        {loading ? <FaSpinner className="animate-spin text-xl" /> : <FaSync className="text-xl" />}
                    </button>
                </div>
                <p className="text-sm text-gray-600 mt-2 md:mt-0">
                    Welcome, <span className="font-semibold">{adminName}</span> | Branch: <span className="font-semibold">{branchName}</span>
                </p>
            </header>

            {localError && (
                <p className="flex items-center p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg w-full max-w-4xl">
                    <FaTimesCircle className="mr-2 text-lg" /> {localError}
                </p>
            )}

            {/* Main Content Area, responsive padding, and centered layout */}
            <div className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg">
                {/* Conditional Rendering based on state */}
                {!isDashboardVisible ? (
                    /* --- Page 1: Action Buttons, ab 'Token Generation' button yahan hai --- */
                    <div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <button onClick={handleCounterSale} className="bg-green-600 hover:bg-green-700 text-white font-bold py-8 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex flex-col items-center justify-center space-y-2">
                                <FaShoppingCart className="text-4xl" />
                                <span className="text-sm">COUNTER SALE</span>
                            </button>
                            <button onClick={handleSearchBillPage} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-8 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex flex-col items-center justify-center space-y-2">
                                <FaSearch className="text-4xl" />
                                <span className="text-sm">SEARCH BILL</span>
                            </button>
                            <button onClick={handleOpenPrinterSettingModal} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-8 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex flex-col items-center justify-center space-y-2">
                                <FaPrint className="text-4xl" />
                                <span className="text-sm">PRINTER SETTING</span>
                            </button>
                            <button onClick={handleReturnBill} className="bg-red-600 hover:bg-red-700 text-white font-bold py-8 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex flex-col items-center justify-center space-y-2">
                                <FaUndo className="text-4xl" />
                                <span className="text-sm">RETURN BILL</span>
                            </button>
                            {/* Naya 'Token Generation' button jo dusre page se yahan shift hua hai */}
                            <button onClick={handleGenerateToken} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-8 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex flex-col items-center justify-center space-y-2">
                                <span className="text-4xl font-bold">{metrics.nextBillNo}</span>
                                <span className="text-sm">TOKEN GENERATION</span>
                            </button>
                            {/* Button to navigate to the dashboard metrics, jiske baad 'Payment History' bhi hai */}
                            <button
                                onClick={() => setIsDashboardVisible(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-8 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex flex-col items-center justify-center space-y-2"
                            >
                                <FaArrowRight className="text-4xl" />
                                <span className="text-sm">DASHBOARD INFO</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* --- Page 2: Dashboard Metrics, ab 'Payment History' button yahan hai --- */
                    <div>
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Dashboard Metrics</h2>
                            {/* 'Payment History' button jo pehle page se yahan shift hua hai */}
                            <button onClick={handlePaymentHistory} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center space-x-2 mt-4 md:mt-0">
                                <FaHistory className="text-2xl" />
                                <span className="text-sm">PAYMENT HISTORY</span>
                            </button>
                        </div>
                        {/* Responsive grid for metrics: 2 columns on all devices, with stacking on very small screens */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="bg-blue-500 text-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center transform transition-transform hover:scale-105">
                                <FaShoppingCart className="text-3xl mb-2" />
                                <span className="text-2xl font-bold">{metrics.totalSetsSold}</span>
                                <span className="text-sm mt-1 text-center">Total sets bik gaye</span>
                            </div>
                            <div className="bg-green-500 text-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center transform transition-transform hover:scale-105">
                                <FaRupeeSign className="text-3xl mb-2" />
                                <span className="text-2xl font-bold">{metrics.totalValueSetsSold.toFixed(1)}</span>
                                <span className="text-sm mt-1 text-center">Bik gaye sets ki kul keemat</span>
                            </div>
                            <div className="bg-red-500 text-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center transform transition-transform hover:scale-105">
                                <FaMoneyBillWave className="text-3xl mb-2" />
                                <span className="text-2xl font-bold">{metrics.totalAmountCash.toFixed(1)}</span>
                                <span className="text-sm mt-1 text-center">Cash se mili kul rakam</span>
                            </div>
                            <div className="bg-yellow-500 text-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center transform transition-transform hover:scale-105">
                                <FaCreditCard className="text-3xl mb-2" />
                                <span className="text-2xl font-bold">{metrics.totalAmountUpi.toFixed(1)}</span>
                                <span className="text-sm mt-1 text-center">UPI se mili kul rakam</span>
                            </div>
                            <div className="bg-gray-500 text-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center transform transition-transform hover:scale-105">
                                <FaReceipt className="text-3xl mb-2" />
                                <span className="text-2xl font-bold">{metrics.totalAmountReceived.toFixed(1)}</span>
                                <span className="text-sm mt-1 text-center">Kul rakam mili</span>
                            </div>
                        </div>

                        {/* Button to navigate back to action buttons */}
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={() => setIsDashboardVisible(false)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center space-x-2 w-full max-w-sm"
                            >
                                <FaChevronLeft />
                                <span>BACK TO ACTIONS</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Return Amount Modal --- */}
            {showReturnAmountModal && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Rakam Wapas karein</h3>
                        <div className="mb-4">
                            <label htmlFor="return-bill-no" className="block text-sm font-medium text-gray-700 sr-only">Bill No.</label>
                            <input
                                type="text"
                                id="return-bill-no"
                                value={returnBillNo}
                                onChange={(e) => setReturnBillNo(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Bill No."
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={handleCloseReturnAmountModal} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">BAND KAREIN</button>
                            <button onClick={handleSearchBill} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">BILL SEARCH KAREIN</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Printer Setting Modal --- */}
            {showPrinterSettingModal && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Printer Setting</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="printer-ip" className="block text-sm font-medium text-gray-700 sr-only">IP Address</label>
                                <input
                                    type="text"
                                    id="printer-ip"
                                    value={printerIpAddress}
                                    onChange={(e) => setPrinterIpAddress(e.target.value)}
                                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="IP Address"
                                />
                            </div>
                            <div>
                                <label htmlFor="printer-port" className="block text-sm font-medium text-gray-700 sr-only">Port</label>
                                <input
                                    type="text"
                                    id="printer-port"
                                    value={printerPort}
                                    onChange={(e) => setPrinterPort(e.target.value)}
                                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Port"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={handleClosePrinterSettingModal} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">BAND KAREIN</button>
                            <button onClick={handleTestPrint} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">TEST PRINT</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchAdminDashboard;
