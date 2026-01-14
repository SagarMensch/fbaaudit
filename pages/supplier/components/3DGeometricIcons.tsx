import React from 'react';

// ============================================
// PREMIUM ISOMETRIC 3D GEOMETRIC ICONS
// Principles:
// 1. Isometric Projection (30deg angles)
// 2. Solid Faces (No outlines)
// 3. Three Shades: Light (Top), Medium (Side), Main (Front)
// 4. Geometric Primitives (Blocks, Cylinders)
// ============================================

interface IconProps {
    size?: number;
    className?: string;
    color?: string;
}

// --- CORE SHAPES HELPERS (Conceptually) ---
// Top Face: Brightest opacity
// Left Face: Darker opacity
// Right Face: Medium opacity

// ============================================
// LOGISTICS & OPERATIONS
// ============================================

export const Geo3DStack = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Bottom Sheet */}
        <path d="M4 14l10 5 8-4-10-5-8 4z" fill={color} fillOpacity="0.8" />
        <path d="M4 14v3l10 5v-3l-10-5z" fill={color} fillOpacity="0.6" /> {/* Left Side */}
        {/* Middle Sheet */}
        <path d="M4 10l10 5 8-4-10-5-8 4z" fill={color} fillOpacity="0.6" />
        <path d="M4 10v3l10 5v-3l-10-5z" fill={color} fillOpacity="0.4" />
        {/* Top Sheet */}
        <path d="M4 6l10 5 8-4-10-5-8 4z" fill={color} />
        <path d="M4 6v3l10 5v-3l-10-5z" fill={color} fillOpacity="0.2" />
    </svg>
);

export const Geo3DTable = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Isometric Grid Base */}
        <path d="M2 12l10 5 10-5-10-5-10 5z" fill={color} fillOpacity="0.1" />
        {/* Rows */}
        <path d="M7 9.5l10 5" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
        <path d="M5 10.5l10 5" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
        <path d="M9 8.5l10 5" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
        {/* Vertical dividers */}
        <path d="M12 7l-5 2.5" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
        <path d="M17 9.5l-5 2.5" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
        {/* Floating Cell (Highlight) */}
        <path d="M12 5l4 2-4 2-4-2 4-2z" fill={color} />
        <path d="M12 9v6" stroke={color} strokeWidth="2" />
    </svg>
);


export const Geo3DTruck = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Trailer Block */}
        {/* Top */}
        <path d="M4 8l4-2 10 5-4 2z" fill={color} fillOpacity="0.4" />
        {/* Side (Right) */}
        <path d="M14 13l4-2v6l-4 2z" fill={color} fillOpacity="0.8" />
        {/* Front (Left) */}
        <path d="M4 8l10 5v6L4 14z" fill={color} />

        {/* Cab Block - Attached to Right */}
        <path d="M18 11l4-2v6l-4 2z" fill={color} fillOpacity="0.6" /> {/* Side */}
        <path d="M18 11l4-2-1.5-0.75-2.5 0.75z" fill={color} fillOpacity="0.3" /> {/* Top */}

        {/* Wheels - Isometric Cylinders */}
        <ellipse cx="8" cy="19" rx="2" ry="1" fill="#1E293B" />
        <ellipse cx="18" cy="18" rx="2" ry="1" fill="#1E293B" />
    </svg>
);

export const Geo3DMapPin = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Shadow */}
        <ellipse cx="12" cy="21" rx="4" ry="1.5" fill="black" fillOpacity="0.2" />
        {/* Pin Head - Isometric Cube style */}
        <path d="M12 2l6 3v7l-6 3-6-3V5z" fill={color} />
        <path d="M12 2l6 3-6 3-6-3z" fill="white" fillOpacity="0.3" /> {/* Top Highlight */}
        <path d="M12 8v7l6-3V5z" fill="black" fillOpacity="0.1" /> {/* Right Shade */}
        {/* Pin Point */}
        <path d="M12 15l-2 5 2 2 2-2z" fill={color} />
        <path d="M12 15v7l2-2z" fill="black" fillOpacity="0.2" />
    </svg>
);

