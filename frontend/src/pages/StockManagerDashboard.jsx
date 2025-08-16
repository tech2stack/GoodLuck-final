import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
import TransportManagement from '../components/masters/TransportManagement';
import PendingBookManagement from '../components/PendingBookManagement';
import CreateSetManagement from '../components/masters/CreateSetManagement';
import SidebarStockManagerDashboard from '../components/SidebarStockManagerDashboard';

import '../styles/Dashboard.css';
import '../styles/StockManagerDashboard.css';

const ManagementPlaceholder = ({ title }) => (
    <div className="content-placeholder card">
        <h3>{title} (Coming Soon)</h3>
        <p>Manage {title.toLowerCase()} here.</p>
    </div>
);

const StockManagerDashboard = ({ showFlashMessage: propShowFlashMessage }) => {
    const { userData, isLoggedIn, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [activeView, setActiveView] = useState('dashboard');
    const [flashMessage, setFlashMessage] = useState(null);
    // ✅ Sidebar closed by default
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (!authLoading && (!isLoggedIn || userData?.role !== 'stock_manager')) {
            console.log('StockManagerDashboard: Unauthorized or not logged in. Redirecting to login page.');
            navigate('/login', {
                replace: true,
                state: { message: 'Please log in as a Stock Manager to access this page.' }
            });
        }
    }, [isLoggedIn, userData, navigate, authLoading]);

    const showFlashMessage = useCallback(
        (message, type) => {
            if (propShowFlashMessage) {
                propShowFlashMessage(message, type);
            } else {
                console.log(`FlashMessage: ${message} (Type: ${type})`);
                setFlashMessage(null);
                setFlashMessage({ message, type });
                setTimeout(() => setFlashMessage(null), 5000);
            }
        },
        [propShowFlashMessage]
    );

    const handleOptionClick = useCallback(
        (option) => {
            setActiveView(option);
            if (isMobile) {
                setIsSidebarCollapsed(true); // auto-close after selecting on mobile
            }
        },
        [isMobile]
    );

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);

            // ✅ Keep sidebar collapsed by default
            if (mobile) {
                setIsSidebarCollapsed(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
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
        <>
            <span className="spacer">&nbsp;&nbsp;&nbsp;&nbsp;</span>

            <div className="dashboard-container">
                <SidebarStockManagerDashboard
                    userData={userData}
                    isSidebarCollapsed={isSidebarCollapsed}
                    setIsSidebarCollapsed={setIsSidebarCollapsed}
                    isMobile={isMobile}
                    activeView={activeView}
                    handleOptionClick={handleOptionClick}
                />

                <div
                    className={`main-content-wrapper ${
                        isSidebarCollapsed ? 'sidebar-collapsed' : ''
                    }`}
                >
                    <main className="dashboard-main-content">
                        {flashMessage && (
                            <FlashMessage
                                message={flashMessage.message}
                                type={flashMessage.type}
                            />
                        )}

                        <div className="dashboard-content-area">
                            {activeView === 'dashboard' && (
                                <StockManagerDashboardSummary
                                    showFlashMessage={showFlashMessage}
                                />
                            )}
                            {activeView === 'class' && (
                                <ClassManagement showFlashMessage={showFlashMessage} />
                            )}
                            {activeView === 'zone' && (
                                <ZoneManagement showFlashMessage={showFlashMessage} />
                            )}
                            {activeView === 'city' && (
                                <CityManagement showFlashMessage={showFlashMessage} />
                            )}
                            {activeView === 'publication' && (
                                <PublicationManagement
                                    showFlashMessage={showFlashMessage}
                                />
                            )}
                            {activeView === 'language' && (
                                <LanguageManagement showFlashMessage={showFlashMessage} />
                            )}
                            {activeView === 'book-catalog' && (
                                <BookCatalogManagement
                                    showFlashMessage={showFlashMessage}
                                />
                            )}
                            {activeView === 'stationery-item' && (
                                <StationeryItemManagement
                                    showFlashMessage={showFlashMessage}
                                />
                            )}
                            {activeView === 'customers' && (
                                <CustomerManagement showFlashMessage={showFlashMessage} />
                            )}
                            {activeView === 'transports' && (
                                <TransportManagement showFlashMessage={showFlashMessage} />
                            )}
                            {activeView === 'create-sets' && (
                                <CreateSetManagement showFlashMessage={showFlashMessage} />
                            )}
                            {activeView === 'pending-book' && (
                                <PendingBookManagement
                                    showFlashMessage={showFlashMessage}
                                />
                            )}
                            {activeView === 'purchase-order' && (
                                <ManagementPlaceholder title="Purchase Order" />
                            )}
                            {activeView === 'purchase-invoice' && (
                                <ManagementPlaceholder title="Purchase Invoice" />
                            )}
                            {activeView === 'payment-voucher' && (
                                <ManagementPlaceholder title="Payment Voucher" />
                            )}
                            {activeView === 'purchase-return-debit-note' && (
                                <ManagementPlaceholder title="Purchase Return (Debit Note)" />
                            )}
                            {activeView === 'purchase-ledgers' && (
                                <ManagementPlaceholder title="Purchase Ledgers" />
                            )}
                            {activeView === 'purchase-reports' && (
                                <ManagementPlaceholder title="Purchase Reports" />
                            )}
                            {activeView === 'stock-balance' && (
                                <ManagementPlaceholder title="Stock Balance" />
                            )}
                            {activeView === 'sale-bill' && (
                                <ManagementPlaceholder title="Sale Bill" />
                            )}
                            {activeView === 'manual-pending-sale' && (
                                <ManagementPlaceholder title="Manual Pending Sale" />
                            )}
                            {activeView === 'pending-books' && (
                                <ManagementPlaceholder title="Pending Books" />
                            )}
                            {activeView === 'pending-books-ledger' && (
                                <ManagementPlaceholder title="Pending Books Ledger" />
                            )}
                            {activeView === 'receipt-voucher' && (
                                <ManagementPlaceholder title="Receipt Voucher" />
                            )}
                            {activeView === 'advance-deposit' && (
                                <ManagementPlaceholder title="Advance Deposit" />
                            )}
                            {activeView === 'sale-return-credit-note' && (
                                <ManagementPlaceholder title="Sale Return (Credit Note)" />
                            )}
                            {activeView === 'sale-ledgers' && (
                                <ManagementPlaceholder title="Sale Ledgers" />
                            )}
                            {activeView === 'books-not-sold' && (
                                <ManagementPlaceholder title="Books Not Sold" />
                            )}
                            {activeView === 'sale-reports' && (
                                <ManagementPlaceholder title="Sale Reports" />
                            )}
                            {activeView === 'books-sale-reports' && (
                                <ManagementPlaceholder title="Books Sale Reports" />
                            )}
                            {activeView === 'sale-purchase-reports' && (
                                <ManagementPlaceholder title="Sale-Purchase Reports" />
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default StockManagerDashboard;
