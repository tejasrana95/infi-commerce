import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-cyan-100 text-cyan-700',
    neutral: 'bg-slate-100 text-slate-700'
};

export default function Badge({ variant = 'neutral', children, className }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold',
                variantStyles[variant],
                className
            )}
        >
            {children}
        </span>
    );
}
