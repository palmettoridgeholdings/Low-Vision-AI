import { Redirect } from "expo-router";

import { LoadingState } from "@/components";
import { usePersistedAppState } from "@/hooks/usePersistedAppState";
import { HomeScreen } from "@/screens/HomeScreen";
import { getOnboardingHref, shouldRedirectToOnboarding } from "@/state/routingDecisions";

export default function IndexRoute() {
  const appState = usePersistedAppState();

  if (!appState.hydrated) {
    return <LoadingState label="Loading Access AI" />;
  }

  if (shouldRedirectToOnboarding(appState)) {
    return <Redirect href={getOnboardingHref(appState.onboarding.currentStep)} />;
  }

  return <HomeScreen />;
}
