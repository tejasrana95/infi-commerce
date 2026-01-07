import { useEffect } from 'react';

export interface KeyboardShortcuts {
    onCopy?: () => void;
    onPaste?: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onSave?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onMoveLeft?: () => void;
    onMoveRight?: () => void;
    onMoveUpLarge?: () => void;
    onMoveDownLarge?: () => void;
    onMoveLeftLarge?: () => void;
    onMoveRightLarge?: () => void;
    onToggleGrid?: () => void;
    onDeselect?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts, enabled: boolean = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

            // Prevent default for shortcuts we handle
            const shouldPreventDefault = () => {
                if (cmdOrCtrl && e.key === 's') return true; // Save
                if (cmdOrCtrl && e.key === 'z') return true; // Undo/Redo
                if (cmdOrCtrl && e.key === 'c') return true; // Copy
                if (cmdOrCtrl && e.key === 'v') return true; // Paste
                if (cmdOrCtrl && e.key === 'd') return true; // Duplicate
                return false;
            };

            // Only handle shortcuts if not typing in input/textarea
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // Ctrl/Cmd + C: Copy
            if (cmdOrCtrl && e.key === 'c' && !isTyping && shortcuts.onCopy) {
                e.preventDefault();
                shortcuts.onCopy();
                return;
            }

            // Ctrl/Cmd + V: Paste
            if (cmdOrCtrl && e.key === 'v' && !isTyping && shortcuts.onPaste) {
                e.preventDefault();
                shortcuts.onPaste();
                return;
            }

            // Ctrl/Cmd + D: Duplicate
            if (cmdOrCtrl && e.key === 'd' && !isTyping && shortcuts.onDuplicate) {
                e.preventDefault();
                shortcuts.onDuplicate();
                return;
            }

            // Delete/Backspace: Delete
            if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping && shortcuts.onDelete) {
                e.preventDefault();
                shortcuts.onDelete();
                return;
            }

            // Ctrl/Cmd + Z: Undo, Ctrl/Cmd + Shift + Z: Redo
            if (cmdOrCtrl && e.key === 'z' && !isTyping) {
                e.preventDefault();
                if (e.shiftKey && shortcuts.onRedo) {
                    shortcuts.onRedo();
                } else if (shortcuts.onUndo) {
                    shortcuts.onUndo();
                }
                return;
            }

            // Ctrl/Cmd + S: Save
            if (cmdOrCtrl && e.key === 's' && shortcuts.onSave) {
                e.preventDefault();
                shortcuts.onSave();
                return;
            }

            // Arrow keys: Move layer (only if not typing)
            if (!isTyping) {
                const largeMove = e.shiftKey;

                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (largeMove && shortcuts.onMoveUpLarge) {
                        shortcuts.onMoveUpLarge();
                    } else if (shortcuts.onMoveUp) {
                        shortcuts.onMoveUp();
                    }
                    return;
                }

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (largeMove && shortcuts.onMoveDownLarge) {
                        shortcuts.onMoveDownLarge();
                    } else if (shortcuts.onMoveDown) {
                        shortcuts.onMoveDown();
                    }
                    return;
                }

                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (largeMove && shortcuts.onMoveLeftLarge) {
                        shortcuts.onMoveLeftLarge();
                    } else if (shortcuts.onMoveLeft) {
                        shortcuts.onMoveLeft();
                    }
                    return;
                }

                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (largeMove && shortcuts.onMoveRightLarge) {
                        shortcuts.onMoveRightLarge();
                    } else if (shortcuts.onMoveRight) {
                        shortcuts.onMoveRight();
                    }
                    return;
                }

                // G: Toggle grid
                if (e.key === 'g' && shortcuts.onToggleGrid) {
                    e.preventDefault();
                    shortcuts.onToggleGrid();
                    return;
                }

                // Escape: Deselect
                if (e.key === 'Escape' && shortcuts.onDeselect) {
                    e.preventDefault();
                    shortcuts.onDeselect();
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, enabled]);
}
