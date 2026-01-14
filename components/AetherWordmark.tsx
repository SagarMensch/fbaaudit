import React from 'react';

interface AetherWordmarkProps {
    isDarkMode?: boolean;
}

const AetherWordmark: React.FC<AetherWordmarkProps> = ({ isDarkMode = true }) => {
    return (
        /* Atlas logo - smaller size, moonlit silver in dark mode */
        <div className="flex flex-col items-center justify-center py-0 mb-6 select-none group cursor-default">
            <img
                src="/atlas_logo_cropped.png"
                alt="Atlas Custom Logotype"
                className="h-10 md:h-14 w-auto object-contain hover:scale-[1.02] transition-transform duration-700"
                style={{
                    filter: isDarkMode
                        ? 'brightness(0) saturate(100%) invert(85%) sepia(5%) saturate(200%) hue-rotate(180deg) brightness(105%) contrast(90%)'
                        : 'none'
                }}
            />
        </div>
    );
};

export default AetherWordmark;
