import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { View, Text } from "tamagui";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const color = focused ? "#007AFF" : "#8E8E93";
  return (
    <View items="center" justify="center" width={28} height={28}>
      <Text fontSize={20} color={color}>
        {name === "compose" ? "✏️" : name === "contacts" ? "👤" : "📋"}
      </Text>
    </View>
  );
}

export const unstable_settings = {
  initialRouteName: "compose",
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
      }}
    >
      <Tabs.Screen
        name="compose"
        options={{
          title: "Compose",
          headerTitle: "New Message",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="compose" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          headerTitle: "Select Contacts",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="contacts" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          headerTitle: "Send History",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="history" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
