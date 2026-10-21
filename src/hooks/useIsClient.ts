import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/**
 * false during SSR and hydration, true once rendering on the client. A
 * hydration-safe replacement for the `useState(false)` + `useEffect(() =>
 * setMounted(true))` pattern.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
