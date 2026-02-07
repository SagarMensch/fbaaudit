import { ShipmentUpload, ShipmentDocument, OCRAnalysisResult } from '../types';

class OCRService {

    // THE "BABU" DICTIONARY (Hinglish Support)
    private DANGER_WORDS = [
        "damage", "damadge", "broken", "leak", "leaking", // English
        "toota", "futa", "kam", "short", "missing",       // Hindi/Hinglish
        "late", "detention", "waiting", "hold", "roka"    // Delays
    ];

    // SIMULATED PROCESS
    async processUpload(uploadId: string, fileUrl: string): Promise<ShipmentUpload> {

        // 1. SPLIT & CLASSIFY (Mocking 3 pages split)
        // In real life, use pdf2image + opencv
        const splitDocs: ShipmentDocument[] = [
            {
                id: `DOC-${Date.now()}-1`,
                type: 'INVOICE',
                pageNumber: 1,
                imageUrl: 'https://fake-url.com/invoice.jpg',
                status: 'COMPLETED',
                docAmount: 45000,
                docNumber: 'INV-8899',
                docDate: '2025-12-15'
            },
            {
                id: `DOC-${Date.now()}-2`,
                type: 'POD',
                pageNumber: 2,
                imageUrl: 'https://fake-url.com/pod.jpg',
                status: 'PROCESSING'
            },
            {
                id: `DOC-${Date.now()}-3`,
                type: 'WEIGHT_SLIP',
                pageNumber: 3,
                imageUrl: 'https://fake-url.com/weight.jpg',
                status: 'COMPLETED'
            }
        ];

        // 2. RUN "BABU" ANALYSIS ON POD
        // We simulate a processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const podDoc = splitDocs.find(d => d.type === 'POD');
        if (podDoc) {
            const analysis = this.analyzePODMarkup(fileUrl);
            podDoc.ocrResult = analysis;
            podDoc.status = analysis.isClean ? 'COMPLETED' : 'FLAGGED';
        }

        // 3. AGGREGATE RESULTS
        const allFlags = splitDocs
            .filter(d => d.ocrResult && !d.ocrResult.isClean)
            .flatMap(d => d.ocrResult!.detectedKeywords);

        return {
            id: uploadId,
            shipmentId: 'SHP-2025-001',
            rawFileUrl: fileUrl,
            uploadedAt: new Date().toISOString(),
            splitDocuments: splitDocs,
            overallStatus: allFlags.length > 0 ? 'NEEDS_REVIEW' : 'COMPLETED',
            flaggedKeywords: allFlags
        };
    }

    // THE CORE LOGIC
    private analyzePODMarkup(fileUrl: string): OCRAnalysisResult {
        // MOCK: Determine outcome based on filename/url "triggers" for demo
        // If fileUrl contains "damage", we simulate a dirty POD
        // If "clean", we simulate clean

        const isDirtyScenario = fileUrl.includes('damage');
        const isLateScenario = fileUrl.includes('late');

        if (isDirtyScenario) {
            return {
                fullText: "Received 2 box damage recd. Driver signature...",
                detectedKeywords: ["damage"],
                isClean: false,
                confidence: 0.88,
                handwritingDetected: true
            };
        }

        if (isLateScenario) {
            return {
                fullText: "Gadi 2 day late pahuncha. Roka gaya tha.",
                detectedKeywords: ["late", "roka"],
                isClean: false,
                confidence: 0.92,
                handwritingDetected: true
            };
        }

        return {
            fullText: "Received in good condition. Signature...",
            detectedKeywords: [],
            isClean: true,
            confidence: 0.98,
            handwritingDetected: true // Signatures count as handwriting
        };
    }
}

export const ocrService = new OCRService();
