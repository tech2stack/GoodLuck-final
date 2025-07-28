// src/components/common/FormSection.jsx
import React from 'react';
import '../../styles/Form.css'; // Ensure this path is absolutely correct
import '../../styles/CommonLayout.css'; // Also ensure CommonLayout.css is imported for section-container, etc.

const FormSection = ({ sectionTitle, onSubmit, children }) => {
    return (
        <div className="form-section-card section-container"> {/* CommonLayout.css for these */}
            <h3 className="section-header">{sectionTitle}</h3> {/* CommonLayout.css for this */}
            <form onSubmit={onSubmit} className="app-form"> {/* Form.css applies here */}
                {children}
            </form>
        </div>
    );
};

export default FormSection;