type AnyFunction = (...args: unknown[]) => unknown;

/**
 * Memoize function with LRU cache
 */
export function memoize<T extends AnyFunction>(
  fn: T,
  maxSize = 100
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      const value = cache.get(key)!;
      // Move to end (most recently used)
      cache.delete(key);
      cache.set(key, value);
      return value;
    }

    const result = fn(...args) as ReturnType<T>;

    if (cache.size >= maxSize) {
      // Delete oldest entry
      const firstKey = cache.keys().next().value;
      if (typeof firstKey === 'string') {
        cache.delete(firstKey);
      }
    }

    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Memoize async functions
 */
export function memoizeAsync<T extends AnyFunction>(
  fn: T,
  maxSize = 50,
  ttl = 60000
): T {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && now - cached.timestamp < ttl) {
      return cached.value as Awaited<ReturnType<T>>;
    }

    const result = await fn(...args);

    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (typeof firstKey === 'string') {
        cache.delete(firstKey);
      }
    }

    cache.set(key, { value: result as ReturnType<T>, timestamp: now });
    return result as Awaited<ReturnType<T>>;
  }) as T;
}
