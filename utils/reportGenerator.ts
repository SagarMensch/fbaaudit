import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '../types';

export const generatePDFReport = (title: string, data: any[], columns: string[]) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(0, 77, 64); // Teal color
    doc.text(title, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Table
    autoTable(doc, {
        head: [columns],
        body: data,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [0, 77, 64] },
        styles: { fontSize: 8 },
    });

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`);
};

export const generateCSVReport = (title: string, data: any[], columns: string[]) => {
    const header = columns.join(',');
    const rows = data.map(row => row.join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${header}\n${rows}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`Success! ${title} has been downloaded.`);
};

export const formatInvoiceDataForReport = (invoices: Invoice[]) => {
    return invoices.map(inv => [
        inv.invoiceNumber,
        inv.carrier,
        inv.amount.toFixed(2),
        inv.currency,
        inv.date,
        inv.status,
        inv.variance.toFixed(2),
        inv.reason || 'N/A'
    ]);
};

export const INVOICE_REPORT_COLUMNS = [
    'Invoice #', 'Carrier', 'Amount', 'Currency', 'Date', 'Status', 'Variance', 'Reason'
];

export const generateAuditTrailPDF = (invoice: Invoice) => {
    try {
        const doc = new jsPDF();

        // 1. Title & Header
        doc.setFontSize(20);
        doc.setTextColor(0, 77, 64); // Teal
        doc.text(`Audit Trail: ${invoice.invoiceNumber}`, 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Invoice ID: ${invoice.id}`, 14, 35);
        doc.text(`Carrier: ${invoice.carrier}`, 14, 40);

        // 2. Workflow History Section
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Workflow History", 14, 55);

        const workflowColumns = ['Step', 'Approver', 'Role', 'Status', 'Timestamp', 'Comments'];
        const workflowData = invoice.workflowHistory?.map(step => [
            step.stepId, // In real app, map ID to Name
            step.approverName || 'Pending',
            step.approverRole || '-',
            step.status,
            step.timestamp || '-',
            step.comment || '-'
        ]) || [];

        autoTable(doc, {
            head: [workflowColumns],
            body: workflowData,
            startY: 60,
            theme: 'striped',
            headStyles: { fillColor: [63, 81, 181] }, // Indigo
            styles: { fontSize: 8 },
        });

        // 3. Dispute/Exception History (if any)
        let finalY = (doc as any).lastAutoTable.finalY + 15;

        if (invoice.dispute) {
            doc.text("Dispute & Exception Log", 14, finalY);

            const disputeColumns = ['Actor', 'Action', 'Timestamp', 'Comment'];
            const disputeData = invoice.dispute.history.map(item => [
                item.actor,
                item.action,
                item.timestamp,
                item.comment || '-'
            ]);

            autoTable(doc, {
                head: [disputeColumns],
                body: disputeData,
                startY: finalY + 5,
                theme: 'striped',
                headStyles: { fillColor: [183, 28, 28] }, // Red
                styles: { fontSize: 8 },
            });
        }

        // 4. Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount} - Confidential Audit Record`, 100, 290, { align: 'center' });
        }
        doc.save(`Audit_Trail_${invoice.invoiceNumber}.pdf`);
        console.log("PDF Generated Successfully: Audit Trail for " + invoice.invoiceNumber);
    } catch (error) {
        console.error("PDF Generation Failed:", error);
    }
};
