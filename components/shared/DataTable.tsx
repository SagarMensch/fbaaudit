// Shared DataTable Component
// Reusable table with sorting, filtering, and pagination

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
    key: string;
    header: string;
    accessor: (row: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (row: T) => void;
    sortable?: boolean;
    pagination?: boolean;
    pageSize?: number;
    emptyMessage?: string;
    className?: string;
    rowClassName?: (row: T) => string;
}

/**
 * Data Table Component
 * 
 * Feature-rich table with sorting, pagination, and row click handling.
 * Fully typed with TypeScript generics.
 * 
 * @example
 * ```tsx
 * <DataTable
 *   data={invoices}
 *   columns={[
 *     { key: 'id', header: 'Invoice #', accessor: (row) => row.invoiceNumber },
 *     { key: 'amount', header: 'Amount', accessor: (row) => `₹${row.amount}`, sortable: true },
 *     { key: 'status', header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> }
 *   ]}
 *   onRowClick={(invoice) => handleViewInvoice(invoice)}
 *   pagination
 *   pageSize={10}
 * />
 * ```
 */
export function DataTable<T>({
    data,
    columns,
    onRowClick,
    sortable = true,
    pagination = false,
    pageSize = 10,
    emptyMessage = 'No data available',
    className = '',
    rowClassName
}: DataTableProps<T>) {
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Sorting logic
    const sortedData = useMemo(() => {
        if (!sortConfig) return data;

        const sorted = [...data].sort((a, b) => {
            const column = columns.find(col => col.key === sortConfig.key);
            if (!column) return 0;

            const aValue = column.accessor(a);
            const bValue = column.accessor(b);

            // Handle different types
            const aStr = String(aValue);
            const bStr = String(bValue);

            if (sortConfig.direction === 'asc') {
                return aStr.localeCompare(bStr, undefined, { numeric: true });
            } else {
                return bStr.localeCompare(aStr, undefined, { numeric: true });
            }
        });

        return sorted;
    }, [data, sortConfig, columns]);

    // Pagination logic
    const paginatedData = useMemo(() => {
        if (!pagination) return sortedData;

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, currentPage, pageSize, pagination]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    const handleSort = (columnKey: string) => {
        if (!sortable) return;

        const column = columns.find(col => col.key === columnKey);
        if (!column?.sortable) return;

        setSortConfig(current => {
            if (!current || current.key !== columnKey) {
                return { key: columnKey, direction: 'asc' };
            }
            if (current.direction === 'asc') {
                return { key: columnKey, direction: 'desc' };
            }
            return null; // Reset sorting
        });
    };

    const getSortIcon = (columnKey: string) => {
        const column = columns.find(col => col.key === columnKey);
        if (!column?.sortable) return null;

        if (!sortConfig || sortConfig.key !== columnKey) {
            return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
        }

        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-4 h-4 text-blue-600" />
        ) : (
            <ChevronDown className="w-4 h-4 text-blue-600" />
        );
    };

    const getAlignClass = (align?: 'left' | 'center' | 'right') => {
        switch (align) {
            case 'center':
                return 'text-center';
            case 'right':
                return 'text-right';
            default:
                return 'text-left';
        }
    };

    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className={`overflow-hidden ${className}`}>
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    onClick={() => handleSort(column.key)}
                                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${getAlignClass(column.align)
                                        } ${column.sortable && sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                    style={{ width: column.width }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{column.header}</span>
                                        {getSortIcon(column.key)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedData.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                onClick={() => onRowClick?.(row)}
                                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                                    } transition-colors ${rowClassName?.(row) || ''}`}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${getAlignClass(
                                            column.align
                                        )}`}
                                    >
                                        {column.accessor(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                                <span className="font-medium">
                                    {Math.min(currentPage * pageSize, sortedData.length)}
                                </span>{' '}
                                of <span className="font-medium">{sortedData.length}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;
