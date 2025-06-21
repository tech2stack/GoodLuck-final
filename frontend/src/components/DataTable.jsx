// src/components/DataTable.jsx

import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa'; // Import icons

const DataTable = ({ data, columns, onEdit, onDelete, entityType }) => {
    if (!data || data.length === 0) {
        return <p>No {entityType} data available.</p>;
    }

    return (
        <div className="table-responsive">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index}>{col.header}</th>
                        ))}
                        {(onEdit || onDelete) && <th className="action-column">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <tr key={item._id || item.id}> {/* Use _id for MongoDB, or id */}
                            {columns.map((col, index) => {
                                let cellContent = item[col.accessor];
                                if (col.isNested && typeof col.accessor === 'string') {
                                    // Handle nested accessors like 'branchId.name'
                                    const parts = col.accessor.split('.');
                                    cellContent = parts.reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : 'N/A', item);
                                }
                                return <td key={index}>{cellContent}</td>;
                            })}
                            {(onEdit || onDelete) && (
                                <td className="action-buttons-cell">
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="btn btn-sm btn-info mr-2" // Make sure these CSS classes are defined
                                            title={`Edit ${entityType}`}
                                        >
                                            <FaEdit />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(item._id || item.id)}
                                            className="btn btn-sm btn-danger" // Make sure these CSS classes are defined
                                            title={`Delete ${entityType}`}
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;