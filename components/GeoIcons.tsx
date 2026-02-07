import React from 'react';

// Common Props
export interface GeoIconProps {
    size?: number;
    className?: string;
    color?: string; // Primary accent color
}

// 1. Control Tower / Dashboard
export const GeoDashboard: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#3B82F6" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M3 10V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="3" y="2" width="18" height="6" rx="1" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
        <path d="M7 22V14" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M17 22V14" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="14" r="3" fill={color} fillOpacity="0.4" />
    </svg>
);

// 2. Contract Master
export const GeoContract: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#10B981" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M6 2H18C19.1 2 20 2.9 20 4V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2Z" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" />
        <circle cx="12" cy="18" r="2" fill={color} stroke="none" />
        <path d="M8 6H16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M8 10H16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M8 14H12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

// 3. Spot Auction
export const GeoAuction: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#F59E0B" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <g transform="rotate(-45 12 12)">
            <rect x="10" y="2" width="4" height="12" rx="1" fill={color} stroke={color} strokeWidth="2" />
            <rect x="8" y="14" width="8" height="6" rx="2" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" />
        </g>
        <path d="M4 20H10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
);

// 4. Blackbook
export const GeoBook: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#6366F1" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M6.5 2H20V20H6.5A2.5 2.5 0 0 1 4 17.5V4.5A2.5 2.5 0 0 1 6.5 2Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
        <path d="M12 8L16 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M12 12L16 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// 5. Legacy Rates
export const GeoRates: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#8B5CF6" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <path d="M2 17L12 22L22 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12L12 17L22 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// 6. Carrier Master
export const GeoCarrier: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#EC4899" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="3" y="8" width="14" height="10" rx="1" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
        <path d="M17 12H21V18H17" stroke={color} strokeWidth="2" />
        <circle cx="7" cy="18" r="3" fill={"#161616"} stroke={color} strokeWidth="2" />
        <circle cx="17" cy="18" r="3" fill={"#161616"} stroke={color} strokeWidth="2" />
        <path d="M5 8V6C5 4.9 5.9 4 7 4H10" stroke={color} strokeWidth="2" />
    </svg>
);

// 7. Document Library
export const GeoDocs: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#14B8A6" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" />
        <path d="M14 2V8H20" stroke={color} strokeWidth="2" />
        <rect x="8" y="13" width="8" height="6" fill={color} fillOpacity="0.4" />
    </svg>
);

// 8. Invoice Review
export const GeoInvoice: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#00C805" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="4" y="4" width="16" height="16" rx="2" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" />
        <path d="M9 12L11 14L15 10" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
    </svg>
);

// 9. Master Data Hub
export const GeoData: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#FB7185" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <ellipse cx="12" cy="5" rx="9" ry="3" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
        <path d="M21 12C21 13.66 16.97 15 12 15C7.03 15 3 13.66 3 12" stroke={color} strokeWidth="2" />
        <path d="M3 5V19C3 20.66 7.03 22 12 22C16.97 22 21 20.66 21 19V5" stroke={color} strokeWidth="2" />
    </svg>
);

// 10. Reports
export const GeoReport: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#A855F7" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M18 20V10" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M12 20V4" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M6 20V14" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <rect x="4" y="2" width="16" height="20" rx="2" fill={color} fillOpacity="0.1" stroke="none" />
    </svg>
);

// 11. Freight Audit
export const GeoAudit: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#06B6D4" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="5" y="4" width="14" height="16" rx="2" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
        <path d="M9 9H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M9 13H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M9 17H12" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx="18" cy="18" r="4" fill="#161616" stroke={color} strokeWidth="2" />
        <path d="M20.5 20.5L22 22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// 12. Check / Verify (for internal use)
export const GeoCheck: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#10B981" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" />
        <path d="M8 12L11 15L16 9" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// 13. Alert / Risk (for internal use)
export const GeoIconAlert: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#EF4444" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L2 22H22L12 2Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 8V16" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="19" r="1" fill={color} />
    </svg>
);

