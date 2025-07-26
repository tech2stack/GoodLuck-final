// src/components/common/SectionCard.jsx
import React from 'react';
import '../../styles/CommonLayout.css'; // For .section-container and .section-header styles

/**
 * SectionCard Component
 * Provides a consistent card-like container for sections like forms or tables.
 *
 * Props:
 * - title (string): The header for this section (e.g., "Existing Classes", "Add Class").
 * - children (ReactNode): The content to be placed inside the card (e.g., table, form elements).
 * - className (string, optional): Additional class names for custom styling (e.g., "table-section-card", "form-section-card").
 */
const SectionCard = ({ title, children, className }) => {
    return (
        <div className={`section-container ${className || ''}`}>
            {/* Section Header */}
            <h3 className="section-header">{title}</h3>
            {children} {/* Content of the section (table, form, etc.) */}
        </div>
    );
};

export default SectionCard;
