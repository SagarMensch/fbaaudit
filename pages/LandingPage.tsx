import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import { ArrowRight, Leaf, Activity, Globe, Database, Building2, Radar, Ship } from 'lucide-react';
import AetherWordmark from '../components/AetherWordmark';

// --- SOLID GEOMETRIC 3D ICONS (True Isometric 3D) ---
// Note: Isometric projection (30deg angles). 
// Lighting: Top = Brightest, Right = Medium, Left = Darkest.

// 1. ISOMETRIC GROWTH CHART - Enterprise & Finance
const Geo3DEnterprise = ({ size = 28 }: { size?: number }) => (
   <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Bar 1 (Short - Left) */}
      <path d="M14 54L4 49V39L14 44V54Z" fill="white" fillOpacity="0.4" />
      <path d="M14 54L24 49V39L14 44V54Z" fill="white" fillOpacity="0.7" />
      <path d="M14 44L24 39L14 34L4 39L14 44Z" fill="white" fillOpacity="1" />

      {/* Bar 2 (Medium - Center) */}
      <path d="M32 54L22 49V29L32 34V54Z" fill="white" fillOpacity="0.4" />
      <path d="M32 54L42 49V29L32 34V54Z" fill="white" fillOpacity="0.7" />
      <path d="M32 34L42 29L32 24L22 29L32 34Z" fill="white" fillOpacity="1" />

      {/* Bar 3 (Tall - Right) */}
      <path d="M50 54L40 49V19L50 24V54Z" fill="white" fillOpacity="0.4" />
      <path d="M50 54L60 49V19L50 24V54Z" fill="white" fillOpacity="0.7" />
      <path d="M50 24L60 19L50 14L40 19L50 24Z" fill="white" fillOpacity="1" />
   </svg>
);

// 2. ISOMETRIC MECHANICAL GEAR - Operations & Audit
const Geo3DOperations = ({ size = 28 }: { size?: number }) => (
   <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Main Hollow Cylinder Body */}
      <path d="M32 56C44 50 52 40 52 32V24C52 16 44 12 32 12C20 12 12 16 12 24V32C12 40 20 50 32 56Z" fill="white" fillOpacity="0.1" />
      {/* Top Face (Rim) */}
      <path d="M32 44C24 44 16 38 16 32C16 26 24 20 32 20C40 20 48 26 48 32C48 38 40 44 32 44ZM32 26C28 26 26 29 26 32C26 35 28 38 32 38C36 38 38 35 38 32C38 29 36 26 32 26Z" fill="white" fillOpacity="1" fillRule="evenodd" />
      {/* Side Teeth (Implied thick extruded gear) */}
      <path d="M52 24V32C52 35 50 38 48 40V32C48 28 44 24 32 24C24 24 18 26 16 30V24C16 18 24 12 32 12C44 12 52 16 52 24Z" fill="white" fillOpacity="0.5" />
      {/* Center Hole Shadow */}
      <ellipse cx="32" cy="32" rx="6" ry="3" fill="black" fillOpacity="0.3" />
   </svg>
);

// 3. ISOMETRIC STACKED CRATES - Supplier Portal
const Geo3DSupplier = ({ size = 28 }: { size?: number }) => (
   <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Bottom Box Left */}
      <path d="M22 58L2 48V32L22 42V58Z" fill="white" fillOpacity="0.3" />
      <path d="M22 58L42 48V32L22 42V58Z" fill="white" fillOpacity="0.6" />
      <path d="M22 42L42 32L22 22L2 32L22 42Z" fill="white" fillOpacity="0.9" />

      {/* Bottom Box Right (Behind) */}
      <path d="M52 50L32 40V24L52 34V50Z" fill="white" fillOpacity="0.6" />
      <path d="M52 34L62 24L42 14L32 24L52 34Z" fill="white" fillOpacity="0.9" />

      {/* Top Box (On top of Left) */}
      <path d="M30 40L14 32V20L30 28V40Z" fill="white" fillOpacity="0.4" />
      <path d="M30 40L46 32V20L30 28V40Z" fill="white" fillOpacity="0.7" />
      <path d="M30 28L46 20L30 12L14 20L30 28Z" fill="white" fillOpacity="1" />
      {/* Tape Detail */}
      <path d="M14 20L30 28L46 20" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
   </svg>
);


