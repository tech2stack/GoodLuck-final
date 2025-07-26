// src/components/common/FormSection.jsx
import React from 'react';
import '../../styles/Form.css'; // Import generic form styles

/**
 * FormSection Component
 * Provides a generic structure for a form, including a header, form groups, and action buttons.
 *
 * Props:
 * - sectionTitle (string): The title for this form section (e.g., "Add Class", "Edit Zone").
 * - onSubmit (function): Callback for form submission.
 * - children (ReactNode): The form fields (labels, inputs, selects) and action buttons to be rendered inside the form.
 */
const FormSection = ({ sectionTitle, onSubmit, children }) => {
    return (
        <div className="form-section-card section-container">
            <form onSubmit={onSubmit} className="app-form">
                <h3 className="section-header">{sectionTitle}</h3>
                {children} {/* Render form fields and action buttons */}
            </form>
        </div>
    );
};

export default FormSection;
