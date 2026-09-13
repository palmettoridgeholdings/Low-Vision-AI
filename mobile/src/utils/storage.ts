import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Typed JSON read/write over AsyncStorage. Every persistence call in the app
 * goes through these two functions so error handling (a corrupt value, a
 * storage backend failure) is handled once, not once per call site.
 */

export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt or unreadable value: treat as absent rather than crashing
    // onboarding/settings on launch.
    return null;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
