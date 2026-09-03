import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SendHistoryEntry } from "../../lib/storage";
import { theme } from "../../lib/theme";
import { Badge } from "../Badge";

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface HistoryCardProps {
  entry: SendHistoryEntry;
}

export const HistoryCard = memo(function HistoryCard({ entry }: HistoryCardProps) {
  const sentCount = entry.recipients.filter(
    (r) => r.status === "sent" || r.status === "delivered"
  ).length;
  const failedCount = entry.recipients.filter(
    (r) => r.status === "failed"
  ).length;
  const totalCount = entry.recipients.length;
  const allDelivered = failedCount === 0;

  return (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Badge variant="sand" size="sm">
          {formatTimestamp(entry.timestamp)}
        </Badge>
        <Badge variant={allDelivered ? "success" : "warning"} size="sm">
          {allDelivered ? "100% Sent" : `${sentCount}/${totalCount} Sent`}
        </Badge>
      </View>

      <Text style={styles.messageText} numberOfLines={3}>
        {entry.message}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.recipientCountText}>
          To {totalCount} {totalCount === 1 ? "recipient" : "recipients"}
        </Text>
        {failedCount > 0 ? (
          <Text style={styles.failedText}>{failedCount} failed</Text>
        ) : (
          <Text style={styles.allSuccessText}>All delivered</Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  historyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  messageText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardSubtle,
  },
  recipientCountText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  failedText: {
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: "600",
  },
  allSuccessText: {
    fontSize: 12,
    color: theme.colors.successText,
    fontWeight: "600",
  },
});
