import { useEffect } from "react";
import { TamaguiProvider } from "tamagui";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import config from "../tamagui.config";
import { theme } from "../lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.bg },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="progress"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="dark" backgroundColor={theme.colors.bg} />
    </TamaguiProvider>
  );
}
