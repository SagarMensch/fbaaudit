
export interface ParsedEdiSegment {
    id: string;
    name: string;
    elements: string[];
}

export interface ParsedEdi {
    segments: ParsedEdiSegment[];
    raw: string;
    metadata: {
        senderId?: string;
        receiverId?: string;
        controlNumber?: string;
        type?: string;
        invoiceNumber?: string;
        amount?: number;
        currency?: string;
        date?: string;
        carrier?: string;
    };
}

const SEGMENT_NAMES: Record<string, string> = {
    ISA: 'Interchange Control Header',
    GS: 'Functional Group Header',
    ST: 'Transaction Set Header',
    B3: 'Beginning Segment for Carrier\'s Invoice',
    BIG: 'Beginning Segment for Invoice',
    N1: 'Name',
    N3: 'Address Information',
    N4: 'Geographic Location',
    LX: 'Assigned Number',
    L5: 'Description, Marks and Numbers',
    L0: 'Line Item - Quantity and Weight',
    L1: 'Rate and Charges',
    L7: 'Tariff Reference',
    TDS: 'Total Monetary Value Summary',
    SE: 'Transaction Set Trailer',
    GE: 'Functional Group Trailer',
    IEA: 'Interchange Control Trailer',
};

export const parseEDI = (raw: string): ParsedEdi => {
    const cleanRaw = raw.trim();
    // Detect delimiter (usually * or |)
    // ISA segment is fixed length, element separator is at index 3
    const elementSeparator = cleanRaw.length > 3 ? cleanRaw[3] : '*';
    const segmentTerminator = cleanRaw.includes('~') ? '~' : '\n';

    const segments = cleanRaw.split(segmentTerminator)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => {
            const elements = s.split(elementSeparator);
            const id = elements[0];
            return {
                id,
                name: SEGMENT_NAMES[id] || 'Unknown Segment',
                elements: elements.slice(1),
            };
        });

    // Extract Metadata
    const metadata: ParsedEdi['metadata'] = {};

    segments.forEach(seg => {
        if (seg.id === 'ISA') {
            metadata.senderId = seg.elements[5]?.trim();
            metadata.receiverId = seg.elements[7]?.trim();
            metadata.controlNumber = seg.elements[12];
        }
        if (seg.id === 'ST') {
            metadata.type = seg.elements[0]; // e.g., 210
        }
        if (seg.id === 'B3') { // X12 210 Invoice
            metadata.invoiceNumber = seg.elements[1];
            // B306 is Amount (Index 5 in 0-based elements array)
            const amountStr = seg.elements[5];
            if (amountStr && !amountStr.includes('.')) {
                metadata.amount = parseFloat(amountStr) / 100; // Assume implied decimal if no dot
            } else {
                metadata.amount = parseFloat(amountStr || '0');
            }
            metadata.date = seg.elements[4]; // YYYYMMDD (Index 4)
            metadata.currency = seg.elements[6] || 'USD'; // Index 6
        }
        if (seg.id === 'N1' && seg.elements[0] === 'CA') { // Carrier
            metadata.carrier = seg.elements[1];
        }
    });

    return {
        segments,
        raw: cleanRaw,
        metadata
    };
};

export const SAMPLE_EDI_210 = `ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *231205*1000*U*00401*000000001*0*P*>~
GS*IN*SENDERID*RECEIVERID*20231205*1000*1*X*004010~
ST*210*0001~
B3*B*INV-EDI-LIVE-001*123456789*PP*20231205*1500.00*USD*20231205~
N1*CA*MAERSK LINE*25*123456~
N1*SH*HITACHI ENERGY*92*555555~
N1*CN*HITACHI ENERGY*92*555555~
N3*123 SHIPPING LANE~
N4*RALEIGH*NC*27606*US~
LX*1~
L5*1*ELECTRONIC COMPONENTS~
L0*1*1000*FR*4500*G~
L1*1*1500.00*FR*1500.00~
TDS*150000~
SE*12*0001~
GE*1*1~
IEA*1*000000001~`;
