import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

/**
 * Thin wrapper around NetInfo so the rest of the app depends on a small,
 * intention-revealing surface instead of the raw NetInfo state shape.
 */
export function isConnectedFromState(state: NetInfoState): boolean {
  // `isConnected === null` means NetInfo hasn't reported yet; treat unknown
  // as connected so we don't show an offline banner before the first report.
  return state.isConnected !== false;
}

export async function getIsConnected(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return isConnectedFromState(state);
}

export function subscribeToConnectivity(onChange: (isConnected: boolean) => void): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    onChange(isConnectedFromState(state));
  });
  return unsubscribe;
}
