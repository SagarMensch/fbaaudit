import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    className = '',
    ...props
}) => {
    const baseStyles = "relative inline-flex items-center justify-center font-bold transition-all duration-300 rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-[0_4px_14px_0_rgba(20,184,166,0.39)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.23)] hover:-translate-y-0.5 border border-teal-400/20",
        secondary: "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-600 shadow-lg hover:-translate-y-0.5",
        ghost: "bg-transparent text-slate-500 hover:text-teal-600 hover:bg-teal-50",
        danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.23)] hover:-translate-y-0.5",
        outline: "bg-transparent border border-slate-300 text-slate-600 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-8 py-3 text-base"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 blur-md"></div>
            )}
            {Icon && <Icon size={size === 'sm' ? 14 : size === 'md' ? 18 : 20} className="mr-2 relative z-10" />}
            <span className="relative z-10">{children}</span>
        </button>
    );
};
