import React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:translate-y-0.5',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    ghost: 'hover:bg-slate-100 text-slate-700',
    outline: 'border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
};

export default function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className,
    disabled,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                'font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? 'Loading...' : children}
        </button>
    );
}
