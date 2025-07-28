// src/components/common/TableSection.jsx
import React from 'react';
import { FaSearch, FaFilePdf, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../../styles/Table.css'; // Import generic table styles

/**
 * TableSection Component
 * Provides a generic structure for displaying data in a table, including search, PDF download, and pagination.
 *
 * Props:
 * - sectionTitle (string): The title for this table section (e.g., "Existing Classes").
 * - searchTerm (string): Current value of the search input.
 * - onSearchChange (function): Callback for search input changes.
 * - onDownloadPdf (function): Callback for PDF download button click.
 * - loading (boolean): Indicates if data is currently loading.
 * - data (array): The array of data items to display.
 * - renderTableContent (function): A function that renders the <thead> and <tbody> of the actual table.
 * It receives `currentItems` and `tableBodyRef` as arguments.
 * - currentPage (number): Current page number for pagination.
 * - totalPages (number): Total number of pages for pagination.
 * - goToPrevPage (function): Callback for previous page button.
 * - goToNextPage (function): Callback for next page button.
 * - itemsPerPage (number): Number of items per page (for display in pagination info).
 * - tableBodyRef (RefObject): Ref to be attached to the <tbody> element for scrolling.
 */
const TableSection = ({
    sectionTitle,
    searchTerm,
    onSearchChange,
    onDownloadPdf,
    loading,
    data, // This is the filtered data, not necessarily paginated yet
    renderTableContent, // Function to render <thead> and <tbody>
    currentPage,
    totalPages,
    goToPrevPage,
    goToNextPage,
    itemsPerPage,
    tableBodyRef,
}) => {
    return (
        <div className="table-section-card section-container">
            <h3 className="section-header">{sectionTitle}</h3>

            {/* Search and PDF Download Section */}
            <div className="table-controls">
                <div className="search-input-group">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={onSearchChange}
                        className="search-input"
                    />
                    <FaSearch className="search-icon" />
                </div>
                <button onClick={onDownloadPdf} className="btn btn-primary download-pdf-btn">
                    <FaFilePdf className="mr-2" /> Download PDF
                </button>
            </div>

            {/* Table Content Area */}
            {loading && data.length === 0 ? (
                <p className="loading-state">Loading data...</p>
            ) : data.length === 0 ? (
                <p className="no-data-message">No data found matching your criteria. Start by adding one!</p>
            ) : (
                <>
                    {/* ADDED A WRAPPER DIV WITH table-container CLASS */}
                    <div className="table-container">
                        {/* CHANGED class to app-table for consistency with Table.css */}
                        {/* The renderTableContent will now receive currentItems and tableBodyRef */}
                        <table className="app-table">
                            {renderTableContent(data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), tableBodyRef)}
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={goToPrevPage} disabled={currentPage === 1} className="btn btn-page">
                                <FaChevronLeft /> Previous
                            </button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <button onClick={goToNextPage} disabled={currentPage === totalPages} className="btn btn-page">
                                Next <FaChevronRight />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TableSection;