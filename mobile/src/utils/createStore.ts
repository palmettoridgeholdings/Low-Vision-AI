/**
 * Minimal observable-state container — the only "state management" this app
 * uses. Deliberately not a dependency: React 19's built-in
 * `useSyncExternalStore` (see src/hooks/useStore.ts) is enough to subscribe
 * a component to one of these, and plain `getState`/`setState` calls are
 * enough to unit test state logic (onboarding progression, settings
 * changes) with no React involved at all.
 */
export interface Store<T> {
  getState: () => T;
  setState: (updater: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (updater) => {
      const next = typeof updater === "function" ? (updater as (prev: T) => T)(state) : updater;
      if (next === state) {
        return;
      }
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
