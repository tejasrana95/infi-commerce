import { ThemeConfig } from '@/types';

export interface ThemePreset {
    id: string;
    name: string;
    description: string;
    thumbnail: string; // URL or placeholder color
    config: ThemeConfig;
}

export const PRESET_TEMPLATES: ThemePreset[] = [
    {
        id: 'modern-clean',
        name: 'Modern Clean',
        description: 'A clean, minimalist design with plenty of whitespace and bold typography.',
        thumbnail: '#2563eb', // Blue primary
        config: {
            templateId: 'modern-clean',
            colors: {
                primary: '#2563eb',
                secondary: '#64748b',
                accent: '#f59e0b',
                background: '#ffffff',
                text: '#0f172a',
            },
            fonts: {
                heading: 'Inter',
                body: 'Inter',
            },
            header: {
                topBar: {
                    enabled: true,
                    backgroundColor: '#0f172a',
                    textColor: '#ffffff',
                    height: 40,
                    items: [],
                },
                main: {
                    layout: 'default',
                    backgroundColor: '#ffffff',
                    height: 80,
                    sticky: true,
                    transparent: false,
                    rows: [
                        {
                            id: 'row-1',
                            order: 0,
                            sections: [
                                { id: 'left', position: 'left', items: [{ id: 'logo', type: 'logo', order: 0 }] },
                                { id: 'center', position: 'center', items: [{ id: 'menu', type: 'menu', order: 0 }] },
                                { id: 'right', position: 'right', items: [{ id: 'search', type: 'search', order: 0 }, { id: 'cart', type: 'cart', order: 1 }] },
                            ],
                        },
                    ],
                },
            },
            footer: {
                sections: [
                    {
                        id: 'columns',
                        type: 'columns',
                        backgroundColor: '#1e293b',
                        textColor: '#ffffff',
                        rows: [], // Users can populate this
                    },
                    {
                        id: 'bottom-bar',
                        type: 'bottom-bar',
                        backgroundColor: '#0f172a',
                        textColor: '#94a3b8',
                        bottomBarContent: '© 2024 Your Store. All rights reserved.',
                    },
                ],
            },
        },
    },
    {
        id: 'classic-elegance',
        name: 'Classic Elegance',
        description: 'Traditional layout with serif fonts and a warm color palette.',
        thumbnail: '#334155',
        config: {
            templateId: 'classic-elegance',
            colors: {
                primary: '#334155',
                secondary: '#94a3b8',
                accent: '#d97706',
                background: '#f8fafc',
                text: '#1e293b',
            },
            fonts: {
                heading: 'Playfair Display',
                body: 'Lato',
            },
            header: {
                topBar: {
                    enabled: false,
                    backgroundColor: '#334155',
                    textColor: '#ffffff',
                    height: 40,
                    items: [],
                },
                main: {
                    layout: 'centered',
                    backgroundColor: '#ffffff',
                    height: 100,
                    sticky: false,
                    transparent: false,
                    rows: [
                        {
                            id: 'row-1',
                            order: 0,
                            sections: [
                                { id: 'left', position: 'left', items: [{ id: 'search', type: 'search', order: 0 }] },
                                { id: 'center', position: 'center', items: [{ id: 'logo', type: 'logo', order: 0 }] },
                                { id: 'right', position: 'right', items: [{ id: 'cart', type: 'cart', order: 0 }, { id: 'account', type: 'account', order: 1 }] },
                            ],
                        },
                    ],
                },
            },
            footer: {
                sections: [
                    {
                        id: 'columns',
                        type: 'columns',
                        backgroundColor: '#334155',
                        textColor: '#ffffff',
                        rows: [],
                    },
                    {
                        id: 'bottom-bar',
                        type: 'bottom-bar',
                        backgroundColor: '#1e293b',
                        textColor: '#cbd5e1',
                        bottomBarContent: '© 2024 Classic Store. Designed with care.',
                    },
                ],
            },
        },
    },
    {
        id: 'bold-vibrant',
        name: 'Bold Vibrant',
        description: 'High contrast and vibrant colors for high-energy brands.',
        thumbnail: '#7c3aed', // Violet
        config: {
            templateId: 'bold-vibrant',
            colors: {
                primary: '#7c3aed',
                secondary: '#a78bfa',
                accent: '#f43f5e',
                background: '#ffffff',
                text: '#111827',
            },
            fonts: {
                heading: 'Montserrat',
                body: 'Open Sans',
            },
            header: {
                topBar: {
                    enabled: true,
                    backgroundColor: '#7c3aed',
                    textColor: '#ffffff',
                    height: 48,
                    items: [],
                },
                main: {
                    layout: 'default',
                    backgroundColor: '#ffffff',
                    height: 90,
                    sticky: true,
                    transparent: false,
                    rows: [
                        {
                            id: 'row-1',
                            order: 0,
                            sections: [
                                { id: 'left', position: 'left', items: [{ id: 'logo', type: 'logo', order: 0 }] },
                                { id: 'center', position: 'center', items: [] },
                                { id: 'right', position: 'right', items: [{ id: 'menu', type: 'menu', order: 0 }, { id: 'cart', type: 'cart', order: 1 }] },
                            ],
                        },
                    ],
                },
            },
            footer: {
                sections: [
                    {
                        id: 'columns',
                        type: 'columns',
                        backgroundColor: '#111827',
                        textColor: '#ffffff',
                        rows: [],
                    },
                    {
                        id: 'bottom-bar',
                        type: 'bottom-bar',
                        backgroundColor: '#000000',
                        textColor: '#ffffff',
                        bottomBarContent: '© 2024 Bold Brand.',
                    },
                ],
            },
        },
    },
];