// --- WIDGET ICONS (Re-scaled Isometric) ---

// 4. LOW POLY SPHERE - Top Bar (Globe)
const Geo3DGlobe = ({ size = 14, className }: { size?: number, className?: string }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
      <path d="M12 2L6 8L12 14L18 8L12 2Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M6 8L2 12L6 16L12 14L6 8Z" fill="currentColor" fillOpacity="0.4" />
      <path d="M18 8L22 12L18 16L12 14L18 8Z" fill="currentColor" fillOpacity="0.4" />
      <path d="M6 16L12 22L18 16L12 14L6 16Z" fill="currentColor" fillOpacity="0.8" />
   </svg>
);

// 5. 3D VOXEL LEAF - Carbon Watch
const Geo3DLeaf = ({ size = 14, className }: { size?: number, className?: string }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Stem */}
      <path d="M12 22L12 16" stroke="currentColor" strokeWidth="2" />
      {/* Main Leaf Body (Diamond Prism) */}
      <path d="M12 16L6 12L12 4L18 12L12 16Z" fill="currentColor" fillOpacity="0.8" />
      <path d="M12 16V4" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" />
   </svg>
);


// 6. ISOMETRIC PROCESSOR CHIP - SequelString AI
const Geo3DActivity = ({ size = 16, color = "#EA580C" }: { size?: number; color?: string }) => (
   <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Base Plate */}
      <path d="M16 28L4 22V10L16 16V28Z" fill={color} fillOpacity="0.3" />
      <path d="M16 28L28 22V10L16 16V28Z" fill={color} fillOpacity="0.5" />
      <path d="M16 16L28 10L16 4L4 10L16 16Z" fill={color} fillOpacity="0.8" />
      {/* Core Logic Unit (Raised Center) */}
      <path d="M16 22L10 19V13L16 16V22Z" fill={color} fillOpacity="0.6" />
      <path d="M16 22L22 19V13L16 16V22Z" fill={color} fillOpacity="0.8" />
      <path d="M16 16L22 13L16 10L10 13L16 16Z" fill={color} fillOpacity="1" />
   </svg>
);

// 7. ISOMETRIC VAULT / LOCK - Confidential
const Geo3DBuilding = ({ size = 16, color = "#E60012" }: { size?: number; color?: string }) => (
   <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Main Box Body */}
      <path d="M16 30L6 24V12L16 18V30Z" fill={color} fillOpacity="0.4" />
      <path d="M16 30L26 24V12L16 18V30Z" fill={color} fillOpacity="0.7" />
      <path d="M16 18L26 12L16 6L6 12L16 18Z" fill={color} fillOpacity="0.9" />
      {/* Lock Dial Detail on Right Face */}
      <circle cx="21" cy="21" r="3" fill="white" fillOpacity="0.4" transform="scale(1 0.5) rotate(-30)" />
   </svg>
);

// 8. ISOMETRIC SERVER RACK - Enterprise Core
const Geo3DDatabase = ({ size = 16, color = "#0F62FE" }: { size?: number; color?: string }) => (
   <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Server Tower Body */}
      <path d="M16 31L6 26V9L16 14V31Z" fill={color} fillOpacity="0.4" />
      <path d="M16 31L26 26V9L16 14V31Z" fill={color} fillOpacity="0.7" />
      <path d="M16 14L26 9L16 4L6 9L16 14Z" fill={color} fillOpacity="1" />
      {/* Rack Mount Lines / Vents */}
      <path d="M26 12L16 17" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
      <path d="M26 15L16 20" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
      <path d="M26 18L16 23" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
      <path d="M26 21L16 26" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
      {/* LED Indicator */}
      <circle cx="23" cy="11.5" r="1" fill="#00ff00" />
   </svg>
);



