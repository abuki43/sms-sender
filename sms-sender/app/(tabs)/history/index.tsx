import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { useFocusEffect } from "expo-router";
import {
  SendHistoryEntry,
  clearSendHistory,
  getSendHistory,
  initDatabase,
} from "../../../lib/storage";
import { theme } from "../../../lib/theme";
import { AppHeader } from "../../../components/AppHeader";
import { Badge } from "../../../components/Badge";
import { IconHistory, IconTrash, IconWarning } from "../../../components/Icons";

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryScreen() {
  const [entries, setEntries] = useState<SendHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const load = useCallback(async () => {
    try {
      await initDatabase();
      const rows = await getSendHistory();
      setEntries(rows);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const handleClear = async () => {
    await clearSendHistory();
    setEntries([]);
    setShowClearModal(false);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="History"
        subtitle="Archive of dispatched bulk SMS batches"
        rightElement={
          entries.length > 0 ? (
            <TouchableOpacity
              style={styles.clearHeaderBtn}
              onPress={() => setShowClearModal(true)}
            >
              <IconTrash size={16} color={theme.colors.error} />
              <Text style={styles.clearHeaderText}>Clear</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBox}>
            <IconHistory size={28} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No messages sent yet</Text>
          <Text style={styles.emptySubtitle}>
            Completed bulk SMS campaigns will automatically appear here with
            full delivery reports.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={theme.colors.primary}
            />
          }
        >
          {entries.map((entry) => {
            const sentCount = entry.recipients.filter(
              (r) => r.status === "sent" || r.status === "delivered"
            ).length;
            const failedCount = entry.recipients.filter(
              (r) => r.status === "failed"
            ).length;
            const totalCount = entry.recipients.length;
            const allDelivered = failedCount === 0;

            return (
              <View key={entry.id} style={styles.historyCard}>
                <View style={styles.cardHeader}>
                  <Badge variant="sand" size="sm">
                    {formatTimestamp(entry.timestamp)}
                  </Badge>
                  <Badge
                    variant={allDelivered ? "success" : "warning"}
                    size="sm"
                  >
                    {allDelivered
                      ? "100% Sent"
                      : `${sentCount}/${totalCount} Sent`}
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
                    <Text style={styles.failedText}>
                      {failedCount} failed
                    </Text>
                  ) : (
                    <Text style={styles.allSuccessText}>All delivered</Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Clear Confirmation Modal */}
      <Modal visible={showClearModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconBox, { backgroundColor: theme.colors.errorBg }]}>
              <IconTrash size={24} color={theme.colors.error} />
            </View>
            <Text style={styles.modalTitle}>Clear Send History?</Text>
            <Text style={styles.modalMessage}>
              This will permanently delete all saved message history records
              from local storage. This action cannot be undone.
            </Text>
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowClearModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={handleClear}
              >
                <Text style={styles.modalDeleteText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  clearHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.errorBg,
    borderWidth: 1,
    borderColor: "#FACDCD",
    gap: 6,
  },
  clearHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.error,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(32, 22, 16, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: 22,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.lg,
  },
  modalIconBox: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
