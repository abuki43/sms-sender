import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";
import { Badge } from "../Badge";

interface ProgressMetricsCardProps {
  doneCount: number;
  total: number;
  pct: number;
  sent: number;
  delivered: number;
  failed: number;
  isRunning: boolean;
  isPaused: boolean;
}

export function ProgressMetricsCard({
  doneCount,
  total,
  pct,
  sent,
  delivered,
  failed,
  isRunning,
  isPaused,
}: ProgressMetricsCardProps) {
  return (
    <View style={styles.dashboardCard}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.progressTitle}>Overall Progress</Text>
          <Text style={styles.progressCountText}>
            {doneCount} of {total} processed
          </Text>
        </View>
        <Badge
          variant={
            isPaused
              ? "warning"
              : isRunning
              ? "primary"
              : failed > 0
              ? "warning"
              : "success"
          }
          size="md"
        >
          {isPaused
            ? "Paused"
            : isRunning
            ? `${pct}% Complete`
            : failed > 0
            ? "Completed with errors"
            : "100% Completed"}
        </Badge>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${pct}%` },
            !isRunning &&
              failed > 0 && { backgroundColor: theme.colors.warning },
            !isRunning &&
              failed === 0 && { backgroundColor: theme.colors.success },
          ]}
        />
      </View>

      {/* 3 Metric Cards */}
      <View style={styles.metricsRow}>
        <View
          style={[
            styles.metricCard,
            { backgroundColor: theme.colors.successBg },
          ]}
        >
          <Text
            style={[
              styles.metricNumber,
              { color: theme.colors.successText },
            ]}
          >
            {sent + delivered}
          </Text>
          <Text style={styles.metricLabel}>Sent</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            { backgroundColor: theme.colors.primaryLight },
          ]}
        >
          <Text
            style={[styles.metricNumber, { color: theme.colors.primary }]}
          >
            {total}
          </Text>
          <Text style={styles.metricLabel}>Total</Text>
        </View>

        <View
          style={[
            styles.metricCard,
            { backgroundColor: theme.colors.errorBg },
          ]}
        >
          <Text
            style={[styles.metricNumber, { color: theme.colors.errorText }]}
          >
            {failed}
          </Text>
          <Text style={styles.metricLabel}>Failed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  progressCountText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: theme.colors.cardSubtle,
    borderRadius: theme.radius.full,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
