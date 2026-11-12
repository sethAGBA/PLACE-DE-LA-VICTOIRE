import { useState, useEffect } from 'react';
import type { Unsubscribe } from 'firebase/firestore';

/**
 * Generic hook that subscribes to a real-time Firestore listener.
 * Cleans up the listener on unmount.
 *
 * @param subscribe - Function that accepts a callback and returns an Unsubscribe function.
 * @returns { data, loading }
 */
export function useRealtime<T>(
  subscribe: (cb: (data: T) => void) => Unsubscribe
): { data: T | undefined; loading: boolean } {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribe((incoming) => {
      setData(incoming);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [subscribe]);

  return { data, loading };
}
