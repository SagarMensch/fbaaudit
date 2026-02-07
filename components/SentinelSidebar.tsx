import React, { useState, useEffect } from 'react';

interface RingResult {
    ring: number;
    name: string;
    status: 'PASS' | 'FAIL' | 'SKIP' | 'WARN';
    block_type: 'HARD' | 'SOFT' | null;
    message: string;
    details?: Record<string, any>;
}

interface SentinelResult {
    can_submit: boolean;
    total_rings: number;
    passed: number;
    hard_blocks: number;
    soft_blocks: number;
    rings: RingResult[];
    message: string;
}

interface SentinelSidebarProps {
    invoiceData: {
        origin: string;
        destination: string;
        vendor_amount: number;
        vendor_id: string;
        vehicle_no: string;
        invoice_date: string;
        document_path?: string;
        invoice_no?: string;
    };
    onValidationComplete?: (canSubmit: boolean) => void;
    onUploadDocument?: (documentType: string) => void;
}

// Ring labels
const RING_LABELS: Record<number, string> = {
    1: 'Contract Matching',
    2: 'Anomaly Detection',
    3: 'Document Quality',
    4: 'Duplicate Check',
};

export const SentinelSidebar: React.FC<SentinelSidebarProps> = ({ invoiceData, onValidationComplete, onUploadDocument }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SentinelResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const hasRequiredFields = invoiceData.origin &&
            invoiceData.destination &&
            invoiceData.vendor_amount > 0;
        if (hasRequiredFields) {
            validateAll();
        }
    }, [invoiceData.origin, invoiceData.destination, invoiceData.vendor_amount, invoiceData.vehicle_no]);

    const validateAll = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('http://localhost:5000/api/sentinel/validate-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData)
            });

            const data = await res.json();
            setResult(data);

            if (onValidationComplete) {
                onValidationComplete(data.can_submit);
            }
        } catch (err) {
            setError('Service unavailable');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => `₹${val?.toLocaleString() || 0}`;

    return (
        <div style={{
            backgroundColor: '#0A0A0A',
            minHeight: '100%',
            padding: '32px',
            fontFamily: "'Berkeley Mono', 'SF Mono', 'Consolas', monospace"
        }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                        {/* 3D Isometric Shield - True 3D Style */}
                        {/* Right face */}
                        <path d="M24 12 L38 18 V30 L24 42 Z" fill="#00C805" stroke="#ffffff" strokeWidth="1.5" />
                        {/* Left face */}
                        <path d="M24 12 L10 18 V30 L24 42 Z" fill="#009904" stroke="#ffffff" strokeWidth="1.5" />
                        {/* Top face */}
                        <path d="M24 6 L38 12 L24 18 L10 12 Z" fill="#33FF33" stroke="#ffffff" strokeWidth="1" />
                        {/* Inner check mark */}
                        <path d="M17 24 L22 29 L31 18" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                    <div>
                        <h1 style={{
                            color: '#FFFFFF',
                            fontSize: '24px',
                            fontWeight: 600,
                            margin: 0,
                            letterSpacing: '-0.5px'
                        }}>
                            Atlas Sentinel
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
                            4-Ring Validation
                        </p>
                    </div>
                </div>
            </div>

            {/* Score Card */}
            {result && (
                <div style={{
                    backgroundColor: '#1A1A1A',
                    borderRadius: '24px',
                    padding: '32px',
                    marginBottom: '24px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '140px',
                        height: '140px',
                        borderRadius: '50%',
                        border: `6px solid ${result.can_submit ? '#00C805' : '#FFFFFF'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <span style={{
                            color: result.can_submit ? '#00C805' : '#FFFFFF',
                            fontSize: '48px',
                            fontWeight: 700,
                            lineHeight: 1
                        }}>
                            {result.passed}/{result.total_rings}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '4px' }}>
                            PASSED
                        </span>
                    </div>
                    <h2 style={{
                        color: result.can_submit ? '#00C805' : '#FFFFFF',
                        fontSize: '20px',
                        fontWeight: 600,
                        margin: '0 0 8px'
                    }}>
                        {result.can_submit ? 'Ready to Submit' : 'Action Required'}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
                        {result.message}
                    </p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div style={{
                    backgroundColor: '#1A1A1A',
                    borderRadius: '24px',
                    padding: '48px 32px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid #00C805',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        margin: '0 auto 24px',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: '#FFFFFF', fontSize: '16px', margin: 0 }}>
                        Validating...
                    </p>
                </div>
            )}

            {/* Ring Cards */}
            {result && result.rings && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {result.rings.map((ring) => {
                        const isPassed = ring.status === 'PASS';
                        const isFailed = ring.status === 'FAIL';
                        const isWarn = ring.status === 'WARN';

                        return (
                            <div
                                key={ring.ring}
                                style={{
                                    backgroundColor: '#1A1A1A',
                                    borderRadius: '16px',
                                    padding: '20px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    border: isFailed ? '2px solid #FFFFFF' : 'none'
                                }}
                            >
                                {/* Status Indicator */}
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    backgroundColor: isPassed ? '#00C805' : isFailed ? '#1A1A1A' : '#0052FF',
                                    border: isFailed ? '2px solid #FFFFFF' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {isPassed && (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M5 12l5 5L20 7" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    {isFailed && (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M6 6l12 12M6 18L18 6" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                    )}
                                    {isWarn && (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 9v4M12 17h.01" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                    )}
                                    {ring.status === 'SKIP' && (
                                        <span style={{ color: '#FFFFFF', fontSize: '16px' }}>—</span>
                                    )}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                        <span style={{
                                            color: '#FFFFFF',
                                            fontSize: '16px',
                                            fontWeight: 600
                                        }}>
                                            {RING_LABELS[ring.ring] || ring.name}
                                        </span>
                                        {ring.block_type && (
                                            <span style={{
                                                backgroundColor: ring.block_type === 'HARD' ? '#FFFFFF' : '#0052FF',
                                                color: ring.block_type === 'HARD' ? '#0A0A0A' : '#FFFFFF',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                padding: '4px 8px',
                                                borderRadius: '4px'
                                            }}>
                                                {ring.block_type === 'HARD' ? 'BLOCKS' : 'WARNING'}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{
                                        color: 'rgba(255,255,255,0.5)',
                                        fontSize: '13px',
                                        margin: 0,
                                        lineHeight: 1.4
                                    }}>
                                        {ring.message}
                                    </p>

                                    {/* Details for failed rings */}
                                    {ring.details && (ring.status === 'FAIL' || ring.status === 'WARN') && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '12px',
                                            backgroundColor: '#0A0A0A',
                                            borderRadius: '8px'
                                        }}>
                                            {ring.details.atlas_truth !== undefined && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Contract Rate</span>
                                                    <span style={{ color: '#00C805', fontSize: '12px', fontWeight: 600 }}>{formatCurrency(ring.details.atlas_truth)}</span>
                                                </div>
                                            )}
                                            {ring.details.vendor_amount !== undefined && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Invoiced</span>
                                                    <span style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>{formatCurrency(ring.details.vendor_amount)}</span>
                                                </div>
                                            )}
                                            {ring.details.deviation_percent !== undefined && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Deviation</span>
                                                    <span style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>{ring.details.deviation_percent > 0 ? '+' : ''}{ring.details.deviation_percent}%</span>
                                                </div>
                                            )}
                                            {ring.details.z_score !== undefined && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Z-Score</span>
                                                    <span style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>{ring.details.z_score}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Upload Button for Ring 3 (Document Quality) when failed */}
                                    {ring.ring === 3 && ring.status === 'FAIL' && onUploadDocument && (
                                        <button
                                            onClick={() => onUploadDocument('SUPPORTING_DOCS')}
                                            style={{
                                                marginTop: '12px',
                                                width: '100%',
                                                padding: '10px 16px',
                                                backgroundColor: '#1A1A1A',
                                                border: '2px solid #00C805',
                                                borderRadius: '8px',
                                                color: '#00C805',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 15V3M12 3l4 4M12 3L8 7" stroke="#00C805" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" stroke="#00C805" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Upload Missing Documents
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Route Info */}
            {invoiceData.origin && (
                <div style={{
                    marginTop: '24px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '16px',
                    padding: '20px 24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Route</span>
                        <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 500 }}>
                            {invoiceData.origin} → {invoiceData.destination}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount</span>
                        <span style={{ color: '#00C805', fontSize: '24px', fontWeight: 700 }}>
                            {formatCurrency(invoiceData.vendor_amount)}
                        </span>
                    </div>
                </div>
            )}

            {/* Empty State - Only show when no invoice data exists */}
            {!result && !loading && invoiceData.vendor_amount === 0 && (
                <div style={{
                    backgroundColor: '#1A1A1A',
                    borderRadius: '24px',
                    padding: '48px 32px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        border: '4px solid rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2l8 4v7l-8 9-8-9V6z" fill="rgba(255,255,255,0.3)" />
                        </svg>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
                        Upload invoice to begin validation
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{
                    marginTop: '16px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '2px solid #FFFFFF'
                }}>
                    <p style={{ color: '#FFFFFF', fontSize: '14px', margin: 0 }}>{error}</p>
                </div>
            )}

            {/* CSS */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
