import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useBulkSend } from "../hooks/useBulkSend";
import { describeError } from "../lib/error-handler";
import { initDatabase, saveSendHistory } from "../lib/storage";
import { RecipientStatus, SendStatus } from "../lib/bulk-send";
import { theme } from "../lib/theme";
import { AppHeader } from "../components/AppHeader";
import { Badge, BadgeVariant } from "../components/Badge";
import { IconClose } from "../components/Icons";

const STATUS_VARIANTS: Record<SendStatus, { label: string; variant: BadgeVariant }> = {
  queued: { label: "Queued", variant: "default" },
  sending: { label: "Sending...", variant: "warning" },
  sent: { label: "Sent", variant: "success" },
  delivered: { label: "Delivered", variant: "success" },
  failed: { label: "Failed", variant: "error" },
};

export default function ProgressScreen() {
  const router = useRouter();
  const { progress, pause, resume, cancel, retryFailed } = useBulkSend();
  const {
    sent,
    delivered,
    failed,
    total,
    perRecipient,
    isRunning,
    isPaused,
    message,
  } = progress;

  const doneCount = sent + delivered + failed;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const wasRunning = useRef(isRunning);
  const savedRef = useRef(false);

  useEffect(() => {
    initDatabase();
  }, []);

  // When a run finishes (was running -> now stopped) persist to history once.
  useEffect(() => {
    if (
      wasRunning.current &&
      !isRunning &&
      total > 0 &&
      perRecipient.length > 0
    ) {
      if (!savedRef.current) {
        savedRef.current = true;
        void saveSendHistory({
          message,
          timestamp: Date.now(),
          recipients: perRecipient.map((r) => ({
            id: r.recipient.id,
            name: r.recipient.name,
            phone: r.recipient.phone,
            status: r.status,
            errorCode: r.errorCode,
          })),
        });
      }
    }
    if (isRunning) {
      savedRef.current = false;
    }
    wasRunning.current = isRunning;
  }, [isRunning, total, perRecipient, message]);

  return (
    <View style={styles.container}>
      <AppHeader
        title="Live Dispatch"
        subtitle={
          isRunning
            ? isPaused
              ? "Sending paused"
              : "Dispatching messages..."
            : "Batch completed"
        }
        rightElement={
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
          >
            <IconClose size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        }
      />

      {total === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No send in progress</Text>
          <Text style={styles.emptySubtitle}>
            Compose a message and press Send to monitor delivery progress here.
          </Text>
          <TouchableOpacity
            style={styles.returnBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.returnBtnText}>Back to Compose</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress & Status Card */}
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

            {/* Custom Sleek Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${pct}%` },
                  !isRunning && failed > 0 && { backgroundColor: theme.colors.warning },
                  !isRunning && failed === 0 && { backgroundColor: theme.colors.success },
                ]}
              />
            </View>

            {/* 3 Metric Cards */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, { backgroundColor: theme.colors.successBg }]}>
                <Text style={[styles.metricNumber, { color: theme.colors.successText }]}>
                  {sent + delivered}
                </Text>
                <Text style={styles.metricLabel}>Sent</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.metricNumber, { color: theme.colors.primary }]}>
                  {total}
                </Text>
                <Text style={styles.metricLabel}>Total</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: theme.colors.errorBg }]}>
                <Text style={[styles.metricNumber, { color: theme.colors.errorText }]}>
                  {failed}
                </Text>
                <Text style={styles.metricLabel}>Failed</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.controlsRow}>
              {isRunning && !isPaused ? (
                <TouchableOpacity
                  style={[styles.controlBtn, styles.controlBtnWarning]}
                  onPress={pause}
                  activeOpacity={0.7}
                >
                  <Text style={styles.controlBtnWarningText}>Pause</Text>
                </TouchableOpacity>
              ) : null}

              {isRunning && isPaused ? (
                <TouchableOpacity
                  style={[styles.controlBtn, styles.controlBtnPrimary]}
                  onPress={resume}
                  activeOpacity={0.7}
                >
                  <Text style={styles.controlBtnPrimaryText}>Resume</Text>
                </TouchableOpacity>
              ) : null}

              {isRunning ? (
                <TouchableOpacity
                  style={[styles.controlBtn, styles.controlBtnDanger]}
                  onPress={cancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.controlBtnDangerText}>Cancel</Text>
                </TouchableOpacity>
              ) : null}

              {!isRunning && failed > 0 ? (
                <TouchableOpacity
                  style={[styles.controlBtn, styles.controlBtnPrimary, { flex: 2 }]}
                  onPress={retryFailed}
                  activeOpacity={0.7}
                >
                  <Text style={styles.controlBtnPrimaryText}>
                    Retry {failed} Failed
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Recipient Status Feed Card */}
          <View style={styles.feedCard}>
            <Text style={styles.feedCardTitle}>RECIPIENTS FEED</Text>

            {perRecipient.length === 0 && isRunning ? (
              <View style={styles.feedLoadingBox}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.feedLoadingText}>Preparing queue...</Text>
              </View>
            ) : (
              perRecipient.map((record, index) => {
                const meta = STATUS_VARIANTS[record.status];
                const isLast = index === perRecipient.length - 1;
                const initials = record.recipient.name
                  .split(" ")
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <View
                    key={record.recipient.id}
                    style={[
                      styles.recipientRow,
                      isLast && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.recipientAvatar}>
                      <Text style={styles.recipientAvatarText}>
                        {initials || "#"}
                      </Text>
                    </View>

                    <View style={styles.recipientInfo}>
                      <Text style={styles.recipientName} numberOfLines={1}>
                        {record.recipient.name}
                      </Text>
                      <Text style={styles.recipientPhone}>
                        {record.recipient.phone}
                      </Text>
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
              })
            )}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
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
    marginBottom: 16,
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
  controlsRow: {
    flexDirection: "row",
    gap: 10,
  },
  controlBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  controlBtnPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  controlBtnPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  controlBtnWarning: {
    backgroundColor: theme.colors.warningBg,
    borderColor: "#F7DEBE",
  },
  controlBtnWarningText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.warningText,
  },
  controlBtnDanger: {
    backgroundColor: theme.colors.errorBg,
    borderColor: "#FACDCD",
  },
  controlBtnDangerText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.errorText,
  },
  feedCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  feedCardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  feedLoadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
  },
  feedLoadingText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  returnBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  returnBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
