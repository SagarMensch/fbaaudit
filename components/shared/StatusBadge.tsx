// Shared Status Badge Component
// Consistent status rendering across the application

import React from 'react';

export type StatusVariant = 'invoice' | 'contract' | 'vendor' | 'payment' | 'workflow';

export interface StatusBadgeProps {
    status: string;
    variant?: StatusVariant;
    className?: string;
}

/**
 * Status Badge Component
 * 
 * Renders status with consistent styling based on variant.
 * Automatically determines color based on status value.
 * 
 * @example
 * ```tsx
 * <StatusBadge status="APPROVED" variant="invoice" />
 * <StatusBadge status="ACTIVE" variant="contract" />
 * <StatusBadge status="PAID" variant="payment" />
 * ```
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    variant = 'invoice',
    className = ''
}) => {
    const getStatusStyle = (): string => {
        const statusUpper = status.toUpperCase();

        // Invoice statuses
        if (variant === 'invoice') {
            if (statusUpper === 'APPROVED' || statusUpper === 'PAID') {
                return 'bg-green-100 text-green-800 border-green-200';
            }
            if (statusUpper === 'PENDING' || statusUpper === 'OPS_APPROVED' || statusUpper === 'FINANCE_APPROVED') {
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            }
            if (statusUpper === 'REJECTED') {
                return 'bg-red-100 text-red-800 border-red-200';
            }
            if (statusUpper === 'EXCEPTION' || statusUpper === 'VENDOR_RESPONDED') {
                return 'bg-orange-100 text-orange-800 border-orange-200';
            }
        }

        // Contract statuses
        if (variant === 'contract') {
            if (statusUpper === 'ACTIVE') {
                return 'bg-green-100 text-green-800 border-green-200';
            }
            if (statusUpper === 'PENDING_APPROVAL' || statusUpper === 'DRAFT') {
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            }
            if (statusUpper === 'EXPIRED' || statusUpper === 'EXPIRING') {
                return 'bg-red-100 text-red-800 border-red-200';
            }
        }

        // Vendor statuses
        if (variant === 'vendor') {
            if (statusUpper === 'ACTIVE' || statusUpper === 'APPROVED') {
                return 'bg-green-100 text-green-800 border-green-200';
            }
            if (statusUpper === 'INACTIVE' || statusUpper === 'SUSPENDED') {
                return 'bg-red-100 text-red-800 border-red-200';
            }
            if (statusUpper === 'PENDING') {
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            }
        }

        // Payment statuses
        if (variant === 'payment') {
            if (statusUpper === 'PAID' || statusUpper === 'SENT_TO_BANK') {
                return 'bg-green-100 text-green-800 border-green-200';
            }
            if (statusUpper === 'AWAITING_APPROVAL' || statusUpper === 'DRAFT') {
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            }
            if (statusUpper === 'REJECTED') {
                return 'bg-red-100 text-red-800 border-red-200';
            }
        }

        // Workflow statuses
        if (variant === 'workflow') {
            if (statusUpper === 'APPROVED' || statusUpper === 'COMPLETED') {
                return 'bg-green-100 text-green-800 border-green-200';
            }
            if (statusUpper === 'PENDING' || statusUpper === 'ACTIVE' || statusUpper === 'PROCESSING') {
                return 'bg-blue-100 text-blue-800 border-blue-200';
            }
            if (statusUpper === 'REJECTED' || statusUpper === 'FAILED') {
                return 'bg-red-100 text-red-800 border-red-200';
            }
            if (statusUpper === 'SKIPPED') {
                return 'bg-gray-100 text-gray-800 border-gray-200';
            }
        }

        // Default
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const formatStatus = (status: string): string => {
        return status
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle()} ${className}`}
        >
            {formatStatus(status)}
        </span>
    );
};

/**
 * Status Dot Component
 * Minimal status indicator (just a colored dot)
 */
export const StatusDot: React.FC<{
    status: string;
    variant?: StatusVariant;
    size?: 'sm' | 'md' | 'lg';
}> = ({ status, variant = 'invoice', size = 'md' }) => {
    const getColor = (): string => {
        const statusUpper = status.toUpperCase();

        if (statusUpper.includes('APPROVED') || statusUpper.includes('PAID') || statusUpper.includes('ACTIVE')) {
            return 'bg-green-500';
        }
        if (statusUpper.includes('PENDING') || statusUpper.includes('DRAFT')) {
            return 'bg-yellow-500';
        }
        if (statusUpper.includes('REJECTED') || statusUpper.includes('EXPIRED')) {
            return 'bg-red-500';
        }
        if (statusUpper.includes('EXCEPTION')) {
            return 'bg-orange-500';
        }
        return 'bg-gray-500';
    };

    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4'
    };

    return (
        <span className={`inline-block rounded-full ${getColor()} ${sizeClasses[size]}`} />
    );
};

export default StatusBadge;