interface LandingPageProps {
   onLogin: (role: UserRole) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
   const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
   const [loadingStep, setLoadingStep] = useState(0);

   // Theme Toggle State - Night (dark) / Day (light)
   const [isDarkMode, setIsDarkMode] = useState(true);

   // Universal Adapter Animation State
   const [adapterIndex, setAdapterIndex] = useState(0);
   const adapterStates = [
      'Multi-ERP Gateway',
      'SAP S/4 Connected',
      'Oracle Ready',
      'Universal Adapter'
   ];

   useEffect(() => {
      const interval = setInterval(() => {
         setAdapterIndex((prev) => (prev + 1) % adapterStates.length);
      }, 3000); // Cycle every 3 seconds
      return () => clearInterval(interval);
   }, []);

   const canvasRef = useRef<HTMLCanvasElement>(null);

   // HOLOGRAPHIC STRATEGY GLOBE
   // Aesthetic: Glass, Data Projection, Clean, Unobtrusive
   useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = window.innerWidth;
      let height = window.innerHeight;
      let rotation = 0;

      const setDimensions = () => {
         // Compensate for zoom: 0.9 (1 / 0.9 = 1.11111)
         width = window.innerWidth / 0.9;
         height = window.innerHeight / 0.9;
         canvas.width = width;
         canvas.height = height;
      };

      setDimensions();
      window.addEventListener('resize', setDimensions);

      // CONFIG
      const GLOBE_RADIUS = 340;
      const MERIDIANS = 40;
      const PARALLELS = 24;

      // CONTINENT MAPPING (Approximate Lat/Lon Boxes)
      const isLand = (phi: number, theta: number) => {
         // Normalize theta to -PI to PI
         let t = theta % (2 * Math.PI);
         if (t > Math.PI) t -= 2 * Math.PI;
         if (t < -Math.PI) t += 2 * Math.PI;

         // North America
         if (phi > 0.4 && phi < 1.0 && t > -2.2 && t < -1.2) return true;
         // South America
         if (phi > 1.2 && phi < 2.2 && t > -1.5 && t < -0.8) return true;
         // Europe/Africa
         if (phi > 0.4 && phi < 2.2 && t > -0.3 && t < 0.6) return true;
         // Asia
         if (phi > 0.4 && phi < 1.5 && t > 0.8 && t < 2.5) return true;
         // Australia
         if (phi > 1.8 && phi < 2.4 && t > 1.8 && t < 2.6) return true;

         return false;
      };

