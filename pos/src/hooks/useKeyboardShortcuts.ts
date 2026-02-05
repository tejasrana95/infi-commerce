'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutHandler {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean; // For Mac (Command key)
    shiftKey?: boolean;
    action: () => void;
    description?: string;
    preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

        shortcuts.forEach(({ key, ctrlKey, metaKey, shiftKey, action, preventDefault = true }) => {
            const matchKey = event.key.toLowerCase() === key.toLowerCase();
           
            // Check modifiers: only check if explicitly required in the shortcut definition
            const matchCtrl = ctrlKey ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
            const matchMeta = metaKey ? event.metaKey : true; // Optional: specific meta key check
            const matchShift = shiftKey ? event.shiftKey : !event.shiftKey;

            // Check if this shortcut matches
            const isMatch = matchKey && matchCtrl && matchShift;
            if (isMatch) {
               
                // Allow Escape and Ctrl+Enter shortcuts even in inputs
                const allowInInput = event.key === 'Escape' || (event.key === 'Enter' && (event.ctrlKey || event.metaKey));
                
                // Skip if in input and this shortcut isn't allowed in inputs
                if (isInput && !allowInInput) return;
                
                if (preventDefault) event.preventDefault();
                action();
            }
        });
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
