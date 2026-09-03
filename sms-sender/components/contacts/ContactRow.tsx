import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";
import { IconCheck } from "../Icons";

export interface ContactItem {
  id: string;
  name: string;
  phoneNumbers: { number: string; isPrimary: boolean }[];
}

interface ContactRowProps {
  item: ContactItem;
  isSelected: boolean;
  onToggle: (item: ContactItem) => void;
  isLast: boolean;
}

export const ContactRow = memo(function ContactRow({
  item,
  isSelected,
  onToggle,
  isLast,
}: ContactRowProps) {
  const primaryNumber =
    item.phoneNumbers.find((p) => p.isPrimary)?.number ??
    item.phoneNumbers[0]?.number ??
    "";

  const initials = item.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TouchableOpacity
      style={[
        styles.contactRow,
        isSelected && styles.contactRowSelected,
        isLast && { borderBottomWidth: 0 },
      ]}
      activeOpacity={0.7}
      onPress={() => onToggle(item)}
    >
      {/* Initials Avatar */}
      <View
        style={[
          styles.avatarBubble,
          isSelected && { backgroundColor: theme.colors.primaryLight },
        ]}
      >
        <Text
          style={[
            styles.avatarInitials,
            isSelected && { color: theme.colors.primary },
          ]}
        >
          {initials || "#"}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.contactPhone} numberOfLines={1}>
          {primaryNumber}
        </Text>
      </View>

      {/* Circular Checkbox */}
      <View
        style={[
          styles.checkboxCircle,
          isSelected && styles.checkboxCircleSelected,
        ]}
      >
        {isSelected ? <IconCheck size={12} color="#FFFFFF" /> : null}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 14,
  },
  contactRowSelected: {
    backgroundColor: theme.colors.primaryUltraLight,
  },
  avatarBubble: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.primaryMuted,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCircleSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
});
