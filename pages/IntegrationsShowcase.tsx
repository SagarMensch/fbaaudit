import React, { useState } from 'react';

// Real logo URLs from various CDNs
const LOGO_URLS: { [key: string]: string } = {
    'SAP S/4HANA': 'https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg',
    'Oracle NetSuite': 'https://www.oracle.com/a/ocom/img/oracle-logo.svg',
    'Microsoft Dynamics': 'https://img.icons8.com/color/96/microsoft.png',
    'Tally Prime': 'https://tallysolutions.com/wp-content/themes/flavor/assets/images/tally-logo.svg',
    'Zoho Books': 'https://www.zohowebstatic.com/sites/default/files/zoho_logo.svg',
    'Busy Accounting': 'https://img.icons8.com/color/96/accounting.png',
    'Marg ERP': 'https://img.icons8.com/color/96/erp.png',
    'Ramco Systems': 'https://img.icons8.com/color/96/server.png',
    'BlueDart': 'https://www.bluedart.com/content/dam/bluedart/images/bluedart-logo.svg',
    'Delhivery': 'https://www.delhivery.com/static/media/logo.svg',
    'Rivigo': 'https://img.icons8.com/color/96/truck.png',
    'Blackbuck': 'https://img.icons8.com/color/96/delivery.png',
    'Porter': 'https://img.icons8.com/color/96/cargo-truck.png',
    'FedEx India': 'https://www.fedex.com/content/dam/fedex-com/logos/fedex-logo.svg',
    'DHL Express': 'https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg',
    'GATI-KWE': 'https://img.icons8.com/color/96/parcel.png',
    'XpressBees': 'https://img.icons8.com/color/96/bee.png',
    'Ecom Express': 'https://img.icons8.com/color/96/shopping-cart.png',
    'Fleetx': 'https://img.icons8.com/color/96/gps-device.png',
    'LocoNav': 'https://img.icons8.com/color/96/marker.png',
    'TrackoBit': 'https://img.icons8.com/color/96/navigation.png',
    'MapMyIndia': 'https://img.icons8.com/color/96/map.png',
    'Indian Oil XTRAPOWER': 'https://img.icons8.com/color/96/oil-industry.png',
    'HP Pay': 'https://img.icons8.com/color/96/gas-station.png',
    'BPCL SmartFleet': 'https://img.icons8.com/color/96/fuel.png',
    'Shell Fleet+': 'https://img.icons8.com/color/96/shell-logo.png',
    'NPCI FASTag': 'https://img.icons8.com/color/96/toll.png',
    'Paytm FASTag': 'https://img.icons8.com/color/96/paytm.png',
    'ICICI FASTag': 'https://img.icons8.com/color/96/bank-building.png',
    'HDFC FASTag': 'https://img.icons8.com/color/96/bank.png',
    'Axis FASTag': 'https://img.icons8.com/color/96/money-bag.png',
    'SBI FASTag': 'https://img.icons8.com/color/96/safe.png',
    'HDFC Bank': 'https://img.icons8.com/color/96/bank.png',
    'ICICI Bank': 'https://img.icons8.com/color/96/bank-building.png',
    'State Bank of India': 'https://img.icons8.com/color/96/rupee.png',
    'Axis Bank': 'https://img.icons8.com/color/96/money-bag.png',
    'RazorpayX': 'https://img.icons8.com/color/96/razorpay.png',
    'Cashfree': 'https://img.icons8.com/color/96/cash-in-hand.png',
    'PayU': 'https://img.icons8.com/color/96/payment-history.png',
    'PhonePe Business': 'https://img.icons8.com/color/96/phone-pe.png',
    'ICICI Lombard': 'https://img.icons8.com/color/96/insurance.png',
    'HDFC Ergo': 'https://img.icons8.com/color/96/health-insurance.png',
    'Bajaj Allianz': 'https://img.icons8.com/color/96/life-insurance.png',
    'Tata AIG': 'https://img.icons8.com/color/96/tata.png',
    'Digit Insurance': 'https://img.icons8.com/color/96/warranty.png',
    'Acko': 'https://img.icons8.com/color/96/car-insurance.png',
    'GST Portal': 'https://img.icons8.com/color/96/tax.png',
    'E-Way Bill': 'https://img.icons8.com/color/96/bill.png',
    'Vahan Portal': 'https://img.icons8.com/color/96/steering-wheel.png',
    'ICEGATE': 'https://img.icons8.com/color/96/customs.png',
    'Samsara': 'https://img.icons8.com/color/96/fleet.png',
    'Geotab': 'https://img.icons8.com/color/96/gps.png',
    'MRF Tyres': 'https://img.icons8.com/color/96/tire.png',
    'Apollo Tyres': 'https://img.icons8.com/color/96/wheel.png',
    'JK Tyre': 'https://img.icons8.com/color/96/racing.png',
    'GoMechanic': 'https://img.icons8.com/color/96/car-service.png',
    'Exotel': 'https://img.icons8.com/color/96/phone.png',
    'MSG91': 'https://img.icons8.com/color/96/sms.png',
    'Gupshup': 'https://img.icons8.com/color/96/chat.png',
    'WhatsApp Business': 'https://img.icons8.com/color/96/whatsapp.png',
    'Twilio': 'https://img.icons8.com/color/96/twilio.png',
    'Locus': 'https://img.icons8.com/color/96/route.png',
    'FarEye': 'https://img.icons8.com/color/96/binoculars.png',
    'Unicommerce': 'https://img.icons8.com/color/96/warehouse.png',
};

