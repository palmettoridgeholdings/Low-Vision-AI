/**
 * Backend configuration, read once from build-time env vars.
 *
 * `EXPO_PUBLIC_*` vars are inlined into the JS bundle by Metro — see
 * https://docs.expo.dev/guides/environment-variables/ — so nothing sensitive
 * may ever be placed in one. This app has none: no OpenAI key or other
 * credential is embedded anywhere in the client. Real AI credentials belong
 * only on the backend named by `backendBaseUrl`.
 *
 * Mock mode is the safe default: unless a base URL is configured AND mock
 * mode is explicitly turned off, every service resolves to its mock
 * implementation and no network call is made.
 */
export interface BackendConfig {
  baseUrl: string | null;
  mockMode: boolean;
}

function readBackendConfig(): BackendConfig {
  const rawBaseUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL?.trim();
  const baseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, "") : null;

  const rawMockFlag = process.env.EXPO_PUBLIC_MOCK_MODE?.trim().toLowerCase();
  // Mock mode stays on unless BOTH a base URL is set and the flag is the
  // literal string "false". Any other value (unset, "true", a typo) is safe.
  const mockMode = !(baseUrl !== null && rawMockFlag === "false");

  return { baseUrl, mockMode };
}

export const backendConfig: BackendConfig = readBackendConfig();
