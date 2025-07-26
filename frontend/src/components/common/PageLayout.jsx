// src/components/common/PageLayout.jsx
import React from 'react';
import '../../styles/CommonLayout.css'; // Import common layout styles

/**
 * PageLayout Component
 * Provides a consistent page structure including a main title and a two-column content area.
 *
 * Props:
 * - title (string): The main title of the page (e.g., "Class Management").
 * - errorMessage (string, optional): An error message to display at the top of the content.
 * - children (ReactNode): The main content of the page, typically containing the table and form sections.
 */
const PageLayout = ({ title, errorMessage, children }) => {
    return (
        <div className="page-container">
            {/* Main Page Title */}
            <h2 className="main-section-title">{title}</h2>

            {/* Global Error Message Display */}
            {errorMessage && (
                <p className="error-message text-center">{errorMessage}</p>
            )}

            {/* Main content area, designed for a two-column layout on larger screens */}
            <div className="main-content-layout">
                {children} {/* This is where the table and form sections will be rendered */}
            </div>
        </div>
    );
};

export default PageLayout;
