import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = true }) => {
    return (
        <div className={`
      bg-white border border-slate-200/60 rounded-xl shadow-sm relative overflow-hidden
      ${hoverEffect ? 'hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300' : ''}
      ${className}
    `}>
            {/* Subtle top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-50"></div>
            {children}
        </div>
    );
};
