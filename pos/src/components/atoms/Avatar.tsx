import React from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps {
    name?: string;
    src?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
};

export default function Avatar({ name, src, size = 'md', className }: AvatarProps) {
    const initial = name?.charAt(0).toUpperCase() || '?';

    if (src) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                className={cn(
                    'rounded-full object-cover',
                    sizeStyles[size],
                    className
                )}
            />
        );
    }

    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center font-bold bg-blue-100 text-blue-700',
                sizeStyles[size],
                className
            )}
        >
            {name ? initial : <User className="w-1/2 h-1/2" />}
        </div>
    );
}
