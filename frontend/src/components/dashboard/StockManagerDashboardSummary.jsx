// src/components/dashboard/StockManagerDashboardSummary.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api'; // Assuming this is your configured axios instance
import SummaryCard from '../common/SummaryCard'; // Reusable component for displaying summary data
import {
    FaUsers, FaBuilding, FaUserTie, FaBoxes, FaGlobeAsia, FaCity,
    FaBook, FaBookOpen, FaUserCheck, FaTruck, FaUserCog, FaGraduationCap,
    FaLanguage, // Import FaLanguage icon
    FaPencilRuler // NEW: Import FaPencilRuler for Stationery Items
} from 'react-icons/fa'; // Icons for various summary cards

// Stylesheets
import '../../styles/SummaryCards.css'; // Styles for the summary cards grid and individual cards


const StockManagerDashboardSummary = ({ showFlashMessage }) => {
    // State to hold counts for various entities
    const [counts, setCounts] = useState({
        // Initialize only the counts for implemented modules to avoid errors
        branches: 0, // Will not be fetched, remains 0
        employees: 0, // Will not be fetched, remains 0
        branchAdmins: 0, // Will not be fetched, remains 0
        stockManagers: 0, // Will not be fetched, remains 0
        zones: 0,
        cities: 0,
        publications: 0,
        languages: 0,
        bookCatalogs: 0,
        stationeryItems: 0, // NEW: Stationery Item count
        customers: 0, // Will not be fetched, remains 0 (This will be implemented in a later step)
        transports: 0, // Will not be fetched, remains 0
        classes: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch all counts from the backend
    const fetchCounts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Array of API calls to fetch counts for each entity
            // ONLY include API calls for models that are currently implemented and have backend routes
            const apiCalls = [
                api.get('/summary/zones'),
                api.get('/summary/cities'),
                api.get('/summary/classes'),
                api.get('/summary/publications'),
                api.get('/summary/languages'),
                api.get('/summary/book-catalogs'),
                api.get('/summary/stationery-items'), // NEW: Fetch Stationery Item count
                api.get('/summary/customers') // Included here, but will only update when backend route is available
            ];

            const [
                zonesRes, citiesRes, classesRes, publicationsRes, languagesRes, bookCatalogsRes, stationeryItemsRes, customersRes // NEW: stationeryItemsRes and customersRes
            ] = await Promise.all(apiCalls);

            setCounts({
                // Set counts only for the data that was successfully fetched
                zones: zonesRes.data.data.count,
                cities: citiesRes.data.data.count,
                classes: classesRes.data.data.count,
                publications: publicationsRes.data.data.count,
                languages: languagesRes.data.data.count,
                bookCatalogs: bookCatalogsRes.data.data.count,
                stationeryItems: stationeryItemsRes.data.data.count, // NEW: Set Stationery Item count
                customers: customersRes.data.data.count || 0, // Set customers count, default to 0 if undefined/null
                // Keep other counts as 0 or their initial values if not fetched
                branches: 0,
                employees: 0,
                branchAdmins: 0,
                stockManagers: 0,
                transports: 0,
            });
            showFlashMessage('Dashboard summary updated!', 'success');
        } catch (err) {
            console.error('Error fetching dashboard summary:', err);
            const errorMessage = err.response?.data?.message || 'Failed to load dashboard summary.';
            setError(errorMessage);
            showFlashMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [showFlashMessage]);

    // Fetch counts on component mount
    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    if (loading) {
        return (
            <div className="summary-section loading-state">
                <p>Loading dashboard summary...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="summary-section error-state">
                <p>Error: {error}</p>
                <button onClick={fetchCounts} className="btn btn-primary mt-3">Retry</button>
            </div>
        );
    }

    return (
        <div className="summary-section">
            <h2 className="section-title">Overall Dashboard Summary</h2>
            <div className="summary-cards-grid">
                {/* Only render cards for currently implemented modules */}
                <SummaryCard title="Total Classes" count={counts.classes} icon={FaGraduationCap} color="cyan" />
                <SummaryCard title="Total Zones" count={counts.zones} icon={FaGlobeAsia} color="blue" />
                <SummaryCard title="Total Cities" count={counts.cities} icon={FaCity} color="brown" />
                <SummaryCard title="Total Publications" count={counts.publications} icon={FaBook} color="violet" />
                <SummaryCard title="Total Languages" count={counts.languages} icon={FaLanguage} color="orange" />
                <SummaryCard title="Total Book Catalogs" count={counts.bookCatalogs} icon={FaBookOpen} color="purple" />
                <SummaryCard title="Total Stationery Items" count={counts.stationeryItems} icon={FaPencilRuler} color="green" /> {/* NEW: Stationery Item Summary Card */}
                
                {/* These cards will display 0 as their counts are initialized to 0 and not updated by API,
                    or will update once their backend routes are implemented. */}
                <SummaryCard title="Total Customers" count={counts.customers} icon={FaUserCheck} color="indigo" />
                <SummaryCard title="Total Transports" count={counts.transports} icon={FaTruck} color="teal" />
            </div>
        </div>
    );
};

export default StockManagerDashboardSummary;
