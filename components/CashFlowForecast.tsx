import React, { useState, useEffect } from 'react';

interface FridayForecast {
    question: string;
    answer: string;
    date: string;
    amount_inr: number;
    confidence: string;
    vendors_expecting_payment: number;
}

interface WeeklyForecast {
    generated_at: string;
    weeks_forecasted: number;
    total_forecasted_amount: number;
    total_in_lakhs: number;
    weekly_breakdown: {
        week_number: number;
        week_ending: string;
        week_label: string;
        predicted_amount: number;
        predicted_in_lakhs: number;
        confidence_low: number;
        confidence_high: number;
        vendor_count: number;
    }[];
}

interface VendorProjection {
    forecast_period_days: number;
    total_projected: number;
    total_in_lakhs: number;
    vendor_breakdown: {
        vendor_id: string;
        vendor_name: string;
        amount: number;
        invoices: number;
    }[];
}

const API_BASE = 'http://localhost:5000';

// 3D Geometric Icons
const Geo3DChartIcon: React.FC<{ size?: number; color?: string }> = ({ size = 32, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M4 24l8-12 6 8 10-14" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" fill={color} />
        <circle cx="18" cy="20" r="2" fill={color} fillOpacity="0.6" />
        <circle cx="28" cy="6" r="2" fill={color} />
        <path d="M4 24l8-12 6 8 10-14" stroke={color} strokeWidth="1" strokeOpacity="0.3" transform="translate(0, 2)" />
    </svg>
);

const Geo3DWalletIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="16" rx="2" fill={color} />
        <rect x="6" y="10" width="20" height="12" rx="1" fill="white" fillOpacity="0.2" />
        <circle cx="22" cy="16" r="3" fill="white" />
        <path d="M4 8l4-4h16l4 4" stroke={color} strokeWidth="2" />
    </svg>
);

const Geo3DTrendIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M4 24L12 16L18 20L28 8" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M22 8H28V14" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 24L12 16L18 20L28 8" stroke={color} strokeWidth="1" strokeOpacity="0.3" transform="translate(0, 2)" />
    </svg>
);

const Geo3DBrainIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = '#0052FF' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <ellipse cx="12" cy="14" rx="8" ry="10" fill={color} fillOpacity="0.3" />
        <ellipse cx="20" cy="14" rx="8" ry="10" fill={color} fillOpacity="0.3" />
        <path d="M16 4C10 4 6 10 6 16S10 28 16 28S26 22 26 16S22 4 16 4" stroke={color} strokeWidth="2" />
        <path d="M16 8v16M10 12h12M10 20h12" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
    </svg>
);

