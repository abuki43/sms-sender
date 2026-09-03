import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { RecipientStatus, SendStatus } from "../../lib/bulk-send";
import { describeError } from "../../lib/error-handler";
import { theme } from "../../lib/theme";
import { Badge, BadgeVariant } from "../Badge";

const STATUS_VARIANTS: Record<
  SendStatus,
  { label: string; variant: BadgeVariant }
> = {
  queued: { label: "Queued", variant: "default" },
  sending: { label: "Sending...", variant: "warning" },
  sent: { label: "Sent", variant: "success" },
  delivered: { label: "Delivered", variant: "success" },
  failed: { label: "Failed", variant: "error" },
};

interface RecipientStatusRowProps {
  record: RecipientStatus;
  isLast: boolean;
}

export const RecipientStatusRow = memo(
  function RecipientStatusRow({
    record,
    isLast,
  }: RecipientStatusRowProps) {
    const meta = STATUS_VARIANTS[record.status] || STATUS_VARIANTS.queued;
    const initials = record.recipient.name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <View style={[styles.recipientRow, isLast && { borderBottomWidth: 0 }]}>
        <View style={styles.recipientAvatar}>
          <Text style={styles.recipientAvatarText}>{initials || "#"}</Text>
        </View>

        <View style={styles.recipientInfo}>
          <Text style={styles.recipientName} numberOfLines={1}>
            {record.recipient.name}
          </Text>
          <Text style={styles.recipientPhone}>{record.recipient.phone}</Text>
        </View>

        <View style={styles.statusCol}>
          <Badge variant={meta.variant} size="sm">
            {meta.label}
          </Badge>
          {record.status === "failed" && record.errorCode ? (
            <Text style={styles.errorSubtext} numberOfLines={1}>
              {describeError(record.errorCode)}
            </Text>
          ) : null}
        </View>
      </View>
    );
  },
  (prev, next) =>
    prev.record.status === next.record.status &&
    prev.record.errorCode === next.record.errorCode &&
    prev.record.recipient.id === next.record.recipient.id &&
    prev.isLast === next.isLast
);

const styles = StyleSheet.create({
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardSubtle,
    gap: 12,
  },
  recipientAvatar: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recipientAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primaryMuted,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  recipientPhone: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  statusCol: {
    alignItems: "flex-end",
    gap: 2,
  },
  errorSubtext: {
    fontSize: 10,
    color: theme.colors.error,
    fontWeight: "500",
    maxWidth: 120,
  },
});
