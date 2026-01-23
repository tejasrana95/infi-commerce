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
        // Ignore if typing in an input (except specific keys like Escape or Enter if needed)
        const target = event.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

        // Allow Escape to dismiss stuff even in inputs
        if (isInput && event.key !== 'Escape' && event.key !== 'Enter') return;

        shortcuts.forEach(({ key, ctrlKey, metaKey, shiftKey, action, preventDefault = true }) => {
            const matchKey = event.key.toLowerCase() === key.toLowerCase();
            const matchCtrl = !!ctrlKey === (event.ctrlKey || event.metaKey); // Treat Cmd as Ctrl for Mac convenience
            const matchShift = !!shiftKey === event.shiftKey;

            if (matchKey && matchCtrl && matchShift) {
                if (preventDefault) event.preventDefault();
                console.log(`Shortcut triggered: ${key}`);
                action();
            }
        });
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
