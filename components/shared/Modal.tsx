// Shared Modal Component
// Replaces custom modal implementations across the application

import React from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    footer?: React.ReactNode;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    className?: string;
}

/**
 * Shared Modal Component
 * 
 * Consistent modal implementation across the application.
 * Supports multiple sizes, custom footers, and flexible content.
 * 
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   title="Invoice Details"
 *   size="lg"
 *   footer={
 *     <div className="flex gap-2">
 *       <button onClick={handleSave}>Save</button>
 *       <button onClick={onClose}>Cancel</button>
 *     </div>
 *   }
 * >
 *   <p>Modal content here</p>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    footer,
    showCloseButton = true,
    closeOnOverlayClick = true,
    className = ''
}) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-[95vw]'
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && closeOnOverlayClick) {
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className={`bg-white rounded-lg shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                        {title}
                    </h2>
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Modal Footer Helper Component
 * Pre-styled footer with common button layouts
 */
export const ModalFooter: React.FC<{
    onCancel?: () => void;
    onConfirm?: () => void;
    cancelText?: string;
    confirmText?: string;
    confirmDisabled?: boolean;
    confirmLoading?: boolean;
    children?: React.ReactNode;
}> = ({
    onCancel,
    onConfirm,
    cancelText = 'Cancel',
    confirmText = 'Confirm',
    confirmDisabled = false,
    confirmLoading = false,
    children
}) => {
        if (children) {
            return <div className="flex justify-end gap-3">{children}</div>;
        }

        return (
            <div className="flex justify-end gap-3">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                )}
                {onConfirm && (
                    <button
                        onClick={onConfirm}
                        disabled={confirmDisabled || confirmLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {confirmLoading ? 'Loading...' : confirmText}
                    </button>
                )}
            </div>
        );
    };

export default Modal;