// 14. Financials / Money
export const GeoMoney: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#10B981" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="2" y="6" width="20" height="12" rx="2" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
        <circle cx="12" cy="12" r="2" fill={color} fillOpacity="0.4" />
        <path d="M2 10H22" stroke={color} strokeOpacity="0.3" strokeWidth="1" />
        <path d="M2 14H22" stroke={color} strokeOpacity="0.3" strokeWidth="1" />
    </svg>
);

// 15. Message / Chat
export const GeoMessage: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#3B82F6" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M21 11.5C21.003 8.86 18.995 6.46 16.514 5.02C14.034 3.58 10.966 3.58 8.486 5.02C6.005 6.46 3.997 8.86 4 11.5C4 15.35 7.15 18.52 11.16 18.91C11.44 18.94 11.72 18.94 12 18.94C12.87 19.8 13.9 20.69 15.06 21.08C16.92 21.72 17.65 19.88 16.97 18.1C18.23 16.34 21 14.18 21 11.5Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
    </svg>
);

// 16. File / PDF
export const GeoFile: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#64748B" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" />
        <path d="M14 2V8H20" stroke={color} strokeWidth="2" />
        <rect x="8" y="13" width="8" height="2" fill={color} fillOpacity="0.5" />
        <rect x="8" y="17" width="5" height="2" fill={color} fillOpacity="0.5" />
    </svg>
);

// 17. Print
export const GeoPrint: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#64748B" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M6 9V2H18V9" stroke={color} strokeWidth="2" />
        <path d="M6 18H4C2.9 18 2 17.1 2 16V11C2 9.9 2.9 9 4 9H20C21.1 9 22 9.9 22 11V16C22 17.1 21.1 18 20 18H18" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" />
        <path d="M6 14H18V22H6V14Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
    </svg>
);

// 18. Download
export const GeoDownload: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#64748B" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 10L12 15L17 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// 19. Split / Merge
export const GeoSplit: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#6366F1" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="18" cy="18" r="3" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
        <circle cx="6" cy="6" r="3" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
        <path d="M6 21V9" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M9 6H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// 20. Bank / Landmark
export const GeoBank: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#0D9488" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M3 21H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M5 21V7" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M19 21V7" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M10 21V11" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M14 21V11" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M2 7L12 2L22 7H2Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
);

// 21. Warning
export const GeoWarning: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#F59E0B" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M10.29 3.86L1.82 18C1.64556 18.3024 1.55293 18.6453 1.55201 18.9945C1.55108 19.3438 1.64191 19.6871 1.81551 19.9897C1.9891 20.2922 2.23942 20.5432 2.54102 20.7176C2.84261 20.892 3.18506 20.9837 3.53428 20.9839H20.4657C20.8149 20.9837 21.1574 20.892 21.459 20.7176C21.7606 20.5432 22.0109 20.2922 22.1845 19.9897C22.3581 19.6871 22.4489 19.3438 22.448 18.9945C22.4471 18.6453 22.3544 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15349C12.6817 2.98387 12.3438 2.89319 12 2.89319C11.6562 2.89319 11.3183 2.98387 11.0188 3.15349C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 9V13" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M12 17H12.01" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
);
// 3D GEOMETRIC PRIMITIVES (Abstract Data Representation)

// 1. Cube (Total Invoices - Volumetric)
export const Geo3DCube: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#0F62FE" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 22V12" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <path d="M21 7L12 12L3 7" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 12L21 7" fill={color} fillOpacity="0.1" />
        <path d="M3 7L12 12" fill={color} fillOpacity="0.2" />
        <path d="M12 22L21 17V7L12 12V22Z" fill={color} fillOpacity="0.3" />
    </svg>
);

// 2. Pyramid (Audit Savings -Peak/Accumulation)
export const Geo3DPyramid: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#10B981" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L3 18H21L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 2L12 18L3 18" fill={color} fillOpacity="0.1" />
        <path d="M12 18L21 18L12 2" fill={color} fillOpacity="0.2" />
        <path d="M3 18L12 22L21 18" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
);

