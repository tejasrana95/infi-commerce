import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Deep comparison memo hook - prevents unnecessary re-renders
 */
export function useDeepMemo<T>(factory: () => T, deps: unknown[]): T {
  const ref = useRef<{ deps: unknown[]; value: T } | undefined>(undefined);

  if (!ref.current || !shallowEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
}

/**
 * Stable callback that doesn't change reference
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Debounced value hook
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function shallowEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, i) => Object.is(val, b[i]));
}

import { useState } from 'react';
