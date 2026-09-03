import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { TamaguiProvider } from "tamagui";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import config from "../tamagui.config";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme ?? "light"}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="progress"
          options={{
            presentation: "modal",
            title: "Sending Messages",
          }}
        />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </TamaguiProvider>
  );
}
