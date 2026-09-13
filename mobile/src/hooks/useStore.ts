import { useSyncExternalStore } from "react";

import type { Store } from "@/utils/createStore";

/** Subscribes a component to a Store<T> created by createStore. */
export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}