      // ANIMATION LOOP
      let animationFrameId: number;
      const animate = () => {
         ctx.clearRect(0, 0, width, height);

         rotation += 0.0015; // Slow, elegant rotation

         const cx = width / 2;
         const cy = height / 2;
         const tilt = 0.4;

         // HOLOGRAPHIC PALETTE
         // Clean, Transparent, High-Tech. No "Muddy" colors.
         const oceanFill = isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)'; // Glassy
         const landFill = isDarkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.08)'; // Subtle Highlight
         const gridStroke = isDarkMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.3)'; // Thin Laser
         const rimColor = isDarkMode ? 'rgba(56, 189, 248, 0.6)' : 'rgba(15, 23, 42, 0.4)';

         // 1. DRAW GLASS SPHERE (Base)
         ctx.beginPath();
         ctx.arc(cx, cy, GLOBE_RADIUS - 1, 0, Math.PI * 2);
         ctx.fillStyle = oceanFill;
         ctx.fill();

         // Sharp Rim Light
         ctx.shadowColor = rimColor;
         ctx.shadowBlur = 20;
         ctx.strokeStyle = gridStroke;
         ctx.lineWidth = 1;
         ctx.stroke();
         ctx.shadowBlur = 0;

         // 2. DRAW HOLOGRAPHIC GRID & LAND
         // We draw back-faces faintly, front-faces clearly

         // Pre-calculate projection helper
         const project = (p: number, t: number) => {
            const x = GLOBE_RADIUS * Math.sin(p) * Math.cos(t);
            const y = GLOBE_RADIUS * Math.cos(p);
            const z = GLOBE_RADIUS * Math.sin(p) * Math.sin(t);
            const zRot = y * Math.sin(tilt) + z * Math.cos(tilt);
            const yRot = y * Math.cos(tilt) - z * Math.sin(tilt);
            const scale = 1000 / (1000 - zRot);
            return { x: cx + x * scale, y: cy + yRot * scale, z: zRot };
         }

         ctx.lineWidth = 0.8; // Thin precision lines

         for (let i = 0; i < MERIDIANS; i++) {
            for (let j = 0; j < PARALLELS; j++) {
               // Check Land
               const staticTheta = (i / MERIDIANS) * Math.PI * 2 - Math.PI;
               const phi1 = (j / PARALLELS) * Math.PI;
               const phi2 = ((j + 1) / PARALLELS) * Math.PI;
               const landCheck = isLand((phi1 + phi2) / 2, staticTheta);

               // Draw Cell
               const theta1 = (i / MERIDIANS) * Math.PI * 2 + rotation;
               const theta2 = ((i + 1) / MERIDIANS) * Math.PI * 2 + rotation;

               const p1 = project(phi1, theta1);
               const p2 = project(phi1, theta2);
               const p3 = project(phi2, theta2);
               const p4 = project(phi2, theta1);

               if (p1.z > -20) { // Front-ish
                  ctx.beginPath();
                  ctx.moveTo(p1.x, p1.y);
                  ctx.lineTo(p2.x, p2.y);
                  ctx.lineTo(p3.x, p3.y);
                  ctx.lineTo(p4.x, p4.y);
                  ctx.closePath();

                  if (landCheck) {
                     ctx.fillStyle = landFill;
                     ctx.fill();
                  }

                  ctx.strokeStyle = gridStroke;
                  ctx.stroke();
               }
            }
         }

         animationFrameId = requestAnimationFrame(animate);
      };

      animate();

      return () => {
         cancelAnimationFrame(animationFrameId);
         window.removeEventListener('resize', setDimensions);
      };
   }, [isDarkMode]);

   // Helper for projection
   const getProjected = (phi: number, theta: number, radius: number, cx: number, cy: number, tilt: number) => {
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      const yRot = y * Math.cos(tilt) - z * Math.sin(tilt);
      const zRot = y * Math.sin(tilt) + z * Math.cos(tilt);

      const scale = 1000 / (1000 - zRot);
      return {
         x: cx + x * scale,
         y: cy + yRot * scale,
         z: zRot
      };
   };

   const handleRoleSelect = (role: UserRole) => {
      // CRITICAL: Vendors do not use SSO. They go straight to the Login Gate.
      if (role === 'VENDOR') {
         onLogin(role);
         return;
      }

      setLoadingRole(role);
      setLoadingStep(1); // Authenticating

      // Sequence for Internal Users (SSO Simulation)
      setTimeout(() => setLoadingStep(2), 600);  // Connecting SAP (Faster)
      setTimeout(() => setLoadingStep(3), 1200); // Loading Cockpit (Faster)
      setTimeout(() => onLogin(role), 1500);     // Done (Snappy)
   };

   const getLoadingText = () => {
      if (loadingStep === 1) return `Authenticating via ${loadingRole === 'HITACHI' ? 'Hitachi SSO' : 'Secure Gateway'}...`;
      if (loadingStep === 2) return "Handshake with SAP S/4HANA Finance...";
      if (loadingStep === 3) return "Initializing Control Tower...";
      return "Processing...";
   };

   return (
      <div
         className={`h-[111.1111vh] min-h-[111.1111vh] w-full flex flex-col relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-black'}`}
         style={{
            zoom: 0.9,
            fontFamily: "'Instrument Sans', sans-serif",
            backgroundColor: isDarkMode ? '#1a1a1e' : '#f8fafc'
         }}
      >

         {/* THEME TOGGLE BUTTON - Elegant Sun/Moon */}
         <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`fixed top-24 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110 ${isDarkMode
               ? 'bg-[#252530] border border-[#C0C8D4]/30 text-[#E8ECF0] hover:border-[#E8ECF0]/60'
               : 'bg-white border border-slate-200 text-amber-500 hover:border-amber-400'
               }`}
            title={isDarkMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
         >
            {isDarkMode ? (
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
               </svg>
            ) : (
               <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
               </svg>
            )}
         </button>



         {/* KUBRICK 3D STARFIELD - Native Canvas Animation */}
         <canvas
            ref={canvasRef}
            className={`fixed inset-0 z-0 transition-colors duration-1000 ${isDarkMode ? 'bg-[#0B0C10]' : 'bg-[#FAFAFA]'}`}
         />

         {/* Subtle Vignette for Cinematic Depth */}
         <div className={`fixed inset-0 z-0 pointer-events-none ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-80' : 'bg-[radial-gradient(circle_at_center,transparent_0%,#ffffff_100%)] opacity-60'}`}></div>

         {/* 2. TOP BAR - CINEMATIC STRIP */}
         <div className={`relative z-20 h-24 px-12 flex justify-between items-center transition-colors duration-500`}>
            {/* Left: Client Identity */}
            <div className="flex items-center space-x-8">
               <div className={`flex flex-col border-l-2 pl-6 py-1 ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}>
                  {/* Client Name - Cursive */}
                  <span className={`text-4xl font-cursive leading-none ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                     Confidential
                  </span>
                  {/* Status - Private */}
                  <span className={`text-[11px] font-sans font-bold tracking-[0.2em] uppercase mt-0 ${isDarkMode ? 'text-[#C0C8D4]' : 'text-[#E60012]'}`}>
                     Private
                  </span>
               </div>
            </div>

            {/* Right: System Status & Control */}
            <div className="flex items-center space-x-12">
               {/* SequelString AI Logo */}
               <div className="flex items-center space-x-4 opacity-90 hover:opacity-100 transition-opacity">
                  <img
                     src="/sequelstring_logo.jpg"
                     alt="SequelString AI"
                     className="h-10 w-auto"
                  // Removing aggressive filters to ensure logo is visible as requested
                  />
                  <div className={`h-8 w-px ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}></div>
                  <span className={`text-[11px] font-mono tracking-widest uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                     v3.0 Control Tower
                  </span>
               </div>


               {/* Indicators - High Precision / Solid Colors */}
               <div className="flex items-center space-x-8 text-[10px] font-mono tracking-widest">
                  <div className={`flex items-center px-4 py-1.5 border ${isDarkMode ? 'border-white bg-black text-white' : 'border-black bg-white text-black'}`}>
                     <div className={`w-2 h-2 rounded-full mr-3 ${isDarkMode ? 'bg-[#00FF00]' : 'bg-[#008000]'}`}></div>
                     <span className="font-bold">SYSTEM ONLINE</span>
                  </div>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>US / EN</span>
               </div>
            </div>
         </div>

         {/* 3. MAIN CONTENT CONTAINER */}
         <div className="relative z-10 flex-1 flex flex-col items-center justify-start gap-8 py-4 px-4 md:px-8 overflow-hidden">

            {/* Top Spacer / Title */}
            <div className="text-center mt-0 mb-2 relative">
               {/* Custom Geometric Wordmark */}
               <AetherWordmark isDarkMode={isDarkMode} />
               {/* Tagline */}
               <p className={`text-lg font-normal max-w-lg mx-auto leading-relaxed mt-1 ${isDarkMode ? 'text-white/70' : 'text-slate-600'}`} style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                  Global Logistics Command Center.
                  <br />
                  <span className="text-sm opacity-80">Connecting Global Enterprises, SequelString AI, and Supplier Networks.</span>
               </p>
            </div>

            {/* CARD CONTAINER - Centered - REDUCED HEIGHT AND WIDTH */}
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
               <PersonaCard
                  role="HITACHI"
                  title="Enterprise & Finance"
                  subtitle="Spend Analytics, Payment Approval, & Reporting"
                  icon={<Geo3DEnterprise size={28} />}
                  theme="green"
                  onClick={handleRoleSelect}
                  loading={loadingRole === 'HITACHI'}
               />
               <PersonaCard
                  role="3SC"
                  title="Operations & Audit"
                  subtitle="Rate Management, Exceptions, & Onboarding"
                  icon={<Geo3DOperations size={28} />}
                  theme="orange"
                  onClick={handleRoleSelect}
                  loading={loadingRole === '3SC'}
               />
               <PersonaCard
                  role="VENDOR"
                  title="Supplier Portal"
                  subtitle="Invoice Submission, Status, & Disputes"
                  icon={<Geo3DSupplier size={28} />}
                  theme="blue"
                  onClick={handleRoleSelect}
                  loading={loadingRole === 'VENDOR'}
               />
            </div>

            {/* FOOTER WIDGETS */}
            <div className="w-full max-w-7xl flex flex-wrap justify-center md:justify-between items-end mt-auto px-2 pb-0 gap-4">

               {/* Left Widget: Sustainability */}
               <div className={`backdrop-blur rounded-sm p-2 w-48 flex flex-col transition-all ${isDarkMode ? 'bg-[#252530] border border-[#C0C8D4]/20 hover:border-[#C0C8D4]/40' : 'bg-white/90 border border-slate-200 shadow-sm hover:shadow-md'}`}>
                  <div className={`flex items-center justify-between mb-2 border-b pb-1 ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                     <div className={`flex items-center ${isDarkMode ? 'text-[#C0C8D4]' : 'text-teal-600'}`}>
                        <Geo3DLeaf size={14} className="mr-2" />
                        <span className="text-[10px] font-mono-premium font-bold uppercase tracking-wider">Carbon Watch</span>
                     </div>
                     <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-[#C0C8D4]' : 'bg-teal-600'}`}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <div className={`text-[9px] font-mono-premium uppercase font-bold mb-0.5 ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>Emissions (YTD)</div>
                        <div className={`text-base font-mono-premium font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>14,250 T</div>
                     </div>
                     <div>
                        <div className={`text-[9px] font-mono-premium uppercase font-bold mb-0.5 ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>Green Util.</div>
                        <div className={`text-base font-mono-premium font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>42%</div>
                     </div>
                  </div>
               </div>

               {/* Right Widget: Architecture */}
               <div className={`backdrop-blur rounded-sm p-2 w-72 flex items-center justify-between transition-all ${isDarkMode ? 'bg-[#252530] border border-[#C0C8D4]/20 hover:border-[#C0C8D4]/40' : 'bg-white/90 border border-slate-200 shadow-sm hover:shadow-md'}`}>
                  <div className="text-center group cursor-default">
                     <div className="mb-1 flex justify-center group-hover:scale-110 transition-transform"><Geo3DActivity size={20} /></div>
                     <p className={`text-[9px] font-mono-premium font-bold uppercase ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>SequelString AI</p>
                  </div>

                  <div className={`h-px w-6 ${isDarkMode ? 'bg-[#C0C8D4]/30' : 'bg-slate-300'}`}></div>

                  <div className="text-center group cursor-default">
                     <div className="mb-1 flex justify-center group-hover:scale-110 transition-transform"><Geo3DBuilding size={20} /></div>
                     <p className={`text-[9px] font-mono-premium font-bold uppercase ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>Confidential</p>
                  </div>

                  <div className={`h-px w-6 ${isDarkMode ? 'bg-[#C0C8D4]/30' : 'bg-slate-300'}`}></div>

                  <div className="text-center group cursor-default w-28">
                     <div className="mb-1 flex justify-center group-hover:scale-110 transition-transform relative">
                        <Geo3DDatabase size={20} />
                        <div className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full animate-pulse border ${isDarkMode ? 'bg-[#C0C8D4] border-[#252530]' : 'bg-teal-500 border-white'}`}></div>
                     </div>
                     <p className={`text-[9px] font-mono-premium font-bold uppercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Enterprise Core</p>
                     <div className="h-3 overflow-hidden relative mt-0.5 flex items-center justify-center">
                        <p key={adapterIndex} className={`text-[8px] font-mono-premium font-bold uppercase absolute whitespace-nowrap animate-fade-in-up ${isDarkMode ? 'text-[#C0C8D4]' : 'text-slate-400'}`}>
                           {adapterStates[adapterIndex]} ●
                        </p>
                     </div>
                  </div>
               </div>

            </div>

            {/* Loading Overlay */}
            {loadingRole && (
               <div className="fixed inset-0 bg-white/95 z-50 flex flex-col items-center justify-center">
                  <div className="flex items-center space-x-4 mb-8">
                     <div className="w-3 h-3 bg-[#E60012] rounded-sm animate-pulse" style={{ animationDelay: '0s' }}></div>
                     <div className="w-3 h-3 bg-[#E60012] rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                     <div className="w-3 h-3 bg-[#E60012] rounded-sm animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <h3 className="text-xl font-ibm-serif font-light text-gray-900 mb-2">{getLoadingText()}</h3>
                  <div className="w-96 h-1 bg-gray-200 rounded-sm overflow-hidden mt-4">
                     <div
                        className="h-full bg-[#E60012] transition-all duration-300 ease-linear"
                        style={{ width: `${loadingStep * 33}%` }}
                     ></div>
                  </div>
               </div>
            )}

         </div>
      </div>
   );
};

// --- SOLID COLOR CARD COMPONENT ---
interface PersonaCardProps {
   role: UserRole;
   title: string;
   subtitle?: string;
   icon: React.ReactNode;
   theme: 'red' | 'green' | 'blue' | 'orange';
   onClick: (role: UserRole) => void;
   loading: boolean;
}

const PersonaCard: React.FC<PersonaCardProps> = ({ role, title, subtitle, icon, theme, onClick, loading }) => {

   // Solid, Matte Enterprise Colors
   const styles = {
      red: 'bg-[#E60012] hover:bg-[#B5000E]',   // Hitachi Red
      green: 'bg-[#004D40] hover:bg-[#00382E]', // TEAL BRANDING (Was Green)
      blue: 'bg-[#0F62FE] hover:bg-[#034BD8]',  // IBM Blue
      orange: 'bg-[#EA580C] hover:bg-[#C2410C]', // 3SC Orange
   };

   return (
      <div
         onClick={() => !loading && onClick(role)}
         className={`
        ${styles[theme]}
        relative overflow-hidden cursor-pointer
        rounded-sm p-6 h-64
        transition-all duration-300
        group
        shadow-lg hover:shadow-2xl hover:-translate-y-1
      `}
      >
         {/* Background Icon Watermark - SCALED DOWN */}
         <div className="absolute -bottom-6 -right-6 text-black opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform duration-500">
            {React.cloneElement(icon as React.ReactElement<any>, { size: 150 })}
         </div>

         {/* Card Content */}
         <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
               <div className="w-12 h-12 bg-black/20 rounded-sm flex items-center justify-center mb-4 text-white backdrop-blur-sm">
                  {React.cloneElement(icon as React.ReactElement<any>, { size: 28 })}
               </div>
               <h3 className="text-2xl font-rufina font-bold text-white mb-3 tracking-tight">{title}</h3>
               <p className="text-sm font-ibm-sans text-white/95 leading-relaxed max-w-[95%] font-light text-black">
                  {subtitle}
               </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
               <span className="text-[10px] font-bold text-white uppercase tracking-widest opacity-80 group-hover:opacity-100">
                  Access Portal
               </span>
               <div className="bg-white/20 p-2 rounded-sm text-white group-hover:bg-white/30 transition-colors">
                  <ArrowRight size={16} />
               </div>
            </div>
         </div>
      </div>
   );
};
