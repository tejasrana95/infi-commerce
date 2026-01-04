'use client';

import React, { useState } from 'react';
import { ModuleProps } from '../index';

interface AccordionItem {
    title: string;
    content: string;
}

interface AccordionConfig {
    title?: string;
    selectionMode?: 'single' | 'multiple';
    defaultState?: 'closed' | 'first' | 'all';
    items?: AccordionItem[];
}

export default function Accordion({ config, sectionType }: ModuleProps) {
    const {
        title,
        selectionMode = 'single',
        defaultState = 'closed', // 'closed' | 'first' | 'all'
        items = []
    } = config as AccordionConfig;

    // Initialize state based on defaultState
    const [openItems, setOpenItems] = useState<number[]>(() => {
        if (defaultState === 'all') {
            return items.map((_, idx) => idx);
        }
        if (defaultState === 'first' && items.length > 0) {
            return [0];
        }
        return [];
    });

    const toggleItem = (index: number) => {
        setOpenItems(prev => {
            const isOpen = prev.includes(index);

            if (selectionMode === 'single') {
                return isOpen ? [] : [index];
            } else {
                return isOpen
                    ? prev.filter(i => i !== index)
                    : [...prev, index];
            }
        });
    };

    if (!items || items.length === 0) {
        return null;
    }

    // Dynamic classes based on section type context if needed
    const containerClass = sectionType === 'full-width' ? 'container mx-auto px-4' : '';

    return (
        <div className={`py-6 ${containerClass}`}>
            {title && (
                <h2 className="text-2xl font-bold mb-6 text-gray-900">{title}</h2>
            )}

            <div className="space-y-4">
                {items.map((item, index) => {
                    const isOpen = openItems.includes(index);

                    return (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                        >
                            <button
                                className="w-full flex justify-between items-center p-4 text-left font-medium text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                                onClick={() => toggleItem(index)}
                                aria-expanded={isOpen}
                            >
                                <span>{item.title}</span>
                                <span className={`ml-6 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                                    <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </span>
                            </button>

                            <div
                                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                    }`}
                            >
                                <div className="overflow-hidden">
                                    <div className="p-4 pt-0 text-gray-600 bg-white border-t border-gray-100">
                                        <div className="prose max-w-none pt-4 whitespace-pre-wrap">
                                            {item.content}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
