import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { theme } from "../lib/theme";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "sand" | "info";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: {
    bg: theme.colors.cardSubtle,
    text: theme.colors.textSecondary,
    border: theme.colors.border,
  },
  primary: {
    bg: theme.colors.primaryLight,
    text: theme.colors.primary,
    border: "#E2D2C2",
  },
  sand: {
    bg: "#F5EBE1",
    text: theme.colors.primaryMuted,
    border: "#EBDAC8",
  },
  success: {
    bg: theme.colors.successBg,
    text: theme.colors.successText,
    border: "#CFE7D6",
  },
  warning: {
    bg: theme.colors.warningBg,
    text: theme.colors.warningText,
    border: "#F7DEBE",
  },
  error: {
    bg: theme.colors.errorBg,
    text: theme.colors.errorText,
    border: "#FACDCD",
  },
  info: {
    bg: theme.colors.infoBg,
    text: theme.colors.info,
    border: "#CCE3F0",
  },
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  style,
  textStyle,
}: BadgeProps) {
  const meta = VARIANT_STYLES[variant];
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: meta.bg,
          borderColor: meta.border,
          paddingHorizontal: isSmall ? 8 : 10,
          paddingVertical: isSmall ? 2 : 4,
          borderRadius: theme.radius.full,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: meta.text,
            fontSize: isSmall ? 11 : 12,
            fontWeight: "600",
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    alignSelf: "flex-start",
  },
  text: {
    letterSpacing: 0.2,
  },
});
