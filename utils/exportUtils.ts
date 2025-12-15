
/**
 * Universal CSV Export Utility
 * Converts an array of objects to a CSV string and triggers a browser download.
 * 
 * @param data Array of objects to export
 * @param filename Desired filename (without extension)
 * @param columns Optional specific columns to export (array of keys). If omitted, uses all keys from first object.
 */
export const exportToCSV = <T extends Record<string, any>>(data: T[], filename: string, columns?: (keyof T)[]) => {
    if (!data || data.length === 0) {
        console.warn("Export aborted: No data provided.");
        return;
    }

    // Determine headers
    const headers = columns || Object.keys(data[0]);

    // Create CSV Content
    const csvContent = [
        headers.join(','), // Header Row
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Handle strings with commas or newlines by wrapping in quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    // Create Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create Link
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Trigger System Print Dialog
 */
export const triggerPrint = () => {
    window.print();
};
