import React, { useEffect, useState } from 'react';
import { IndianSupplier } from '../../services/supplierService';
import { supplierInvoiceService } from '../../services/supplierInvoiceService';

interface CommandCenterProps {
    supplier: IndianSupplier;
    onNavigate?: (tab: any) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ supplier, onNavigate }) => {
    const [stats, setStats] = useState<any>(null);
    const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);
    const [hoveredRoute, setHoveredRoute] = useState<number | null>(null);

    useEffect(() => {
        setStats(supplierInvoiceService.getInvoiceStats());
    }, []);

    const navigateTo = (tab: string) => {
        if (onNavigate) onNavigate(tab);
    };

    const pendingAmount = stats ? stats.pendingAmount : 128159;

    // ==========================================
    // ML-POWERED FORECAST DATA WITH CONFIDENCE BANDS
    // Simulating ARIMA/Prophet-style predictions
    // ==========================================
    const forecastData = [
        { week: 'W-4', actual: 82000, predicted: 80000, lower: 75000, upper: 85000 },
        { week: 'W-3', actual: 125000, predicted: 120000, lower: 110000, upper: 130000 },
        { week: 'W-2', actual: 98000, predicted: 105000, lower: 95000, upper: 115000 },
        { week: 'W-1', actual: 145000, predicted: 140000, lower: 130000, upper: 150000 },
        { week: 'This', actual: 132000, predicted: 135000, lower: 125000, upper: 145000 },
        { week: 'W+1', actual: null, predicted: 158000, lower: 140000, upper: 176000 },
        { week: 'W+2', actual: null, predicted: 172000, lower: 150000, upper: 194000 },
        { week: 'W+3', actual: null, predicted: 185000, lower: 160000, upper: 210000 },
    ];

    // INVOICE FUNNEL - Where are invoices in the pipeline?
    const invoiceFunnel = [
        { stage: 'Submitted', count: 12, amount: 245000, color: '#666' },
        { stage: 'Under Review', count: 8, amount: 178000, color: '#FFB800' },
        { stage: 'Approved', count: 5, amount: 95000, color: '#0052FF' },
        { stage: 'Processing', count: 3, amount: 45000, color: '#9945FF' },
        { stage: 'Paid', count: 45, amount: 892000, color: '#00C805' },
    ];

    // ROUTE PROFITABILITY - Which routes make you more money?
    const routeProfitability = [
        { route: 'Mumbai → Delhi', trips: 28, revenue: 425000, margin: 18.5, trend: 'up' },
        { route: 'Chennai → Bangalore', trips: 22, revenue: 312000, margin: 15.2, trend: 'up' },
        { route: 'Kolkata → Hyderabad', trips: 15, revenue: 245000, margin: 14.8, trend: 'down' },
        { route: 'Pune → Ahmedabad', trips: 12, revenue: 178000, margin: 12.3, trend: 'stable' },
        { route: 'Delhi → Jaipur', trips: 18, revenue: 156000, margin: 11.9, trend: 'up' },
    ];

    // DSO (Days Sales Outstanding) TREND - How fast do you get paid?
    const dsoTrend = [
        { month: 'Jul', dso: 32 },
        { month: 'Aug', dso: 28 },
        { month: 'Sep', dso: 25 },
        { month: 'Oct', dso: 22 },
        { month: 'Nov', dso: 19 },
        { month: 'Dec', dso: 15 },
    ];

    // SEASONALITY DATA - When is business peak?
    const seasonality = [
        { month: 'Jan', index: 85 }, { month: 'Feb', index: 78 },
        { month: 'Mar', index: 92 }, { month: 'Apr', index: 88 },
        { month: 'May', index: 75 }, { month: 'Jun', index: 70 },
        { month: 'Jul', index: 82 }, { month: 'Aug', index: 95 },
        { month: 'Sep', index: 110 }, { month: 'Oct', index: 125 },
        { month: 'Nov', index: 140 }, { month: 'Dec', index: 118 },
    ];

    // PAYMENT VELOCITY - Speed of money flow
    const paymentVelocity = {
        current: 4.2, // Days
        industry: 7.5,
        improvement: 44 // % faster than industry
    };

    // KEY METRICS
    const keyMetrics = {
        totalRevenue: 1856000,
        avgInvoiceValue: 38500,
        onTimeRate: 97.2,
        disputeRate: 2.1,
        growthRate: 23.5
    };

    const maxForecast = 220000;
    const chartHeight = 200;
    const chartWidth = 600;

    return (
        <div style={{ backgroundColor: '#000000', minHeight: '100vh', padding: '32px' }}>

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 600, margin: '0 0 8px' }}>Command Center</h1>
                    <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>AI-powered insights for {supplier.name}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#FFFFFF', fontSize: '36px', fontWeight: 700, margin: 0 }}>₹{pendingAmount.toLocaleString('en-IN')}</p>
                    <p style={{ color: '#00C805', fontSize: '10px', margin: '4px 0 0', letterSpacing: '1px' }}>PIPELINE VALUE</p>
                </div>
            </div>

            {/* 4 TAILORED CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
                {/* Upload Invoice */}
                <div onClick={() => navigateTo('invoicing')} style={{ backgroundColor: '#1A1A1A', borderRadius: '24px', padding: '28px', cursor: 'pointer', height: '240px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #2A2A2A' }}>
                    <h2 style={{ color: '#FFF', fontSize: '24px', fontWeight: 600, margin: 0, zIndex: 2 }}>Upload Invoice</h2>
                    <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '100%', height: '80%', pointerEvents: 'none' }}>
                        <svg width="180" height="160" viewBox="0 0 180 160" fill="none" style={{ position: 'absolute', bottom: 0, right: 0 }}>
                            <g transform="translate(50, 30) rotate(10)"><rect width="70" height="100" rx="8" fill="#333" /></g>
                            <g transform="translate(25, 40) rotate(-5)"><rect width="70" height="100" rx="8" fill="#444" /></g>
                            <g transform="translate(40, 50)">
                                <rect width="80" height="105" rx="10" fill="#2A2A2A" />
                                <rect x="12" y="15" width="28" height="4" rx="2" fill="white" fillOpacity="0.3" />
                                <rect x="12" y="30" width="56" height="2" rx="1" fill="white" fillOpacity="0.2" />
                                <rect x="12" y="40" width="46" height="2" rx="1" fill="white" fillOpacity="0.2" />
                            </g>
                        </svg>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', zIndex: 2 }}>
                        {['PDF', 'JPG'].map(t => <span key={t} style={{ fontSize: '10px', fontWeight: 700, background: '#FFF', padding: '3px 6px', borderRadius: '4px' }}>{t}</span>)}
                    </div>
                </div>

                {/* Check Payments - Cash App Style */}
                <div onClick={() => navigateTo('payments')} style={{ backgroundColor: '#1A1A1A', borderRadius: '24px', padding: '28px', cursor: 'pointer', height: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #2A2A2A', position: 'relative', overflow: 'hidden' }}>
                    <h2 style={{ color: '#FFF', fontSize: '24px', fontWeight: 600, margin: 0, zIndex: 2 }}>Check Payments</h2>

                    {/* Green accent element - similar to Cash App's $20 green box */}
                    <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <div style={{
                            backgroundColor: '#00C805',
                            borderRadius: '16px',
                            padding: '24px 32px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '120px'
                        }}>
                            <span style={{ color: '#000', fontSize: '36px', fontWeight: 700, letterSpacing: '-1px' }}>₹45K</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                        <span style={{ color: '#888', fontSize: '12px', fontWeight: 600 }}>3 pending</span>
                        <div style={{ display: 'flex' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#333', border: '2px solid #1A1A1A' }} />
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#333', marginLeft: '-10px', border: '2px solid #1A1A1A' }} />
                        </div>
                    </div>
                </div>

                {/* My Loads */}
                <div onClick={() => navigateTo('operations')} style={{ backgroundColor: '#1A1A1A', borderRadius: '24px', padding: '28px', cursor: 'pointer', height: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #2A2A2A' }}>
                    <h2 style={{ color: '#FFF', fontSize: '24px', fontWeight: 600, margin: 0 }}>My Loads</h2>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
                            <path d="M20 50 Q80 10 140 50" stroke="#333" strokeWidth="3" strokeDasharray="6 4" />
                            <circle cx="20" cy="50" r="8" fill="#00C805" />
                            <circle cx="80" cy="30" r="12" fill="#0052FF" fillOpacity="0.2" />
                            <circle cx="80" cy="30" r="5" fill="#0052FF" />
                            <circle cx="140" cy="50" r="8" stroke="#00C805" strokeWidth="2" fill="#1A1A1A" />
                        </svg>
                    </div>
                    <span style={{ color: '#666', fontSize: '12px' }}>3 active shipments</span>
                </div>

                {/* Get Help */}
                <div onClick={() => navigateTo('resolution')} style={{ backgroundColor: '#1A1A1A', borderRadius: '24px', padding: '28px', cursor: 'pointer', height: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #2A2A2A' }}>
                    <h2 style={{ color: '#FFF', fontSize: '24px', fontWeight: 600, margin: 0 }}>Get Help</h2>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="140" height="100" viewBox="0 0 140 100" fill="none">
                            <rect x="10" y="20" width="60" height="30" rx="15" fill="#333" />
                            <rect x="70" y="50" width="60" height="30" rx="15" fill="#00C805" />
                            <circle cx="110" cy="65" r="8" fill="white" />
                            <path d="M105 65 L108 68 L115 61" stroke="#00C805" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <span style={{ color: '#666', fontSize: '12px' }}>Support & Disputes</span>
                </div>
            </div>

            {/* ==========================================
                ML-POWERED PAYMENT FORECAST WITH CONFIDENCE BANDS
               ========================================== */}
            <div style={{ backgroundColor: '#0D0D0D', borderRadius: '24px', padding: '32px', marginBottom: '24px', border: '1px solid #1A1A1A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h3 style={{ color: '#FFF', fontSize: '20px', fontWeight: 600, margin: 0 }}>Payment Forecast</h3>
                            <span style={{ backgroundColor: '#0052FF', color: '#FFF', fontSize: '9px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px' }}>ML POWERED</span>
                        </div>
                        <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>Predictive model with 95% confidence interval</p>
                    </div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#00C805' }} />
                            <span style={{ color: '#888', fontSize: '11px' }}>Actual</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '3px', backgroundColor: '#0052FF' }} />
                            <span style={{ color: '#888', fontSize: '11px' }}>Predicted</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '8px', backgroundColor: '#0052FF', opacity: 0.2, borderRadius: '2px' }} />
                            <span style={{ color: '#888', fontSize: '11px' }}>95% CI</span>
                        </div>
                    </div>
                </div>

                {/* MAIN CHART */}
                <div style={{ height: '280px', position: 'relative' }}>
                    <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} 280`} preserveAspectRatio="xMidYMid meet">
                        <defs>
                            <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0052FF" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#0052FF" stopOpacity="0.02" />
                            </linearGradient>
                            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00C805" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#00C805" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Grid */}
                        {[0, 1, 2, 3, 4].map(i => {
                            const y = 40 + i * 50;
                            return <line key={i} x1="60" y1={y} x2={chartWidth - 20} y2={y} stroke="#1A1A1A" strokeWidth="1" />;
                        })}

                        {/* Y-axis labels */}
                        {[0, 1, 2, 3, 4].map(i => {
                            const val = maxForecast - (i * (maxForecast / 4));
                            const y = 40 + i * 50;
                            return <text key={i} x="50" y={y + 4} fill="#555" fontSize="10" textAnchor="end">₹{(val / 1000).toFixed(0)}K</text>;
                        })}

                        {/* Confidence band (shaded area) */}
                        <path d={
                            forecastData.map((d, i) => {
                                const x = 80 + i * 68;
                                const yUpper = 40 + ((maxForecast - d.upper) / maxForecast) * 200;
                                return i === 0 ? `M${x},${yUpper}` : `L${x},${yUpper}`;
                            }).join(' ') +
                            forecastData.slice().reverse().map((d, i) => {
                                const x = 80 + (forecastData.length - 1 - i) * 68;
                                const yLower = 40 + ((maxForecast - d.lower) / maxForecast) * 200;
                                return `L${x},${yLower}`;
                            }).join(' ') + ' Z'
                        } fill="url(#confGrad)" />

                        {/* Predicted line */}
                        <path d={
                            forecastData.map((d, i) => {
                                const x = 80 + i * 68;
                                const y = 40 + ((maxForecast - d.predicted) / maxForecast) * 200;
                                return i === 0 ? `M${x},${y}` : `L${x},${y}`;
                            }).join(' ')
                        } stroke="#0052FF" strokeWidth="2" fill="none" strokeDasharray="6 3" />

                        {/* Actual line with area fill (for past data) */}
                        <path d={
                            forecastData.filter(d => d.actual).map((d, i) => {
                                const x = 80 + i * 68;
                                const y = 40 + ((maxForecast - d.actual!) / maxForecast) * 200;
                                return i === 0 ? `M${x},${y}` : `L${x},${y}`;
                            }).join(' ') +
                            ` L${80 + (forecastData.filter(d => d.actual).length - 1) * 68},240 L80,240 Z`
                        } fill="url(#actualGrad)" />

                        <path d={
                            forecastData.filter(d => d.actual).map((d, i) => {
                                const x = 80 + i * 68;
                                const y = 40 + ((maxForecast - d.actual!) / maxForecast) * 200;
                                return i === 0 ? `M${x},${y}` : `L${x},${y}`;
                            }).join(' ')
                        } stroke="#00C805" strokeWidth="3" fill="none" strokeLinecap="round" />

                        {/* Data points */}
                        {forecastData.map((d, i) => {
                            const x = 80 + i * 68;
                            const yPred = 40 + ((maxForecast - d.predicted) / maxForecast) * 200;
                            const yActual = d.actual ? 40 + ((maxForecast - d.actual) / maxForecast) * 200 : null;
                            return (
                                <g key={i}>
                                    {/* Predicted point */}
                                    <circle cx={x} cy={yPred} r={hoveredWeek === i ? 8 : 5} fill="#0D0D0D" stroke="#0052FF" strokeWidth="2" style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredWeek(i)} onMouseLeave={() => setHoveredWeek(null)} />

                                    {/* Actual point */}
                                    {yActual && <circle cx={x} cy={yActual} r={hoveredWeek === i ? 8 : 5} fill="#00C805" style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredWeek(i)} onMouseLeave={() => setHoveredWeek(null)} />}

                                    {/* X-axis label */}
                                    <text x={x} y="265" fill="#555" fontSize="10" textAnchor="middle">{d.week}</text>
                                </g>
                            );
                        })}

                        {/* Vertical line at "now" */}
                        <line x1={80 + 4 * 68} y1="35" x2={80 + 4 * 68} y2="245" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />
                        <text x={80 + 4 * 68} y="28" fill="#666" fontSize="9" textAnchor="middle">NOW</text>
                    </svg>

                    {/* Tooltip */}
                    {hoveredWeek !== null && (
                        <div style={{
                            position: 'absolute',
                            left: `${((80 + hoveredWeek * 68) / chartWidth) * 100}%`,
                            top: '20px',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#FFF',
                            padding: '16px 20px',
                            borderRadius: '12px',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                            zIndex: 10,
                            minWidth: '180px'
                        }}>
                            <p style={{ color: '#666', fontSize: '11px', margin: '0 0 8px', fontWeight: 600 }}>{forecastData[hoveredWeek].week}</p>
                            {forecastData[hoveredWeek].actual && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '12px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00C805' }} /> Actual
                                    </span>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#000' }}>₹{(forecastData[hoveredWeek].actual! / 1000).toFixed(0)}K</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '12px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '8px', height: '3px', backgroundColor: '#0052FF' }} /> Predicted
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#000' }}>₹{(forecastData[hoveredWeek].predicted / 1000).toFixed(0)}K</span>
                            </div>
                            <div style={{ borderTop: '1px solid #EEE', paddingTop: '8px', marginTop: '8px' }}>
                                <span style={{ fontSize: '10px', color: '#888' }}>95% Confidence: ₹{(forecastData[hoveredWeek].lower / 1000).toFixed(0)}K - ₹{(forecastData[hoveredWeek].upper / 1000).toFixed(0)}K</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #1A1A1A' }}>
                    <div>
                        <span style={{ color: '#666', fontSize: '11px' }}>Next 3 Weeks</span>
                        <p style={{ color: '#FFF', fontSize: '20px', fontWeight: 700, margin: '4px 0 0' }}>₹5.15L</p>
                    </div>
                    <div>
                        <span style={{ color: '#666', fontSize: '11px' }}>Model Accuracy</span>
                        <p style={{ color: '#00C805', fontSize: '20px', fontWeight: 700, margin: '4px 0 0' }}>94.2%</p>
                    </div>
                    <div>
                        <span style={{ color: '#666', fontSize: '11px' }}>Trend</span>
                        <p style={{ color: '#00C805', fontSize: '20px', fontWeight: 700, margin: '4px 0 0' }}>+18.5%</p>
                    </div>
                    <div>
                        <span style={{ color: '#666', fontSize: '11px' }}>Avg Weekly</span>
                        <p style={{ color: '#FFF', fontSize: '20px', fontWeight: 700, margin: '4px 0 0' }}>₹1.48L</p>
                    </div>
                </div>
            </div>

            {/* ==========================================
                INVOICE FUNNEL + PAYMENT VELOCITY
               ========================================== */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '24px' }}>

                {/* Invoice Pipeline - Clear Horizontal Bars */}
                <div style={{ backgroundColor: '#0D0D0D', borderRadius: '24px', padding: '28px', border: '1px solid #1A1A1A' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ color: '#FFF', fontSize: '16px', fontWeight: 600, margin: 0 }}>Invoice Pipeline</h3>
                        <span style={{ color: '#666', fontSize: '11px' }}>73 total invoices</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {invoiceFunnel.map((stage, i) => {
                            const maxAmt = Math.max(...invoiceFunnel.map(s => s.amount));
                            const width = Math.max((stage.amount / maxAmt) * 100, 15);
                            return (
                                <div key={i}>
                                    {/* Label Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: stage.color }} />
                                            <span style={{ color: '#FFF', fontSize: '12px', fontWeight: 500 }}>{stage.stage}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ color: '#888', fontSize: '11px' }}>{stage.count} invoices</span>
                                            <span style={{ color: '#FFF', fontSize: '12px', fontWeight: 600 }}>₹{(stage.amount / 1000).toFixed(0)}K</span>
                                        </div>
                                    </div>
                                    {/* Bar */}
                                    <div style={{ height: '8px', backgroundColor: '#1A1A1A', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${width}%`, backgroundColor: stage.color, borderRadius: '4px', transition: 'width 0.3s' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Summary */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #1A1A1A' }}>
                        <div>
                            <span style={{ color: '#666', fontSize: '10px' }}>Pending Amount</span>
                            <p style={{ color: '#FFB800', fontSize: '16px', fontWeight: 600, margin: '2px 0 0' }}>₹5.63L</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ color: '#666', fontSize: '10px' }}>Already Paid</span>
                            <p style={{ color: '#00C805', fontSize: '16px', fontWeight: 600, margin: '2px 0 0' }}>₹8.92L</p>
                        </div>
                    </div>
                </div>

                {/* Payment Velocity Gauge */}
                <div style={{ backgroundColor: '#0D0D0D', borderRadius: '24px', padding: '28px', border: '1px solid #1A1A1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h3 style={{ color: '#FFF', fontSize: '16px', fontWeight: 600, margin: '0 0 20px' }}>Payment Velocity</h3>
                    <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                        <svg width="140" height="140" viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r="60" fill="none" stroke="#1A1A1A" strokeWidth="12" />
                            <circle cx="70" cy="70" r="60" fill="none" stroke="#00C805" strokeWidth="12"
                                strokeDasharray={`${(1 - paymentVelocity.current / 10) * 377} 377`}
                                strokeLinecap="round" transform="rotate(-90 70 70)" />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <span style={{ color: '#FFF', fontSize: '32px', fontWeight: 700 }}>{paymentVelocity.current}</span>
                            <span style={{ color: '#666', fontSize: '12px', display: 'block' }}>days</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                        <span style={{ color: '#00C805', fontSize: '14px', fontWeight: 600 }}>{paymentVelocity.improvement}% faster</span>
                        <span style={{ color: '#666', fontSize: '11px', display: 'block' }}>than industry avg ({paymentVelocity.industry} days)</span>
                    </div>
                </div>
            </div>

            {/* ==========================================
                ROUTE PROFITABILITY + DSO TREND + SEASONALITY
               ========================================== */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '24px' }}>

                {/* Route Profitability */}
                <div style={{ backgroundColor: '#0D0D0D', borderRadius: '24px', padding: '28px', border: '1px solid #1A1A1A' }}>
                    <h3 style={{ color: '#FFF', fontSize: '16px', fontWeight: 600, margin: '0 0 20px' }}>Route Profitability</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {routeProfitability.map((route, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '12px', backgroundColor: hoveredRoute === i ? '#1A1A1A' : 'transparent',
                                borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s'
                            }} onMouseEnter={() => setHoveredRoute(i)} onMouseLeave={() => setHoveredRoute(null)}>
                                <span style={{ color: i === 0 ? '#00C805' : '#888', fontSize: '14px', fontWeight: 600 }}>{i + 1}</span>
                                <div style={{ flex: 1 }}>
                                    <span style={{ color: '#FFF', fontSize: '12px', fontWeight: 500 }}>{route.route}</span>
                                    <span style={{ color: '#666', fontSize: '10px', display: 'block' }}>{route.trips} trips</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: '#FFF', fontSize: '12px', fontWeight: 600 }}>₹{(route.revenue / 1000).toFixed(0)}K</span>
                                    <span style={{
                                        color: route.trend === 'up' ? '#00C805' : route.trend === 'down' ? '#FF4444' : '#666',
                                        fontSize: '10px', display: 'block'
                                    }}>{route.margin}% margin {route.trend === 'up' ? '↑' : route.trend === 'down' ? '↓' : '→'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DSO Trend */}
                <div style={{ backgroundColor: '#0D0D0D', borderRadius: '24px', padding: '28px', border: '1px solid #1A1A1A' }}>
                    <h3 style={{ color: '#FFF', fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>Days to Payment</h3>
                    <p style={{ color: '#666', fontSize: '11px', margin: '0 0 20px' }}>DSO trend over 6 months</p>
                    <div style={{ height: '120px' }}>
                        <svg width="100%" height="100%" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet">
                            <path d={dsoTrend.map((d, i) => {
                                const x = 20 + i * 32;
                                const y = 10 + (d.dso / 40) * 80;
                                return i === 0 ? `M${x},${y}` : `L${x},${y}`;
                            }).join(' ')} stroke="#00C805" strokeWidth="2" fill="none" strokeLinecap="round" />
                            {dsoTrend.map((d, i) => {
                                const x = 20 + i * 32;
                                const y = 10 + (d.dso / 40) * 80;
                                return (
                                    <g key={i}>
                                        <circle cx={x} cy={y} r="4" fill="#00C805" />
                                        <text x={x} y="110" fill="#555" fontSize="9" textAnchor="middle">{d.month}</text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                        <span style={{ color: '#666', fontSize: '10px' }}>32 days → 15 days</span>
                        <span style={{ color: '#00C805', fontSize: '10px', fontWeight: 600 }}>53% faster</span>
                    </div>
                </div>

                {/* Seasonality - Clear Bar Chart */}
                <div style={{ backgroundColor: '#0D0D0D', borderRadius: '24px', padding: '28px', border: '1px solid #1A1A1A' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ color: '#FFF', fontSize: '16px', fontWeight: 600, margin: 0 }}>Seasonality</h3>
                        <span style={{ color: '#00C805', fontSize: '11px', fontWeight: 600 }}>Peak: Oct-Nov</span>
                    </div>

                    {/* Bar Chart */}
                    <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px', paddingBottom: '24px', position: 'relative' }}>
                        {/* Baseline */}
                        <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, height: '1px', backgroundColor: '#333' }} />

                        {seasonality.map((m, i) => {
                            const height = (m.index / 150) * 100;
                            const isPeak = m.index >= 110;
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    {/* Value on top */}
                                    <span style={{ color: isPeak ? '#00C805' : '#666', fontSize: '9px', marginBottom: '4px', fontWeight: isPeak ? 600 : 400 }}>
                                        {m.index}
                                    </span>
                                    {/* Bar */}
                                    <div style={{
                                        width: '100%',
                                        height: `${height}px`,
                                        backgroundColor: isPeak ? '#00C805' : '#333',
                                        borderRadius: '3px 3px 0 0',
                                        minHeight: '4px'
                                    }} />
                                    {/* Month label */}
                                    <span style={{ color: isPeak ? '#FFF' : '#555', fontSize: '9px', marginTop: '6px', fontWeight: isPeak ? 500 : 400 }}>
                                        {m.month.substring(0, 3)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', paddingTop: '12px', borderTop: '1px solid #1A1A1A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', backgroundColor: '#00C805', borderRadius: '2px' }} />
                            <span style={{ color: '#888', fontSize: '10px' }}>Peak (100+)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', backgroundColor: '#333', borderRadius: '2px' }} />
                            <span style={{ color: '#888', fontSize: '10px' }}>Normal</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