export const Geo3DPackage = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Isometric Box */}
        {/* Top Face */}
        <path d="M12 4L20 8L12 12L4 8L12 4Z" fill={color} fillOpacity="0.4" />
        {/* Right Face */}
        <path d="M20 8V18L12 22V12L20 8Z" fill={color} fillOpacity="0.8" />
        {/* Left Face */}
        <path d="M4 8V18L12 22V12L4 8Z" fill={color} />
        {/* Tape Detail */}
        <path d="M12 4L12 12L12 22" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
        <path d="M4 8L12 12L20 8" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
    </svg>
);

// ============================================
// FINANCIAL & MARKET
// ============================================

export const Geo3DWallet = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Wallet Back Body */}
        <path d="M3 6l14 4v10l-14-4z" fill={color} fillOpacity="0.8" />
        <path d="M3 6l14 4 4-2-14-4z" fill={color} fillOpacity="0.4" /> {/* Thickness Top */}

        {/* Front Flap */}
        <path d="M7 9l14 4v8l-14-4z" fill={color} />

        {/* Cash/Card Inserted */}
        <path d="M5 5l12 3.5" stroke="#22C55E" strokeWidth="3" />

        {/* Button/Lock */}
        <path d="M16 14l2 0.5-2 1-2-1z" fill="white" />
    </svg>
);

export const Geo3DChart = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Base Plate */}
        <path d="M2 14l10 5 10-5-10-5z" fill={color} fillOpacity="0.2" />

        {/* Bar 1 (Short) */}
        <path d="M5 14l4 2v-4l-4-2z" fill={color} fillOpacity="0.6" /> {/* Front */}
        <path d="M9 16v-4l2-1v4z" fill={color} fillOpacity="0.4" /> {/* Side */}
        <path d="M5 12l4 2 2-1-4-2z" fill={color} fillOpacity="0.2" /> {/* Top */}

        {/* Bar 2 (Medium) */}
        <path d="M10 13l4 2v-8l-4-2z" fill={color} fillOpacity="0.8" />
        <path d="M14 15v-8l2-1v8z" fill={color} fillOpacity="0.6" />
        <path d="M10 7l4 2 2-1-4-2z" fill={color} fillOpacity="0.4" />

        {/* Bar 3 (Tall) */}
        <path d="M15 12l4 2V4l-4-2z" fill={color} />
        <path d="M19 14V4l2-1v10z" fill={color} fillOpacity="0.8" />
        <path d="M15 2l4 2 2-1-4-2z" fill={color} fillOpacity="0.6" />
    </svg>
);

export const Geo3DGavel = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Sound Block (Base) */}
        <path d="M4 18l8 4 8-4-8-4z" fill={color} fillOpacity="0.2" />

        {/* Gavel Head (Cylinder-ish isometric) */}
        <path d="M14 8l3 1.5 3-1.5-3-1.5z" fill={color} fillOpacity="0.8" /> {/* Front Cap */}
        <path d="M6 4l3 1.5 3-1.5-3-1.5z" fill={color} fillOpacity="0.6" /> {/* Back Cap */}
        <path d="M9 5.5l8 4v3l-8-4z" fill={color} /> {/* Body */}

        {/* Handle */}
        <path d="M12 9l6 9" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
);

export const Geo3DArrowUp = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* 3D Arrow */}
        <path d="M12 2L4 10H8V22H16V10H20L12 2Z" fill={color} />
        <path d="M12 2L20 10H16V22" fill="black" fillOpacity="0.2" /> {/* Right Shade */}
    </svg>
);

export const Geo3DArrowDown = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 22L20 14H16V2H8V14H4L12 22Z" fill={color} />
        <path d="M12 22L4 14H8V2" fill="black" fillOpacity="0.1" /> {/* Left Highlight */}
    </svg>
);

// ============================================
// DOCUMENTS & DATA
// ============================================

export const Geo3DDocument = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Paper Sheet - Isometric Plane */}
        <path d="M6 4l10 5v13l-10-5z" fill={color} />
        <path d="M6 4l8-2 2 1-10 5z" fill={color} fillOpacity="0.4" /> {/* Thickness */}

        {/* Lines */}
        <path d="M8 8l6 3" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
        <path d="M8 12l6 3" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
        <path d="M8 16l4 2" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
    </svg>
);

