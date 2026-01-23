import React from 'react';
import { cn } from '@/lib/utils';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    variant?: 'ghost' | 'solid' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
    ghost: 'hover:bg-slate-100 text-slate-600',
    solid: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    outline: 'border border-slate-200 hover:bg-slate-50 text-slate-700'
};

const sizeStyles = {
    sm: 'w-7 h-7 p-1',
    md: 'w-9 h-9 p-2',
    lg: 'w-11 h-11 p-2.5'
};

export default function IconButton({
    icon,
    variant = 'ghost',
    size = 'md',
    className,
    ...props
}: IconButtonProps) {
    return (
        <button
            className={cn(
                'rounded-lg flex items-center justify-center transition-all active:scale-95',
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            {...props}
        >
            {icon}
        </button>
    );
}
