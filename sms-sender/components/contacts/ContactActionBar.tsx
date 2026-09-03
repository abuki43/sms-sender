import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";
import { Badge } from "../Badge";

interface ContactActionBarProps {
  selectedCount: number;
  showToggle: boolean;
  allSelected: boolean;
  onToggleAll: () => void;
}

export function ContactActionBar({
  selectedCount,
  showToggle,
  allSelected,
  onToggleAll,
}: ContactActionBarProps) {
  return (
    <View style={styles.actionBar}>
      <Badge variant="primary" size="md">
        {selectedCount}{" "}
        {selectedCount === 1 ? "contact selected" : "contacts selected"}
      </Badge>

      {showToggle && (
        <TouchableOpacity
          style={styles.selectToggleBtn}
          activeOpacity={0.7}
          onPress={onToggleAll}
        >
          <Text style={styles.selectToggleText}>
            {allSelected ? "Deselect All" : "Select All"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  selectToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
  },
});
