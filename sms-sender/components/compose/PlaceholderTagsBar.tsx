import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";

interface PlaceholderTagsBarProps {
  availableTags: string[];
  onInsertTag: (tag: string) => void;
}

export function PlaceholderTagsBar({
  availableTags,
  onInsertTag,
}: PlaceholderTagsBarProps) {
  if (availableTags.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.tagsLabel}>INSERT TAG:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsScroll}
      >
        {availableTags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={styles.tagPill}
            activeOpacity={0.7}
            onPress={() => onInsertTag(tag)}
          >
            <Text style={styles.tagPillText}>+ {'{' + tag + '}'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  tagsLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  tagsScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 10,
  },
  tagPill: {
    backgroundColor: theme.colors.primaryUltraLight,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.primary,
  },
});
