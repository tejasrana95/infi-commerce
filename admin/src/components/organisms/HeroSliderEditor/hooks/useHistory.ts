import { useState, useCallback } from 'react';

interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export function useHistory<T>(initialState: T, maxHistory: number = 50) {
    const [history, setHistory] = useState<HistoryState<T>>({
        past: [],
        present: initialState,
        future: []
    });

    const setState = useCallback((newState: T) => {
        setHistory(prev => ({
            past: [...prev.past, prev.present].slice(-maxHistory),
            present: newState,
            future: []
        }));
    }, [maxHistory]);

    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;

            const newPast = [...prev.past];
            const newPresent = newPast.pop()!;

            return {
                past: newPast,
                present: newPresent,
                future: [prev.present, ...prev.future]
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev;

            const newFuture = [...prev.future];
            const newPresent = newFuture.shift()!;

            return {
                past: [...prev.past, prev.present],
                present: newPresent,
                future: newFuture
            };
        });
    }, []);

    const reset = useCallback((newState: T) => {
        setHistory({
            past: [],
            present: newState,
            future: []
        });
    }, []);

    return {
        state: history.present,
        setState,
        undo,
        redo,
        reset,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0
    };
}
