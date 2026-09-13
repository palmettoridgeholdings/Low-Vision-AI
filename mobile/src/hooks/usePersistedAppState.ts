import { appStateStore, type AppStateSlice } from "@/state/appStateStore";
import { useStore } from "@/hooks/useStore";

/** Reactive access to onboarding progress + settings. Call the action functions in appStateStore.ts to change anything — this hook is read-only by design. */
export function usePersistedAppState(): AppStateSlice {
  return useStore(appStateStore);
}