export const Geo3DUpload = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Cloud Base */}
        <path d="M6 18h12v-4a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v4z" fill={color} fillOpacity="0.2" />
        {/* Up Arrow 3D */}
        <path d="M12 4l-4 6h3v6h2v-6h3z" fill={color} />
        <path d="M12 4l3 6h-1v6" fill="black" fillOpacity="0.15" />
    </svg>
);

export const Geo3DScan = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Floating Document */}
        <path d="M8 6l8 2v10l-8-2z" fill="white" fillOpacity="0.9" />
        {/* Scan Laser Plane */}
        <path d="M4 12l16 4" stroke="#EF4444" strokeWidth="2" />
        <path d="M4 12l16 4v4l-16-4z" fill="#EF4444" fillOpacity="0.2" />
    </svg>
);

// ============================================
// COMMUNICATION & USERS
// ============================================

export const Geo3DMessageSquare = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Speech Bubble Box 3D */}
        <path d="M4 6l12 3v8l-12-3z" fill={color} />
        <path d="M16 9l4 1v8l-4-1z" fill={color} fillOpacity="0.6" />
        <path d="M4 6l12 3 4 1-12-2z" fill={color} fillOpacity="0.4" />

        {/* Tail */}
        <path d="M8 17v4l4-5" fill={color} />
    </svg>
);

export const Geo3DBadge = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Hexagon Shield 3D */}
        <path d="M12 2l8 4v7l-8 9-8-9V6z" fill={color} />
        <path d="M12 2l8 4-8 9-8-4z" fill="white" fillOpacity="0.2" /> {/* Top Facet Shine */}
        <path d="M20 6v7l-8 9v-9z" fill="black" fillOpacity="0.2" /> {/* Right Shade */}
        {/* Star/Icon center */}
        <path d="M12 8l2 5h-4z" fill="white" />
    </svg>
);

export const Geo3DBuilding = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Isometric Building */}
        <path d="M12 2l8 4v16l-8-4z" fill={color} fillOpacity="0.6" /> {/* Right Wall */}
        <path d="M4 6l8-4v16l-8 4z" fill={color} /> {/* Left Wall */}
        <path d="M12 2l8 4-8 4-8-4z" fill={color} fillOpacity="0.3" /> {/* Roof */}
    </svg>
);

// ============================================
// UTILITY & EXTRAS
// ============================================

export const Geo3DAlertTriangle = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Pyramid */}
        <path d="M12 3l8 18H4z" fill="none" /> {/* Spacer */}
        <path d="M12 3l8 18-9-3z" fill={color} fillOpacity="0.6" /> {/* Right Face */}
        <path d="M12 3l-8 18 9-3z" fill={color} /> {/* Left Face */}
        <path d="M12 12v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 18v.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const Geo3DCheckbox = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* 3D Box */}
        <path d="M4 8l8-2 8 2v10l-8 2-8-2z" fill={color} fillOpacity="0.2" />
        <path d="M8 12l4 4 6-8" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const Geo3DActivity = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Pulse Line on isometric plane */}
        <path d="M2 14l4-2 4 6 4-10 4 6 4-2" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 14l4-2 4 6 4-10 4 6 4-2" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
    </svg>
);

// ============================================
// DEDICATED RESOLUTION & UTILITY ICONS
// ============================================

export const Geo3DBot = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Supercomputer / AI Core */}

        {/* Base Platform */}
        <path d="M2 12l10 5 10-5-10-5z" fill={color} fillOpacity="0.2" />

        {/* Main Server Block */}
        <path d="M6 14l6 3v4l-6-3z" fill={color} /> {/* Left Face */}
        <path d="M12 17l6-3v4l-6 3z" fill={color} fillOpacity="0.8" /> {/* Right Face */}
        <path d="M6 14l6 3 6-3-6-3z" fill={color} fillOpacity="0.4" /> {/* Top Face */}

        {/* Computing Layers (Rack details) */}
        <path d="M6 15l6 3m-6-2l6 3" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />

        {/* Floating AI Core (The "Superbrain") */}
        <path d="M12 2l4 3-4 3-4-3z" fill={color} /> {/* Top Diamond */}
        <path d="M12 8l4-3v4l-4 4-4-4v-4z" fill={color} fillOpacity="0.8" /> {/* Bottom Diamond Body */}

        {/* Data/Connection Beams */}
        <path d="M12 8v6" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        <circle cx="12" cy="5" r="1.5" fill="white" fillOpacity="0.9" /> {/* Core Glow */}
    </svg>
);

