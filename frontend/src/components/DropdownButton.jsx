// src/components/DropdownButton.jsx

import React, { useState, useRef, useEffect } from 'react';
// Import FaChevronDown if you want the arrow icon for the main dropdown buttons
import { FaChevronDown } from 'react-icons/fa';

// This component can serve two purposes:
// 1. A main button with a dropdown (e.g., "Branches", "Branch Admins", "Employees")
//    - Props: buttonText, icon, onViewClick, onAddClick
// 2. An item *within* another dropdown (e.g., "Overall Business Report" inside "Reports")
//    - Props: children (for text), onClick, icon (optional)

const DropdownButton = ({ buttonText, icon: Icon, onViewClick, onAddClick, children, onClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // This handles clicking outside to close the dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // If it's a simple dropdown item (e.g., for Reports dropdown)
    if (children) {
        return (
            <button className="dropdown-item" onClick={onClick}>
                {Icon && <Icon className="mr-2" />} {/* Render icon if provided */}
                {children}
            </button>
        );
    }

    // If it's a main dashboard button with a dropdown
    return (
        <div className="relative-dropdown" ref={dropdownRef}>
            <button
                className="action-button"
                onClick={() => setIsOpen(!isOpen)}
            >
                {Icon && <Icon className="icon" />}
                <span>{buttonText}</span>
                <FaChevronDown className={`dropdown-arrow ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={() => { onViewClick(); setIsOpen(false); }}>
                        View All {buttonText}
                    </button>
                    <button className="dropdown-item" onClick={() => { onAddClick(); setIsOpen(false); }}>
                        Add New {buttonText.slice(0, -1)} {/* e.g., 'Branches' -> 'Branch' */}
                    </button>
                </div>
            )}
        </div>
    );
};

export default DropdownButton;