// 3. Cylinder (Database/Processing/Cycle)
export const Geo3DCylinder: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#60A5FA" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <ellipse cx="12" cy="5" rx="9" ry="3" stroke={color} strokeWidth="2" />
        <path d="M21 5V19C21 20.66 16.97 22 12 22C7.03 22 3 20.66 3 19V5" stroke={color} strokeWidth="2" />
        <ellipse cx="12" cy="5" rx="9" ry="3" fill={color} fillOpacity="0.1" />
        <path d="M3 5V19C3 20.66 7.03 22 12 22C16.97 22 21 20.66 21 19V5" fill={color} fillOpacity="0.1" />
    </svg>
);

// 4. Sphere (Touchless - Smooth/Global)
export const Geo3DSphere: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#6366F1" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
        <ellipse cx="12" cy="12" rx="10" ry="4" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" transform="rotate(20 12 12)" />
        <path d="M6 16C6 16 9 19 12 19C15 19 18 16 18 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.05" />
    </svg>
);

// 5. Icosahedron/Hex (Exceptions - Complexity/Alert)
export const Geo3DHexagon: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#EF4444" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 22V12" stroke={color} strokeWidth="2" />
        <path d="M12 12L20.66 7" stroke={color} strokeWidth="2" />
        <path d="M12 12L3.34 7" stroke={color} strokeWidth="2" />
        <path d="M12 2L3.34 7L12 12" fill={color} fillOpacity="0.1" />
        <path d="M12 12L20.66 7L12 2" fill={color} fillOpacity="0.2" />
        <path d="M3.34 17L3.34 7L12 12" fill={color} fillOpacity="0.15" />
    </svg>
);

// 6. Rectangular Prism/Bar (Compliance - Structure)
export const Geo3DBar: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#14B8A6" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="5" y="5" width="14" height="14" rx="2" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
        <path d="M9 9H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M9 12H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M9 15H13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);
// --- 3D TRADING ICONS ---
export const Geo3DGavel: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#E5E7EB" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M13 5L15.8284 7.82843C16.6095 8.60948 16.6095 9.87581 15.8284 10.6569L10.6569 15.8284C9.87581 16.6095 8.60948 16.6095 7.82843 15.8284L5 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 10L9 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 21L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 11L18 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="13.5" y="2.5" width="6" height="6" rx="1" transform="rotate(45 13.5 2.5)" fill={color} fillOpacity="0.2" stroke={color} />
    </svg>
);

export const Geo3DTruck: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#E5E7EB" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M16 8L20 12V18H4V8H16Z" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" />
        <path d="M16 8H4V18" stroke={color} strokeWidth="2" />
        <rect x="4" y="6" width="12" height="12" rx="1" stroke={color} strokeWidth="2" strokeOpacity="0.5" />
        <circle cx="7" cy="18" r="2" fill={color} />
        <circle cx="17" cy="18" r="2" fill={color} />
    </svg>
);

export const Geo3DClock: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#E5E7EB" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="9" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" />
        <path d="M12 7V12L15 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
);

export const Geo3DBroadcast: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#E5E7EB" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill={color} fillOpacity="0.2" />
        <circle cx="12" cy="12" r="3" fill={color} />
        <path d="M7.76 16.24C6.67 15.15 6 13.66 6 12C6 10.34 6.67 8.85 7.76 7.76M16.24 7.76C17.33 8.85 18 10.34 18 12C18 13.66 17.33 15.15 16.24 16.24M10.59 13.41C10.21 13.04 10 12.55 10 12C10 11.45 10.21 10.96 10.59 10.59M13.41 10.59C13.79 10.96 14 11.45 14 12C14 12.55 13.79 13.04 13.41 13.41" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const Geo3DMap: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#E5E7EB" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 7L3 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const Geo3DWallet: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#E5E7EB" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M17 9V7C17 5.89543 16.1046 5 15 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H15C16.1046 19 17 18.1046 17 17V15H21V9H17Z" stroke={color} strokeWidth="2" />
        <path d="M17 15V9" stroke={color} strokeWidth="2" />
        <path d="M7 12H13" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <rect x="3" y="5" width="14" height="14" rx="2" fill={color} fillOpacity="0.1" />
    </svg>
);

