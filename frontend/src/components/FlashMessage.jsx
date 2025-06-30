// src/components/FlashMessage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { FaInfoCircle, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

// Styles for the flash message itself
import '../styles/FlashMessage.css'; // This file will be provided next

const FlashMessage = ({ message, type, onClose, className }) => {
    // Determine icon based on message type
    const getIcon = useCallback(() => {
        switch (type) {
            case 'success':
                return <FaCheckCircle className="flash-icon success-icon" />;
            case 'error':
                return <FaExclamationCircle className="flash-icon error-icon" />;
            case 'info':
            default:
                return <FaInfoCircle className="flash-icon info-icon" />;
        }
    }, [type]);

    // Render nothing if no message is provided
    if (!message) {
        return null;
    }

    // `className` prop will handle `show` and `hide` animation classes
    return (
        <div className={`flash-message-container ${type} ${className}`}>
            <div className="flash-message-content">
                {getIcon()}
                <p>{message}</p>
            </div>
            {/* Optional close button if needed, although App.js clears it automatically */}
            {onClose && (
                <button onClick={onClose} className="flash-message-close-btn">
                    &times;
                </button>
            )}
        </div>
    );
};

export default FlashMessage;