const BRAND_COLORS: { [key: string]: string } = {
    'SAP S/4HANA': '#0070F2', 'Oracle NetSuite': '#F80000', 'Microsoft Dynamics': '#00A4EF',
    'Tally Prime': '#D4AF37', 'Zoho Books': '#D92228', 'Busy Accounting': '#1E3A5F',
    'BlueDart': '#0055A5', 'Delhivery': '#E31837', 'Rivigo': '#FF6B00', 'FedEx India': '#4D148C',
    'DHL Express': '#FFCC00', 'RazorpayX': '#528FF0', 'HDFC Bank': '#004C8F', 'ICICI Bank': '#F7941E',
    'GST Portal': '#E35205', 'WhatsApp Business': '#25D366', 'Paytm FASTag': '#00BAF2',
};

const INTEGRATIONS = {
    'ERP Systems': [
        { name: 'SAP S/4HANA', status: 'live' }, { name: 'Oracle NetSuite', status: 'live' },
        { name: 'Microsoft Dynamics', status: 'live' }, { name: 'Tally Prime', status: 'live' },
        { name: 'Zoho Books', status: 'live' }, { name: 'Busy Accounting', status: 'live' },
        { name: 'Marg ERP', status: 'live' }, { name: 'Ramco Systems', status: 'live' },
    ],
    'TMS & Logistics': [
        { name: 'BlueDart', status: 'live' }, { name: 'Delhivery', status: 'live' },
        { name: 'Rivigo', status: 'live' }, { name: 'Blackbuck', status: 'live' },
        { name: 'Porter', status: 'live' }, { name: 'FedEx India', status: 'live' },
        { name: 'DHL Express', status: 'live' }, { name: 'GATI-KWE', status: 'live' },
        { name: 'XpressBees', status: 'live' }, { name: 'Ecom Express', status: 'live' },
    ],
    'GPS & Telematics': [
        { name: 'Fleetx', status: 'live' }, { name: 'LocoNav', status: 'live' },
        { name: 'TrackoBit', status: 'live' }, { name: 'MapMyIndia', status: 'live' },
        { name: 'Ruptela', status: 'live' }, { name: 'Teltonika', status: 'live' },
        { name: 'Queclink', status: 'live' }, { name: 'Concox', status: 'live' },
    ],
    'Fuel Cards': [
        { name: 'Indian Oil XTRAPOWER', status: 'live' }, { name: 'HP Pay', status: 'live' },
        { name: 'BPCL SmartFleet', status: 'live' }, { name: 'Reliance Fuel', status: 'live' },
        { name: 'Shell Fleet+', status: 'live' }, { name: 'Essar Oil', status: 'live' },
    ],
    'Toll & FASTag': [
        { name: 'NPCI FASTag', status: 'live' }, { name: 'Paytm FASTag', status: 'live' },
        { name: 'ICICI FASTag', status: 'live' }, { name: 'HDFC FASTag', status: 'live' },
        { name: 'Axis FASTag', status: 'live' }, { name: 'SBI FASTag', status: 'live' },
        { name: 'Kotak FASTag', status: 'live' }, { name: 'IndusInd FASTag', status: 'live' },
    ],
    'Banks & Payments': [
        { name: 'HDFC Bank', status: 'live' }, { name: 'ICICI Bank', status: 'live' },
        { name: 'State Bank of India', status: 'live' }, { name: 'Axis Bank', status: 'live' },
        { name: 'Yes Bank', status: 'live' }, { name: 'Kotak Mahindra', status: 'live' },
        { name: 'RazorpayX', status: 'live' }, { name: 'Cashfree', status: 'live' },
        { name: 'PayU', status: 'live' }, { name: 'PhonePe Business', status: 'live' },
    ],
    'Insurance': [
        { name: 'ICICI Lombard', status: 'live' }, { name: 'HDFC Ergo', status: 'live' },
        { name: 'Bajaj Allianz', status: 'live' }, { name: 'New India Assurance', status: 'live' },
        { name: 'Tata AIG', status: 'live' }, { name: 'Reliance General', status: 'live' },
        { name: 'Digit Insurance', status: 'live' }, { name: 'Acko', status: 'live' },
    ],
    'Government & Compliance': [
        { name: 'GST Portal', status: 'live' }, { name: 'E-Way Bill', status: 'live' },
        { name: 'Vahan Portal', status: 'live' }, { name: 'Sarathi (License)', status: 'live' },
        { name: 'ICEGATE', status: 'live' }, { name: 'TReDS (M1xchange)', status: 'live' },
        { name: 'TReDS (RXIL)', status: 'live' }, { name: 'Udyam Registration', status: 'live' },
    ],
    'Fleet Management': [
        { name: 'Mileage Tracker', status: 'live' }, { name: 'Samsara', status: 'live' },
        { name: 'Verizon Connect', status: 'live' }, { name: 'Geotab', status: 'live' },
        { name: 'Lytx', status: 'live' }, { name: 'KeepTruckin', status: 'live' },
    ],
    'Tyre & Maintenance': [
        { name: 'MRF Tyres', status: 'live' }, { name: 'Apollo Tyres', status: 'live' },
        { name: 'JK Tyre', status: 'live' }, { name: 'CEAT', status: 'live' },
        { name: 'Bridgestone India', status: 'live' }, { name: 'Michelin India', status: 'live' },
        { name: 'GoMechanic', status: 'live' }, { name: 'MyTVS', status: 'live' },
    ],
    'Communication': [
        { name: 'Exotel', status: 'live' }, { name: 'Knowlarity', status: 'live' },
        { name: 'MSG91', status: 'live' }, { name: 'Gupshup', status: 'live' },
        { name: 'WhatsApp Business', status: 'live' }, { name: 'Twilio', status: 'live' },
    ],
    'Warehousing': [
        { name: 'Warehouse OS', status: 'live' }, { name: 'Increff', status: 'live' },
        { name: 'Unicommerce', status: 'live' }, { name: 'Vinculum', status: 'live' },
        { name: 'Locus', status: 'live' }, { name: 'FarEye', status: 'live' },
    ],
};

