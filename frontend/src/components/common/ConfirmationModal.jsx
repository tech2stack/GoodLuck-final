// src/components/common/ConfirmationModal.jsx
import React from 'react';
import '../../styles/Modal.css'; // Import generic modal styles
import '../../styles/Form.css'; // For generic button styles (.btn, .btn-danger, .btn-secondary)

/**
 * ConfirmationModal Component
 * Displays a generic confirmation dialog with customizable title, message, and action buttons.
 *
 * Props:
 * - show (boolean): Controls the visibility of the modal.
 * - title (string): The title of the modal (e.g., "Confirm Deletion").
 * - message (string): The main message/question displayed in the modal.
 * - onConfirm (function): Callback function to execute when the confirm button is clicked.
 * - onCancel (function): Callback function to execute when the cancel button is clicked.
 * - confirmText (string, optional): Text for the confirm button (default: "Confirm").
 * - cancelText (string, optional): Text for the cancel button (default: "Cancel").
 * - loading (boolean, optional): If true, disables buttons and can show loading state.
 */
const ConfirmationModal = ({
    show,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    loading = false,
}) => {
    if (!show) {
        return null; // Don't render if not visible
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="modal-actions">
                    <button onClick={onConfirm} className="btn btn-danger" disabled={loading}>
                        {loading ? 'Processing...' : confirmText}
                    </button>
                    <button onClick={onCancel} className="btn btn-secondary" disabled={loading}>
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
