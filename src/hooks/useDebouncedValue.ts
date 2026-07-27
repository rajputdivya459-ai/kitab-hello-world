import { useEffect, useState } from 'react';

/** Returns a debounced copy of `value` that only updates after `delay` ms of quiet. */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