// --- ADDITIONAL 3D UTILITY ICONS ---

export const Geo3DZap: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#E5E7EB" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill={color} fillOpacity="1" stroke="none" />
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="white" strokeWidth="1.5" strokeOpacity="0.2" />
    </svg>
);

export const Geo3DCheck: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#E5E7EB" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" fill={color} stroke="none" />
        <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const Geo3DArrowRight: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#E5E7EB" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M5 12H19" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 5L19 12L12 19" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const Geo3DPlus: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#E5E7EB" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="2" y="2" width="20" height="20" rx="4" fill={color} stroke="none" />
        <path d="M12 7V17" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M7 12H17" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

export const Geo3DCross: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#E5E7EB" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M18 6L6 18" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 6L18 18" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// 3D Intelligence/Analytics Icon (Pie Chart with depth)
export const GeoIntelligence: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#8B5CF6" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* 3D Base Circle */}
        <circle cx="12" cy="13" r="9" fill={color} fillOpacity="0.2" />
        <circle cx="12" cy="12" r="9" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" />
        {/* Pie Slice */}
        <path d="M12 3C13.5 3 15 3.5 16.5 4.5L12 12V3Z" fill={color} fillOpacity="1" />
        <path d="M12 12L16.5 4.5C19 6.5 21 9 21 12H12Z" fill={color} fillOpacity="0.8" />
        {/* Center dot */}
        <circle cx="12" cy="12" r="2" fill="white" />
    </svg>
);

// 3D Calculator Icon (Cost-to-Serve)
export const GeoCalculator: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#06B6D4" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* 3D Body */}
        <rect x="4" y="3" width="16" height="18" rx="2" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
        {/* Screen */}
        <rect x="6" y="5" width="12" height="4" fill={color} fillOpacity="0.8" rx="1" />
        {/* Buttons - 3D grid */}
        <rect x="6" y="11" width="3" height="3" fill={color} rx="0.5" />
        <rect x="10.5" y="11" width="3" height="3" fill={color} rx="0.5" />
        <rect x="15" y="11" width="3" height="3" fill={color} rx="0.5" />
        <rect x="6" y="15.5" width="3" height="3" fill={color} rx="0.5" />
        <rect x="10.5" y="15.5" width="3" height="3" fill={color} rx="0.5" />
        <rect x="15" y="15.5" width="3" height="3" fill={color} rx="0.5" />
    </svg>
);

// 3D Award/Trophy Icon (Carrier Scorecard)
export const GeoAward: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#F59E0B" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Trophy cup */}
        <path d="M8 2H16L14 10H10L8 2Z" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" />
        {/* Trophy handles - 3D effect */}
        <path d="M8 4H5C4 4 3 5 3 6C3 8 5 9 6 9H8" stroke={color} strokeWidth="2" />
        <path d="M16 4H19C20 4 21 5 21 6C21 8 19 9 18 9H16" stroke={color} strokeWidth="2" />
        {/* Base */}
        <path d="M10 10V14" stroke={color} strokeWidth="2" />
        <path d="M14 10V14" stroke={color} strokeWidth="2" />
        <rect x="7" y="14" width="10" height="2" fill={color} rx="1" />
        {/* Stand */}
        <rect x="9" y="16" width="6" height="2" fill={color} fillOpacity="0.6" rx="1" />
        <rect x="6" y="18" width="12" height="3" fill={color} rx="1" />
        {/* Star on trophy */}
        <circle cx="12" cy="5" r="1.5" fill="white" />
    </svg>
);

