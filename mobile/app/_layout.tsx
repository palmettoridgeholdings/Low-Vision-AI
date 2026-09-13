import { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { hydrateAppState } from "@/state/appStateStore";
import { colors } from "@/theme/colors";

export default function RootLayout() {
  useEffect(() => {
    void hydrateAppState();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="ask" options={{ title: "Type a question" }} />
        <Stack.Screen name="camera" options={{ title: "Camera assistance" }} />
        <Stack.Screen name="voice" options={{ title: "Ask by voice" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="help" options={{ title: "Help" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