const totalIntegrations = Object.values(INTEGRATIONS).flat().length;

const categoryColors: { [key: string]: string } = {
    'ERP Systems': '#0062FF', 'TMS & Logistics': '#00C805', 'GPS & Telematics': '#9945FF',
    'Fuel Cards': '#FF6B00', 'Toll & FASTag': '#FFB800', 'Banks & Payments': '#00C805',
    'Insurance': '#0052FF', 'Government & Compliance': '#FF4444', 'Fleet Management': '#9945FF',
    'Tyre & Maintenance': '#666', 'Communication': '#0052FF', 'Warehousing': '#00C805',
};

const getBrandColor = (name: string): string => BRAND_COLORS[name] || '#0062FF';

// Integration Logo with image fallback to initials
const IntegrationLogo: React.FC<{ name: string; size?: number }> = ({ name, size = 40 }) => {
    const [imgError, setImgError] = useState(false);
    const color = getBrandColor(name);
    const logoUrl = LOGO_URLS[name];
    const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

    if (logoUrl && !imgError) {
        return (
            <div style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', padding: 4 }}>
                <img src={logoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setImgError(true)} />
            </div>
        );
    }

    return (
        <div style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${color}40` }}>
            <span style={{ color: '#FFF', fontSize: size * 0.35, fontWeight: 700 }}>{initials}</span>
        </div>
    );
};

interface IntegrationsShowcaseProps { onClose?: () => void; }

export const IntegrationsShowcase: React.FC<IntegrationsShowcaseProps> = ({ onClose }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIntegration, setSelectedIntegration] = useState<{ name: string; category: string } | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const filteredIntegrations = selectedCategory ? { [selectedCategory]: INTEGRATIONS[selectedCategory as keyof typeof INTEGRATIONS] } : INTEGRATIONS;

    const searchFilteredIntegrations = Object.entries(filteredIntegrations).reduce((acc, [category, items]) => {
        const filtered = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || category.toLowerCase().includes(searchQuery.toLowerCase()));
        if (filtered.length > 0) acc[category] = filtered;
        return acc;
    }, {} as typeof INTEGRATIONS);

    const handleConnect = () => {
        setIsConnecting(true);
        setTimeout(() => { setIsConnecting(false); setIsConnected(true); }, 2000);
    };

    const previewItems = ['SAP S/4HANA', 'Oracle NetSuite', 'Delhivery', 'RazorpayX', 'HDFC Bank', 'FedEx India'];

    return (
        <>
            {/* Detail Modal */}
            {selectedIntegration && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }} onClick={() => { setSelectedIntegration(null); setIsConnected(false); }}>
                    <div style={{ backgroundColor: '#0A0A0A', borderRadius: 24, width: '100%', maxWidth: 500, border: `2px solid ${getBrandColor(selectedIntegration.name)}40`, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: 24, borderBottom: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', gap: 16 }}>
                            <IntegrationLogo name={selectedIntegration.name} size={56} />
                            <div style={{ flex: 1 }}>
                                <h2 style={{ color: '#FFF', fontSize: 20, fontWeight: 600, margin: 0 }}>{selectedIntegration.name}</h2>
                                <span style={{ color: '#00C805', fontSize: 10, fontWeight: 600 }}>● LIVE</span>
                            </div>
                            <button onClick={() => { setSelectedIntegration(null); setIsConnected(false); }} style={{ backgroundColor: '#1A1A1A', border: 'none', width: 36, height: 36, borderRadius: 10, color: '#FFF', fontSize: 18, cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ padding: 24 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                <div style={{ backgroundColor: '#111', borderRadius: 12, padding: 14 }}>
                                    <span style={{ color: '#666', fontSize: 10, textTransform: 'uppercase' }}>Protocol</span>
                                    <p style={{ color: '#FFF', fontSize: 13, fontWeight: 600, margin: '6px 0 0' }}>REST API / OAuth 2.0</p>
                                </div>
                                <div style={{ backgroundColor: '#111', borderRadius: 12, padding: 14 }}>
                                    <span style={{ color: '#666', fontSize: 10, textTransform: 'uppercase' }}>Sync Mode</span>
                                    <p style={{ color: '#FFF', fontSize: 13, fontWeight: 600, margin: '6px 0 0' }}>Real-time Bidirectional</p>
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#111', borderRadius: 16, padding: 20 }}>
                                {isConnected ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#00C805', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M7 14l5 5 10-10" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                        <h3 style={{ color: '#00C805', fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>Connected!</h3>
                                        <p style={{ color: '#666', fontSize: 11, margin: 0 }}>Syncing data with LedgerOne</p>
                                    </div>
                                ) : (
                                    <>
                                        <h4 style={{ color: '#FFF', fontSize: 13, fontWeight: 600, margin: 0 }}>Ready to Connect</h4>
                                        <button onClick={handleConnect} disabled={isConnecting} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', backgroundColor: isConnecting ? '#333' : getBrandColor(selectedIntegration.name), color: '#FFF', fontSize: 13, fontWeight: 600, cursor: isConnecting ? 'wait' : 'pointer', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            {isConnecting ? 'Connecting...' : `Connect ${selectedIntegration.name}`}
                                        </button>
                                        <p style={{ color: '#555', fontSize: 9, textAlign: 'center', margin: '8px 0 0' }}>Demo: Click to simulate</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Card */}
            <div onClick={() => setIsModalOpen(true)} style={{ backgroundColor: '#0D0D0D', borderRadius: 20, padding: 24, cursor: 'pointer', border: '1px solid #1A1A1A', transition: 'all 0.3s', position: 'relative' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0062FF'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <rect x="4" y="4" width="10" height="10" rx="2" fill="#0062FF" /><rect x="18" y="4" width="10" height="10" rx="2" fill="#00C805" />
                                <rect x="4" y="18" width="10" height="10" rx="2" fill="#9945FF" /><rect x="18" y="18" width="10" height="10" rx="2" fill="#FFB800" />
                                <circle cx="16" cy="16" r="4" fill="#FFF" />
                            </svg>
                            <span style={{ color: '#FFF', fontSize: 18, fontWeight: 600 }}>Integrations</span>
                        </div>
                        <p style={{ color: '#666', fontSize: 12, margin: 0 }}>Click to view all connectors</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ backgroundColor: '#0062FF', color: '#FFF', fontSize: 24, fontWeight: 700, padding: '8px 16px', borderRadius: 12 }}>{totalIntegrations}+</div>
                        <p style={{ color: '#666', fontSize: 10, margin: '4px 0 0' }}>Ready</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    {previewItems.map((name, i) => (<IntegrationLogo key={i} name={name} size={36} />))}
                    <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 11, fontWeight: 600 }}>+{totalIntegrations - 6}</div>
                </div>
            </div>

            {/* Full Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }} onClick={() => setIsModalOpen(false)}>
                    <div style={{ backgroundColor: '#0A0A0A', borderRadius: 24, width: '100%', maxWidth: 1200, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #1A1A1A' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                    <rect x="4" y="4" width="12" height="12" rx="3" fill="#0062FF" /><rect x="20" y="4" width="12" height="12" rx="3" fill="#00C805" />
                                    <rect x="4" y="20" width="12" height="12" rx="3" fill="#9945FF" /><rect x="20" y="20" width="12" height="12" rx="3" fill="#FFB800" />
                                    <circle cx="18" cy="18" r="5" fill="#FFF" />
                                </svg>
                                <div>
                                    <h2 style={{ color: '#FFF', fontSize: 20, fontWeight: 600, margin: 0 }}>{totalIntegrations}+ Integrations</h2>
                                    <p style={{ color: '#666', fontSize: 12, margin: '4px 0 0' }}>Click any to view details</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: 10, padding: '10px 14px 10px 36px', color: '#FFF', fontSize: 13, width: 200, outline: 'none' }} />
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                                        <circle cx="7" cy="7" r="5" stroke="#666" strokeWidth="1.5" /><path d="M11 11l3 3" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} style={{ backgroundColor: '#1A1A1A', border: 'none', width: 36, height: 36, borderRadius: 10, color: '#FFF', fontSize: 18, cursor: 'pointer' }}>×</button>
                            </div>
                        </div>
                        <div style={{ padding: '16px 32px', borderBottom: '1px solid #1A1A1A', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button onClick={() => setSelectedCategory(null)} style={{ backgroundColor: selectedCategory === null ? '#0062FF' : '#1A1A1A', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>All ({totalIntegrations})</button>
                            {Object.keys(INTEGRATIONS).map(cat => (
                                <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ backgroundColor: selectedCategory === cat ? categoryColors[cat] : '#1A1A1A', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                                    {cat} ({INTEGRATIONS[cat as keyof typeof INTEGRATIONS].length})
                                </button>
                            ))}
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                            {Object.entries(searchFilteredIntegrations).map(([category, items]) => (
                                <div key={category} style={{ marginBottom: 32 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                        <div style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: categoryColors[category] || '#666' }} />
                                        <h3 style={{ color: '#FFF', fontSize: 14, fontWeight: 600, margin: 0 }}>{category}</h3>
                                        <span style={{ color: '#666', fontSize: 11 }}>({items.length})</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                                        {items.map((int, i) => (
                                            <div key={i} onClick={() => { setSelectedIntegration({ name: int.name, category }); setIsConnected(false); }} style={{ backgroundColor: '#111', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #1A1A1A', cursor: 'pointer' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = getBrandColor(int.name); e.currentTarget.style.backgroundColor = '#1A1A1A'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.backgroundColor = '#111'; }}>
                                                <IntegrationLogo name={int.name} size={40} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ color: '#FFF', fontSize: 12, fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{int.name}</p>
                                                    <span style={{ color: '#00C805', fontSize: 9, fontWeight: 600 }}>● Live</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '16px 32px', borderTop: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ color: '#666', fontSize: 11, margin: 0 }}>Need custom? <span style={{ color: '#0062FF' }}>Contact us</span></p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: 10, padding: '4px 8px', borderRadius: 4 }}>REST</span>
                                <span style={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: 10, padding: '4px 8px', borderRadius: 4 }}>GraphQL</span>
                                <span style={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: 10, padding: '4px 8px', borderRadius: 4 }}>Webhooks</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default IntegrationsShowcase;
