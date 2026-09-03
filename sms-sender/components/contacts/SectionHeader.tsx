import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeaderContainer}>
      <View style={styles.sectionHeaderBadge}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderContainer: {
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sectionHeaderBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.cardSubtle,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primaryMuted,
  },
});