export const Geo3DUser = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Head (Cube) */}
        <path d="M12 3l4 2v4l-4 2-4-2V5z" fill={color} />
        <path d="M12 3l4 2-4 2-4-2z" fill="white" fillOpacity="0.3" />
        <path d="M16 5v4l-4 2V9z" fill="black" fillOpacity="0.1" />

        {/* Body (Bust) */}
        <path d="M6 14l6 3 6-3v6l-6 3-6-3z" fill={color} fillOpacity="0.8" />
        <path d="M6 14l6 3-6 3z" fill={color} fillOpacity="0.6" /> {/* Left Shoulder */}
        <path d="M12 17l6-3 6 3-6 3z" fill={color} fillOpacity="0.4" /> {/* Right Shoulder top-ish */}
        <path d="M18 14l-6 3 0 6 6-3z" fill="black" fillOpacity="0.1" /> {/* Right Side */}
    </svg>
);

export const Geo3DTicket = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Main Ticket Body */}
        <path d="M4 8l10-4 6 4v8l-10 8-6-8z" fill={color} />
        <path d="M14 4l6 4-10 8-6-8z" fill="white" fillOpacity="0.2" /> {/* Top Highlight */}
        <path d="M20 8v8l-6 8v-8z" fill="black" fillOpacity="0.1" /> {/* Right Shade */}

        {/* Perforation Line */}
        <path d="M8 12l8 4" stroke="white" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.6" />

        {/* Stub Hole */}
        <circle cx="10" cy="9" r="1.5" fill="white" fillOpacity="0.8" />
    </svg>
);

export const Geo3DPaperclip = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Isometric Wire Loop */}
        <path d="M16 8l-8 4v6l4 2 8-4v-8l-6-3-6 3" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 8l-8 4v6l4 2 8-4v-8l-6-3-6 3" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.4" />
    </svg>
);

export const Geo3DSend = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Dart/Plane */}
        <path d="M22 2L11 13" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" fill={color} />
        <path d="M22 2l-7 20-4-9z" fill="black" fillOpacity="0.2" /> {/* Right Wing Shadow */}
        <path d="M15 13l-4 9-2-5 6-4z" fill="white" fillOpacity="0.2" /> {/* Inner Fold */}
    </svg>
);

export const Geo3DCheckCircle = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* 3D Coin/Button */}
        <ellipse cx="12" cy="12" rx="10" ry="10" fill={color} />
        <ellipse cx="12" cy="12" rx="8" ry="8" fill="white" fillOpacity="0.1" />
        <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const Geo3DArrowRight = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M4 12h12" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <path d="M14 6l6 6-6 6" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* 3D Depth */}
        <path d="M4 14h12l5 5" stroke="black" strokeWidth="1" strokeOpacity="0.1" />
    </svg>
);

export const Geo3DRefresh = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`${className} animate-spin-slow`}>
        {/* Ring */}
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke={color} strokeWidth="4" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <path d="M22 12l-4-2" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
);

export const Geo3DX = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M18 6L6 18" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <path d="M6 6l12 12" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1" strokeOpacity="0.2" />
    </svg>
);

export const Geo3DCheck = ({ size = 24, className = "", color = "currentColor" }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* 3D shadow */}
        <path d="M20 9L9 20l-5-5" stroke="black" strokeWidth="2" strokeOpacity="0.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const Geo3DMessageCircle = Geo3DMessageSquare; // Alias for now as square works well
export const Geo3DPhone = Geo3DMessageSquare;
export const Geo3DShare = Geo3DMessageSquare;
export const Geo3DTrophy = Geo3DBadge;
export const Geo3DPieChart = Geo3DChart;
export const Geo3DScale = Geo3DGavel;
export const Geo3DTarget = Geo3DGavel;
export const Geo3DBank = Geo3DWallet;
export const Geo3DCalendar = Geo3DDocument;


