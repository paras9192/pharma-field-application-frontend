import { useEffect, useState } from 'react';

/**
 * Returns a copy of `value` that only updates after it has stopped changing
 * for `delay` ms. Handy for search boxes so we don't fire a request on every
 * keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
