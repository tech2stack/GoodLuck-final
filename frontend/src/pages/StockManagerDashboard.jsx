// src/pages/StockManagerDashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/StockManagerDashboard.css'; // Create this CSS file later for styling

const StockManagerDashboard = () => {
    const { userData, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!userData || userData.role !== 'stock_manager') {
        // Redirect if not a stock manager or not logged in
        navigate('/login');
        return null;
    }

    return (
        <div className="stock-manager-dashboard-container">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Stock Manager Dashboard</h1>
                <div className="user-info">
                    <span>Hello, {userData.name || userData.username}!</span>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </header>
            <main className="dashboard-main-content">
                <p>Welcome to your Stock Manager Dashboard. Here you can manage inventory, view stock levels, etc.</p>
                {/* Add specific Stock Manager functionalities here */}
                <section className="dashboard-widgets">
                    <div className="widget-card">
                        <h3>Current Stock</h3>
                        <p>Total items: <span>500</span></p>
                        {/* More details */}
                    </div>
                    <div className="widget-card">
                        <h3>Recent Transactions</h3>
                        <ul>
                            <li>Item A - Out (10)</li>
                            <li>Item B - In (50)</li>
                        </ul>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default StockManagerDashboard;