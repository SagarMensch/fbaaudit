
const SEGMENT_NAMES = {
    B3: 'Beginning Segment for Carrier\'s Invoice',
};

const parseEDI = (raw) => {
    const cleanRaw = raw.trim();
    const elementSeparator = '*';
    const segmentTerminator = '~';

    const segments = cleanRaw.split(segmentTerminator)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => {
            const elements = s.split(elementSeparator);
            const id = elements[0];
            return {
                id,
                elements: elements.slice(1), // Exclude ID
            };
        });

    const metadata = {};

    segments.forEach(seg => {
        if (seg.id === 'B3') {
            // B3*B*INV-EDI-999*123456789*PP*20231205*1500.00*USD*20231205~
            // Elements (slice 1):
            // 0: B
            // 1: INV-EDI-999
            // 2: 123456789
            // 3: PP
            // 4: 20231205
            // 5: 1500.00
            // 6: USD
            // 7: 20231205

            metadata.invoiceNumber = seg.elements[1];

            const amountStr = seg.elements[5];
            if (amountStr && !amountStr.includes('.')) {
                metadata.amount = parseFloat(amountStr) / 100;
            } else {
                metadata.amount = parseFloat(amountStr || '0');
            }

            metadata.date = seg.elements[4];
            metadata.currency = seg.elements[6] || 'USD';
        }
    });

    return { segments, metadata };
};

const SAMPLE_EDI_210 = `ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *231205*1000*U*00401*000000001*0*P*>~
GS*IN*SENDERID*RECEIVERID*20231205*1000*1*X*004010~
ST*210*0001~
B3*B*INV-EDI-999*123456789*PP*20231205*1500.00*USD*20231205~
N1*CA*MAERSK LINE*25*123456~
SE*12*0001~
GE*1*1~
IEA*1*000000001~`;

console.log("--- START TEST ---");
const result = parseEDI(SAMPLE_EDI_210);
console.log("Invoice Number:", result.metadata.invoiceNumber);
console.log("Amount:", result.metadata.amount);
console.log("Date:", result.metadata.date);
console.log("Currency:", result.metadata.currency);
console.log("--- END TEST ---");
