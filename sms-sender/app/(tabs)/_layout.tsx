import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";
import { IconCompose, IconContacts, IconHistory } from "../../components/Icons";

function TabIcon({
  type,
  focused,
  label,
}: {
  type: "compose" | "contacts" | "history";
  focused: boolean;
  label: string;
}) {
  const iconColor = focused ? theme.colors.primary : theme.colors.textMuted;
  const textColor = focused ? theme.colors.primary : theme.colors.textMuted;

  return (
    <View style={styles.tabItem}>
      <View
        style={[
          styles.iconBadge,
          focused && { backgroundColor: theme.colors.primaryLight },
        ]}
      >
        {type === "compose" && <IconCompose size={20} color={iconColor} />}
        {type === "contacts" && <IconContacts size={20} color={iconColor} />}
        {type === "history" && <IconHistory size={20} color={iconColor} />}
      </View>
      <Text
        style={[
          styles.tabLabel,
          {
            color: textColor,
            fontWeight: focused ? "700" : "500",
          },
        ]}
      >
        {label}
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
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 68,
          paddingTop: 6,
          paddingBottom: 8,
          ...theme.shadow.md,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          title: "Compose",
          tabBarIcon: ({ focused }) => (
            <TabIcon type="compose" focused={focused} label="Compose" />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          tabBarIcon: ({ focused }) => (
            <TabIcon type="contacts" focused={focused} label="Contacts" />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ focused }) => (
            <TabIcon type="history" focused={focused} label="History" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
    minWidth: 64,
  },
  iconBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