// 3D Alert/Anomaly Detection Icon (Octagon with !)
export const GeoAnomaly: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#EF4444" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* 3D Octagon */}
        <path d="M7.86 2H16.14L22 7.86V16.14L16.14 22H7.86L2 16.14V7.86L7.86 2Z"
            fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {/* Inner octagon for depth */}
        <path d="M9 4H15L20 9V15L15 20H9L4 15V9L9 4Z" fill={color} fillOpacity="0.1" />
        {/* Exclamation mark */}
        <path d="M12 8V14" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1.5" fill={color} />
    </svg>
);

// 3D Network/Integration Icon
export const GeoNetwork: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#3B82F6" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Central node */}
        <circle cx="12" cy="12" r="4" fill={color} fillOpacity="0.8" stroke={color} strokeWidth="2" />
        {/* Outer nodes */}
        <circle cx="12" cy="4" r="2" fill={color} stroke={color} strokeWidth="1.5" />
        <circle cx="20" cy="12" r="2" fill={color} stroke={color} strokeWidth="1.5" />
        <circle cx="12" cy="20" r="2" fill={color} stroke={color} strokeWidth="1.5" />
        <circle cx="4" cy="12" r="2" fill={color} stroke={color} strokeWidth="1.5" />
        {/* Connection lines */}
        <path d="M12 6V8" stroke={color} strokeWidth="2" />
        <path d="M18 12H16" stroke={color} strokeWidth="2" />
        <path d="M12 16V18" stroke={color} strokeWidth="2" />
        <path d="M6 12H8" stroke={color} strokeWidth="2" />
        {/* Diagonal connections */}
        <path d="M5.5 5.5L9 9" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
        <path d="M18.5 5.5L15 9" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
    </svg>
);

// 3D Settings/Gear Icon
export const GeoSettings: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#6B7280" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Outer gear */}
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
            fill={color} fillOpacity="0.6" stroke={color} strokeWidth="2" />
        {/* Gear teeth - 3D style */}
        <path d="M19.4 15C19.2669 15.3016 19.2043 15.6362 19.218 15.9722C19.2318 16.3082 19.3214 16.6364 19.48 16.93L19.55 17.05C19.8195 17.5099 19.9686 18.033 19.9821 18.5691C19.9956 19.1052 19.8731 19.6356 19.6271 20.1092C19.3811 20.5828 19.0202 20.9838 18.5815 21.2755C18.1428 21.5672 17.6411 21.7401 17.12 21.78C16.5989 21.8199 16.0755 21.7252 15.5959 21.5041C15.1163 21.283 14.6959 20.9425 14.37 20.51L14.23 20.33C14.0032 20.0491 13.7176 19.8216 13.3946 19.6643C13.0716 19.5069 12.7195 19.4237 12.3624 19.4201C12.0053 19.4165 11.6516 19.4928 11.3257 19.6437C10.9997 19.7946 10.7098 20.0164 10.477 20.2932L10.337 20.4732C10.0129 20.9078 9.59399 21.2511 9.11514 21.4752C8.6363 21.6992 8.11303 21.7969 7.59098 21.7598C7.06893 21.7227 6.56482 21.5525 6.12397 21.2631C5.68312 20.9738 5.31933 20.5747 5.0702 20.1025C4.82107 19.6302 4.69392 19.1003 4.70152 18.5639C4.70911 18.0276 4.85122 17.5014 5.11354 17.0363L5.18354 16.9163C5.34413 16.6211 5.43478 16.2911 5.44855 15.9531C5.46231 15.6151 5.39883 15.2785 5.26354 14.9707"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.60001 9.00001C4.73316 8.69839 4.79576 8.36378 4.78202 8.02781C4.76829 7.69183 4.67868 7.36359 4.52001 7.07001L4.45001 6.95001C4.18056 6.49016 4.03148 5.96707 4.01798 5.43094C4.00447 4.89481 4.12694 4.36438 4.37296 3.89076C4.61898 3.41714 4.97994 3.01622 5.41862 2.72451C5.8573 2.43281 6.35893 2.25991 6.88001 2.22001C7.40108 2.18011 7.92452 2.27481 8.40411 2.49592C8.8837 2.71702 9.30405 3.05752 9.63001 3.49001L9.77001 3.67001C9.99684 3.95091 10.2824 4.17841 10.6054 4.33575C10.9284 4.4931 11.2805 4.57639 11.6376 4.57998C11.9947 4.58356 12.3484 4.5072 12.6743 4.35632C13.0003 4.20544 13.2902 3.98365 13.523 3.70681L13.663 3.52681C13.9871 3.09223 14.406 2.74893 14.8849 2.52486C15.3637 2.30078 15.887 2.20303 16.409 2.24014C16.9311 2.27726 17.4352 2.44753 17.876 2.73686C18.3169 3.02619 18.6807 3.42526 18.9298 3.89754C19.1789 4.36981 19.3061 4.89974 19.2985 5.43607C19.2909 5.97239 19.1488 6.49864 18.8865 6.96371L18.8165 7.08371C18.6559 7.37897 18.5653 7.70893 18.5515 8.04693C18.5377 8.38493 18.6012 8.72159 18.7365 9.02931"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// 3D User/Profile Icon
