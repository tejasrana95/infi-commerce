'use client';

import React from 'react';

interface IconSkeletonProps {
    size: number;
    className?: string;
}

export default function IconSkeleton({ size, className }: IconSkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-current opacity-10 rounded-md inline-block ${className || ''}`}
            style={{ width: size, height: size }}
        />
    );
}