export const CashFlowForecast: React.FC = () => {
    const [fridayForecast, setFridayForecast] = useState<FridayForecast | null>(null);
    const [weeklyForecast, setWeeklyForecast] = useState<WeeklyForecast | null>(null);
    const [vendorProjections, setVendorProjections] = useState<VendorProjection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [animatedValues, setAnimatedValues] = useState<number[]>([0, 0, 0, 0]);

    useEffect(() => {
        loadForecasts();
    }, []);

    // Animate chart bars on data load
    useEffect(() => {
        if (weeklyForecast) {
            const maxVal = Math.max(...weeklyForecast.weekly_breakdown.map(w => w.predicted_amount));
            const targets = weeklyForecast.weekly_breakdown.map(w => (w.predicted_amount / maxVal) * 100);

            // Staggered animation
            targets.forEach((target, idx) => {
                setTimeout(() => {
                    setAnimatedValues(prev => {
                        const next = [...prev];
                        next[idx] = target;
                        return next;
                    });
                }, idx * 150);
            });
        }
    }, [weeklyForecast]);

    const loadForecasts = async () => {
        setLoading(true);
        setError(null);

        try {
            const [fridayRes, weeklyRes, vendorRes] = await Promise.all([
                fetch(`${API_BASE}/api/cashflow/friday`),
                fetch(`${API_BASE}/api/cashflow/weekly?weeks=4`),
                fetch(`${API_BASE}/api/cashflow/vendors?days=30`)
            ]);

            if (!fridayRes.ok || !weeklyRes.ok || !vendorRes.ok) {
                throw new Error('Failed to load forecasts');
            }

            const friday = await fridayRes.json();
            const weekly = await weeklyRes.json();
            const vendors = await vendorRes.json();

            setFridayForecast(friday);
            setWeeklyForecast(weekly);
            setVendorProjections(vendors);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            backgroundColor: '#FFFFFF',
            minHeight: '100vh',
            fontFamily: "'Berkeley Mono', 'SF Mono', 'Consolas', monospace",
            padding: '40px'
        }}>
            {/* Hypnotic Gradient Orb Background */}
            <div style={{
                position: 'fixed',
                top: '-200px',
                right: '-200px',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(0,200,5,0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
                animation: 'pulse 8s ease-in-out infinite'
            }} />
            <div style={{
                position: 'fixed',
                bottom: '-150px',
                left: '-150px',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(0,82,255,0.06) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
                animation: 'pulse 10s ease-in-out infinite reverse'
            }} />

            {/* Header with ML Badge */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '48px',
                position: 'relative'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        backgroundColor: '#00C805',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0,200,5,0.3)'
                    }}>
                        <Geo3DChartIcon size={28} color="#FFFFFF" />
                    </div>
                    <div>
                        <h1 style={{
                            fontSize: '28px',
                            fontWeight: 700,
                            color: '#000000',
                            margin: 0,
                            letterSpacing: '-0.5px'
                        }}>
                            Cash Flow Forecasting
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                            <span style={{ color: '#00C805', fontSize: '13px' }}>
                                Real-time payment projection based on invoice status
                            </span>
                            <span style={{
                                backgroundColor: '#0052FF',
                                color: '#FFFFFF',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '4px 8px',
                                borderRadius: '4px'
                            }}>
                                ARIMA + ML
                            </span>
                        </div>
                    </div>
                </div>

                {/* Pipeline Value */}
                {weeklyForecast && (
                    <div style={{ textAlign: 'right' }}>
                        <p style={{
                            fontSize: '36px',
                            fontWeight: 700,
                            color: '#000000',
                            margin: 0,
                            letterSpacing: '-1px'
                        }}>
                            ₹{weeklyForecast.total_forecasted_amount.toLocaleString('en-IN')}
                        </p>
                        <p style={{
                            color: '#00C805',
                            fontSize: '12px',
                            fontWeight: 600,
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            PIPELINE VALUE
                        </p>
                    </div>
                )}
            </div>

            {loading && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '80px',
                    backgroundColor: '#FAFAFA',
                    borderRadius: '24px'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        border: '4px solid #00C805',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: '#000000', marginTop: '24px', fontSize: '16px' }}>
                        Training ARIMA Model...
                    </p>
                </div>
            )}

            {!loading && !error && fridayForecast && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                    {/* LEFT: Main Chart Area */}
                    <div>
                        {/* Advanced ML Chart Card */}
                        <div style={{
                            backgroundColor: '#1A1A1A',
                            borderRadius: '24px',
                            padding: '32px',
                            marginBottom: '24px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '32px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Geo3DBrainIcon size={20} color="#00C805" />
                                    <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600 }}>
                                        ARIMA Prediction Model
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00C805' }} />
                                        <span style={{ color: '#FFFFFF', fontSize: '11px' }}>Realized</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#00C805', opacity: 0.5 }} />
                                        <span style={{ color: '#FFFFFF', fontSize: '11px' }}>Projected</span>
                                    </div>
                                </div>
                            </div>

                            {/* SVG Chart with Gradient Area */}
                            <div style={{ position: 'relative', height: '240px', marginBottom: '16px' }}>
                                <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#00C805" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#00C805" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {/* Grid Lines */}
                                    <line x1="0" y1="50" x2="400" y2="50" stroke="#333" strokeWidth="0.5" />
                                    <line x1="0" y1="100" x2="400" y2="100" stroke="#333" strokeWidth="0.5" />
                                    <line x1="0" y1="150" x2="400" y2="150" stroke="#333" strokeWidth="0.5" />

                                    {/* Area Fill */}
                                    <path
                                        d="M0,150 C50,140 100,100 150,80 S250,120 300,100 S350,60 400,50 L400,200 L0,200 Z"
                                        fill="url(#chartGradient)"
                                    />

                                    {/* Main Line */}
                                    <path
                                        d="M0,150 C50,140 100,100 150,80 S250,120 300,100 S350,60 400,50"
                                        stroke="#00C805"
                                        strokeWidth="3"
                                        fill="none"
                                        strokeLinecap="round"
                                    />

                                    {/* Projected Dashed Line */}
                                    <path
                                        d="M300,100 S350,60 400,50"
                                        stroke="#00C805"
                                        strokeWidth="2"
                                        strokeDasharray="8,4"
                                        fill="none"
                                        opacity="0.6"
                                    />

                                    {/* Data Points */}
                                    <circle cx="150" cy="80" r="8" fill="#1A1A1A" stroke="#00C805" strokeWidth="3" />
                                    <circle cx="300" cy="100" r="6" fill="#00C805" />
                                </svg>

                                {/* Tooltip Overlay */}
                                <div style={{
                                    position: 'absolute',
                                    top: '70px',
                                    left: '145px',
                                    backgroundColor: '#FFFFFF',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                                    minWidth: '120px'
                                }}>
                                    <p style={{ color: '#666', fontSize: '10px', margin: '0 0 4px', textTransform: 'uppercase' }}>WEEK 2</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00C805' }} />
                                        <span style={{ fontSize: '11px', color: '#333' }}>Realized</span>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#000' }}>₹135,000</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00C805', opacity: 0.5 }} />
                                        <span style={{ fontSize: '11px', color: '#333' }}>Projected</span>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#000' }}>₹135,000</span>
                                    </div>
                                </div>
                            </div>

                            {/* X-Axis Labels */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
                                {['Week 1', 'Week 2', 'Last Wk', 'This Wk', 'Next Wk', 'Week 6', 'Week 7'].map((label, i) => (
                                    <span key={i} style={{ color: '#666', fontSize: '10px' }}>{label}</span>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Action Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                            {[
                                { label: 'Upload Invoice', icon: '↑', active: false },
                                { label: 'Check Payments', icon: '→→', active: true },
                                { label: 'My Loads', icon: '◎', active: false },
                                { label: 'Raise Dispute', icon: '⚡', active: false }
                            ].map((action, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        backgroundColor: action.active ? '#00C805' : '#1A1A1A',
                                        borderRadius: '16px',
                                        padding: '24px 20px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{
                                        fontSize: '20px',
                                        marginBottom: '12px',
                                        color: action.active ? '#1A1A1A' : '#00C805'
                                    }}>
                                        {action.icon}
                                    </div>
                                    <span style={{
                                        color: action.active ? '#1A1A1A' : '#FFFFFF',
                                        fontSize: '12px',
                                        fontWeight: 600
                                    }}>
                                        {action.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Stats Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Action Required Card */}
                        <div style={{
                            backgroundColor: '#FAFAFA',
                            borderRadius: '20px',
                            padding: '24px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: '#FF0000',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{ color: '#FFFFFF', fontWeight: 700 }}>!</span>
                                </div>
                                <span style={{ color: '#000000', fontWeight: 600, fontSize: '14px' }}>Action Required</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 0',
                                    borderBottom: '1px solid #E5E5E5'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FF0000' }} />
                                        <span style={{ color: '#000000', fontSize: '13px' }}>Issues / Disputes</span>
                                    </div>
                                    <span style={{
                                        backgroundColor: '#00C805',
                                        color: '#FFFFFF',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '4px 10px',
                                        borderRadius: '12px'
                                    }}>
                                        {fridayForecast.vendors_expecting_payment} Items
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 0'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0052FF' }} />
                                        <span style={{ color: '#000000', fontSize: '13px' }}>Pending Bids</span>
                                    </div>
                                    <span style={{
                                        backgroundColor: '#1A1A1A',
                                        color: '#FFFFFF',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '4px 10px',
                                        borderRadius: '12px'
                                    }}>
                                        1 Lane
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* On-Time Delivery Card */}
                        <div style={{
                            background: 'linear-gradient(135deg, #FAFAFA 0%, #F0FFF0 100%)',
                            borderRadius: '20px',
                            padding: '24px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: '#000000', fontWeight: 600, fontSize: '14px' }}>On-Time Delivery</span>
                                <Geo3DTrendIcon size={20} color="#00C805" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <span style={{ fontSize: '48px', fontWeight: 700, color: '#000000' }}>98.2%</span>
                                <span style={{
                                    color: '#00C805',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    ↑ +1.2%
                                </span>
                            </div>
                            <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
                                You are in the <span style={{ fontWeight: 700, color: '#000' }}>Top 5%</span> of vendors this month.
                            </p>
                        </div>

                        {/* CFO Quick Answer */}
                        <div style={{
                            backgroundColor: '#000000',
                            borderRadius: '20px',
                            padding: '24px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <Geo3DWalletIcon size={18} color="#00C805" />
                                <span style={{ color: '#FFFFFF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    CFO Quick Answer
                                </span>
                            </div>
                            <p style={{ color: '#AAAAAA', fontSize: '14px', marginBottom: '12px', lineHeight: 1.5 }}>
                                {fridayForecast.question}
                            </p>
                            <p style={{
                                color: '#00C805',
                                fontSize: '32px',
                                fontWeight: 700,
                                marginBottom: '16px'
                            }}>
                                {fridayForecast.answer}
                            </p>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <span style={{ color: '#666', fontSize: '11px' }}>
                                    Range: <span style={{ color: '#FFF' }}>{fridayForecast.confidence}</span>
                                </span>
                                <span style={{ color: '#666', fontSize: '11px' }}>
                                    Vendors: <span style={{ color: '#FFF' }}>{fridayForecast.vendors_expecting_payment}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};
