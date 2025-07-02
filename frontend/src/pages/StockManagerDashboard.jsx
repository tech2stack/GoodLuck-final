import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Components
import Sidebar from '../components/sidebar';
import FlashMessage from '../components/FlashMessage';
import StockManagerDashboardSummary from '../components/dashboard/StockManagerDashboardSummary';
import ClassManagement from '../components/masters/ClassManagement';
import ZoneManagement from '../components/masters/ZoneManagement';
import CityManagement from '../components/masters/CityManagement';
import PublicationManagement from '../components/masters/PublicationManagement';
import LanguageManagement from '../components/masters/LanguageManagement';
import BookCatalogManagement from '../components/masters/BookCatalogManagement';
import StationeryItemManagement from '../components/masters/StationeryItemManagement';
import CustomerManagement from '../components/masters/CustomerManagement';

// Styles
import '../styles/Dashboard.css';
import '../styles/StockManagerDashboard.css';

const StockManagerDashboard = () => {
    const { userData, isLoggedIn, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [activeView, setActiveView] = useState('dashboard');
    const [flashMessage, setFlashMessage] = useState(null);

    // Redirect if not authenticated or wrong role
    useEffect(() => {
        if (!authLoading && (!isLoggedIn || userData?.role !== 'stock_manager')) {
            navigate('/login', {
                replace: true,
                state: { message: 'Please log in as a Stock Manager to access this page.' },
            });
        }
    }, [authLoading, isLoggedIn, userData, navigate]);

    // Flash message handler
    const showFlashMessage = useCallback((message, type) => {
        setFlashMessage({ message, type });
        setTimeout(() => setFlashMessage(null), 5000);
    }, []);

    if (authLoading || (!isLoggedIn && !authLoading)) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-xl text-gray-700">Loading user authentication status...</p>
            </div>
        );
    }

    if (!userData || userData.role !== 'stock_manager') {
        return null;
    }

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <Sidebar activeView={activeView} onOptionClick={setActiveView} userData={userData} />

            {/* Main Content */}
            <main className="dashboard-main-content">
                <header className="dashboard-header">
                    <h1>Stock Management Dashboard</h1>
                </header>

                {flashMessage && (
                    <FlashMessage message={flashMessage.message} type={flashMessage.type} />
                )}

                <div className="dashboard-content-area">
                    {activeView === 'dashboard' && <StockManagerDashboardSummary showFlashMessage={showFlashMessage} />}
                    {activeView === 'class' && <ClassManagement showFlashMessage={showFlashMessage} />}
                    {activeView === 'zone' && <ZoneManagement showFlashMessage={showFlashMessage} />}
                    {activeView === 'city' && <CityManagement showFlashMessage={showFlashMessage} />}
                    {activeView === 'publication' && <PublicationManagement showFlashMessage={showFlashMessage} />}
                    {activeView === 'language' && <LanguageManagement showFlashMessage={showFlashMessage} />}
                    {activeView === 'book-catalog' && <BookCatalogManagement showFlashMessage={showFlashMessage} />}
                    {activeView === 'stationery-item' && <StationeryItemManagement showFlashMessage={showFlashMessage} />}
                    {activeView === 'customers' && <CustomerManagement showFlashMessage={showFlashMessage} />}

                    {/* Coming Soon Placeholders */}
                    {activeView === 'transports' && (
                        <div className="content-placeholder card">
                            <h3>Transport Management (Coming Soon)</h3>
                            <p>Details related to Transports will be displayed and managed here.</p>
                        </div>
                    )}
                    {activeView === 'create-sets' && (
                        <div className="content-placeholder card">
                            <h3>Create Sets (Coming Soon)</h3>
                            <p>Details related to creating sets will be displayed and managed here.</p>
                        </div>
                    )}
                    {activeView === 'pending-book' && (
                        <div className="content-placeholder card">
                            <h3>Pending Book Management (Coming Soon)</h3>
                            <p>Details related to Pending Books will be displayed and managed here.</p>
                        </div>
                    )}

                    {/* Purchase Placeholder Views */}
                    {activeView === 'purchase-order' && (
                        <div className="content-placeholder card"><h3>Purchase Order</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'purchase-invoice' && (
                        <div className="content-placeholder card"><h3>Purchase Invoice</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'payment-voucher' && (
                        <div className="content-placeholder card"><h3>Payment Voucher</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'purchase-return-debit-note' && (
                        <div className="content-placeholder card"><h3>Purchase Return (Debit Note)</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'purchase-ledgers' && (
                        <div className="content-placeholder card"><h3>Purchase Ledgers</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'purchase-reports' && (
                        <div className="content-placeholder card"><h3>Purchase Reports</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'stock-balance' && (
                        <div className="content-placeholder card"><h3>Stock Balance</h3><p>Coming Soon</p></div>
                    )}

                    {/* Sales Placeholder Views */}
                    {activeView === 'sale-bill' && (
                        <div className="content-placeholder card"><h3>Sale Bill</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'manual-pending-sale' && (
                        <div className="content-placeholder card"><h3>Manual Pending Sale</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'pending-books' && (
                        <div className="content-placeholder card"><h3>Pending Books</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'pending-books-ledger' && (
                        <div className="content-placeholder card"><h3>Pending Books Ledger</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'receipt-voucher' && (
                        <div className="content-placeholder card"><h3>Receipt Voucher</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'advance-deposit' && (
                        <div className="content-placeholder card"><h3>Advance Deposit</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'sale-return-credit-note' && (
                        <div className="content-placeholder card"><h3>Sale Return (Credit Note)</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'sale-ledgers' && (
                        <div className="content-placeholder card"><h3>Sale Ledgers</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'books-not-sold' && (
                        <div className="content-placeholder card"><h3>Books Not Sold</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'sale-reports' && (
                        <div className="content-placeholder card"><h3>Sale Reports</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'books-sale-reports' && (
                        <div className="content-placeholder card"><h3>Books Sale Reports</h3><p>Coming Soon</p></div>
                    )}
                    {activeView === 'sale-purchase-reports' && (
                        <div className="content-placeholder card"><h3>Sale-Purchase Reports</h3><p>Coming Soon</p></div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StockManagerDashboard;
