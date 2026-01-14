import React from 'react';

// ==========================================
// GEOMETRIC WIREFRAME SILVER GLOBE
// True 3D CSS construction using rotating rings
// ==========================================

export const SilverGlobe = ({ size = 32, className = "" }: { size?: number, className?: string }) => {
    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            <style>{`
                @keyframes spin3D {
                    from { transform: rotateY(0deg) rotateX(23.5deg); }
                    to { transform: rotateY(360deg) rotateX(23.5deg); }
                }
                .globe-container {
                    perspective: 1000px;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .globe-skeleton {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                    animation: spin3D 10s linear infinite;
                }
                .globe-ring {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border: 1px solid rgba(226, 232, 240, 0.6); /* Slate-200 silverish */
                    border-radius: 50%;
                    box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
                }
                /* Latitudes (Horizontal Rings) */
                .lat-1 { transform: rotateX(90deg) translateZ(0px); } /* Equator */
                .lat-2 { transform: rotateX(90deg) translateZ(8px) scale(0.85); }
                .lat-3 { transform: rotateX(90deg) translateZ(-8px) scale(0.85); }
                
                /* Longitudes (Vertical Rings) */
                .long-1 { transform: rotateY(0deg); }
                .long-2 { transform: rotateY(45deg); }
                .long-3 { transform: rotateY(90deg); }
                .long-4 { transform: rotateY(135deg); }
            `}</style>

            <div className="globe-container">
                <div className="globe-skeleton">
                    {/* Longitudes (Vertical Meridians) */}
                    <div className="globe-ring long-1 border-slate-300"></div>
                    <div className="globe-ring long-2 border-slate-300"></div>
                    <div className="globe-ring long-3 border-slate-300"></div>
                    <div className="globe-ring long-4 border-slate-300"></div>

                    {/* Latitudes (Horizontal Parallels) */}
                    {/* Note: In CSS 3D, 'translateZ' moves it along the facing axis. 
                        We keep it simple: Just the main sphere outline + longitudes gives the best 'Universal' wireframe look.
                        Adding too many latitudes makes it messy at small sizes (32px).
                        We'll add just the Equator for structure.
                    */}
                    <div className="globe-ring lat-1 border-slate-400/50"></div>

                    {/* Inner Core / Nucleus (Optional, for 'Geometric' density) */}
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-blue-500/20 rounded-full blur-sm transform -translate-x-1/2 -translate-y-1/2"></div>
                </div>
            </div>

            {/* Outer Glow */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>
        </div>
    );
};
