// Componente Input reutilizable con estados modernos estilo Airbnb
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export function Input({
    label,
    error,
    helperText,
    fullWidth = false,
    icon,
    className = '',
    ...props
}: InputProps) {
    const baseStyles = 'px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 min-h-[44px] text-base';

    const stateStyles = error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-[#D6A75D] focus:ring-[#D6A75D]';

    const widthStyle = fullWidth ? 'w-full' : '';
    const iconPadding = icon ? 'pl-12' : '';

    return (
        <div className={`${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    className={`${baseStyles} ${stateStyles} ${widthStyle} ${iconPadding} ${className}`}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-2 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

export function Textarea({
    label,
    error,
    helperText,
    fullWidth = false,
    className = '',
    ...props
}: TextareaProps) {
    const baseStyles = 'px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 text-base resize-none';

    const stateStyles = error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-[#D6A75D] focus:ring-[#D6A75D]';

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
        <div className={`${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <textarea
                className={`${baseStyles} ${stateStyles} ${widthStyle} ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-2 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
}
