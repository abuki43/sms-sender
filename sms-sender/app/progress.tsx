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
import { initDatabase, saveSendHistory } from "../lib/storage";
import { theme } from "../lib/theme";
import { AppHeader } from "../components/AppHeader";
import { IconClose } from "../components/Icons";
import { ProgressMetricsCard } from "../components/progress/ProgressMetricsCard";
import { ProgressControls } from "../components/progress/ProgressControls";
import { RecipientStatusRow } from "../components/progress/RecipientStatusRow";

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
          <ProgressMetricsCard
            doneCount={doneCount}
            total={total}
            pct={pct}
            sent={sent}
            delivered={delivered}
            failed={failed}
            isRunning={isRunning}
            isPaused={isPaused}
          />

          <ProgressControls
            isRunning={isRunning}
            isPaused={isPaused}
            failed={failed}
            onPause={pause}
            onResume={resume}
            onCancel={cancel}
            onRetryFailed={retryFailed}
          />

          {/* Recipient Status Feed Card */}
          <View style={styles.feedCard}>
            <Text style={styles.feedCardTitle}>RECIPIENTS FEED</Text>

            {perRecipient.length === 0 && isRunning ? (
              <View style={styles.feedLoadingBox}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.feedLoadingText}>Preparing queue...</Text>
              </View>
            ) : (
              perRecipient.map((record, index) => (
                <RecipientStatusRow
                  key={record.recipient.id}
                  record={record}
                  isLast={index === perRecipient.length - 1}
                />
              ))
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
