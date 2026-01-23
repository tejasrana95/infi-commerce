import { StoreSettings } from '../types';

export const mockSettings: StoreSettings = {
    storeName: 'Infi-Commerce Store',
    storeAddress: '123 Main Street, City, State 12345',
    storePhone: '+1 (555) 123-4567',
    storeEmail: 'store@infi-commerce.com',
    taxRate: 10,
    currency: 'USD',
    receiptHeader: 'Thank you for shopping with us!',
    receiptFooter: 'Please visit us again. Returns accepted within 30 days.',
    printAutomatically: true,
    soundEnabled: true
};

export const keyboardShortcuts = [
    {
        category: 'General',
        shortcuts: [
            { keys: 'Ctrl + K', description: 'Focus search bar' },
            { keys: 'Ctrl + N', description: 'Select customer' },
            { keys: 'F11', description: 'Toggle fullscreen' },
            { keys: 'Escape', description: 'Close modal/dialog' }
        ]
    },
    {
        category: 'Cart & Checkout',
        shortcuts: [
            { keys: 'Ctrl + Enter', description: 'Quick checkout' },
            { keys: 'Ctrl + B', description: 'Open checkout' },
            { keys: 'Ctrl + D', description: 'Clear cart' }
        ]
    },
    {
        category: 'Receipt',
        shortcuts: [
            { keys: 'Ctrl + P', description: 'Print receipt' }
        ]
    },
    {
        category: 'Navigation',
        shortcuts: [
            { keys: 'Alt + 1', description: 'Go to POS' },
            { keys: 'Alt + 2', description: 'Go to Orders' },
            { keys: 'Alt + 3', description: 'Go to Settings' }
        ]
    }
];
