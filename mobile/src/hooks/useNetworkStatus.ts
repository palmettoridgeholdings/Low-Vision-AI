import { useEffect, useState } from "react";

import { getIsConnected, subscribeToConnectivity } from "@/services/network/connectivity";

/** True while the device appears to have network connectivity. Starts optimistic (true) until the first report arrives. */
export function useNetworkStatus(): boolean {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getIsConnected().then((connected) => {
      if (isMounted) {
        setIsConnected(connected);
      }
    });
    const unsubscribe = subscribeToConnectivity((connected) => {
      if (isMounted) {
        setIsConnected(connected);
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return isConnected;
}
