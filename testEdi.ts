
import { parseEDI, SAMPLE_EDI_210 } from './utils/ediParser';

try {
    console.log("Testing EDI Parser...");
    const result = parseEDI(SAMPLE_EDI_210);
    console.log("Parse Success!");
    console.log("Invoice Number:", result.metadata.invoiceNumber);
    console.log("Amount:", result.metadata.amount);
    console.log("Segment Count:", result.segments.length);
} catch (error) {
    console.error("Parse Failed:", error);
}