export const GeoUser: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#6B7280" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Head - 3D sphere effect */}
        <circle cx="12" cy="8" r="4" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" />
        <circle cx="12" cy="7.5" r="2" fill={color} fillOpacity="0.2" />
        {/* Body - 3D curved */}
        <path d="M20 21V19C20 17.4087 19.3679 15.8826 18.2426 14.7574C17.1174 13.6321 15.5913 13 14 13H10C8.4087 13 6.88258 13.6321 5.75736 14.7574C4.63214 15.8826 4 17.4087 4 19V21"
            fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// 3D Upload Cloud Icon
export const GeoUploadCloud: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#3B82F6" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Cloud - 3D effect */}
        <path d="M18 10H17.74C17.395 8.6587 16.6404 7.45447 15.5757 6.5529C14.511 5.65133 13.1887 5.10045 11.7997 4.98019C10.4107 4.85992 9.01801 5.17621 7.82175 5.88418C6.62548 6.59214 5.68512 7.65639 5.13 8.93C3.91467 9.16847 2.81933 9.82318 2.02999 10.7826C1.24065 11.742 0.807031 12.9459 0.800018 14.1901C0.793004 15.4344 1.21296 16.6434 1.99163 17.6119C2.7703 18.5804 3.85825 19.2476 5.07 19.5"
            fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 10C19.1867 10.0017 20.3507 10.3179 21.3696 10.9151C22.3884 11.5124 23.2243 12.3679 23.7948 13.3989C24.3653 14.4299 24.6498 15.6 24.6203 16.7865C24.5908 17.973 24.2483 19.1282 23.627 20.1312"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
        {/* Upload arrow - 3D style */}
        <path d="M12 12V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M8 15L12 11L16 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 11L12 8" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
);

// ESG/Emissions Leaf Icon - 3D Geometric Style
export const GeoLeaf: React.FC<GeoIconProps> = ({ size = 24, className = "", color = "#10B981" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Main leaf shape */}
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8.17 20C12.52 20 17 15.83 17 8Z"
            fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Inner detail */}
        <path d="M17 8C17 15.83 12.52 20 8.17 20C7.64 20 7.14 19.87 6.66 19.7L7.65 17.36C8.06 17.45 8.5 17.5 9 17.5C11.81 17.5 14 15 14 11C14 9 13.5 7.5 12 6C13 6 15 6.2 17 8Z"
            fill={color} fillOpacity="0.6" />
        {/* Vein line */}
        <path d="M12 9L8 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        {/* CO2 symbol hint */}
        <circle cx="18" cy="5" r="3" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
        <text x="18" y="6.5" fontSize="4" fill={color} fontWeight="bold" textAnchor="middle">CO₂</text>
    </svg>
);
