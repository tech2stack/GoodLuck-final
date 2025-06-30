// src/components/common/SummaryCard.jsx
import React from 'react';

// Common styling for summary cards (This CSS file will be provided in the next file)
import '../../styles/SummaryCards.css';

const SummaryCard = ({ title, count, icon: Icon, color }) => {
    return (
        <div className={`summary-card ${color}`}>
            {/* Render icon if provided */}
            {Icon && <Icon className="summary-icon" />}
            {/* Display the title of the summary card */}
            <p className="summary-title">{title}:</p>
            {/* Display the count for the metric */}
            <p className="summary-count">{count}</p>
        </div>
    );
};

export default SummaryCard;
