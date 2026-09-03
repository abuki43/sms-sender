import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";
import { IconContacts, IconChevronRight } from "../Icons";

export interface RecipientPreviewItem {
  id: string;
  name: string;
  phone: string;
}

interface RecipientsPreviewCardProps {
  recipients: RecipientPreviewItem[];
  onPress: () => void;
}

export function RecipientsPreviewCard({
  recipients,
  onPress,
}: RecipientsPreviewCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>RECIPIENTS</Text>
        <View style={styles.rowCentered}>
          <Text style={styles.cardActionText}>Edit</Text>
          <IconChevronRight size={14} color={theme.colors.primaryMuted} />
        </View>
      </View>

      <View style={styles.recipientContent}>
        {recipients.length === 0 ? (
          <View style={styles.emptyRecipientRow}>
            <View style={styles.avatarPlaceholder}>
              <IconContacts size={18} color={theme.colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyRecipientTitle}>
                No contacts selected
              </Text>
              <Text style={styles.emptyRecipientSubtitle}>
                Tap to choose recipients from address book
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.selectedRecipientsRow}>
            <View style={styles.avatarStack}>
              {recipients.slice(0, 3).map((r, i) => (
                <View
                  key={r.id}
                  style={[
                    styles.avatarCircle,
                    { marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {r.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.recipientCountText}>
                {recipients.length}{" "}
                {recipients.length === 1 ? "recipient" : "recipients"} selected
              </Text>
              <Text style={styles.recipientSubtext} numberOfLines={1}>
                {recipients.map((r) => r.name).join(", ")}
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
  },
  cardActionText: {
    fontSize: 13,
    color: theme.colors.primaryMuted,
    fontWeight: "600",
    marginRight: 2,
  },
  rowCentered: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipientContent: {
    marginTop: 2,
  },
  emptyRecipientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyRecipientTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  emptyRecipientSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  selectedRecipientsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 2,
    borderColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  recipientCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  recipientSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
