import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
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
import { IconTrash } from "../../../components/Icons";
import { HistoryCard } from "../../../components/history/HistoryCard";
import {
  ClearHistoryModal,
  EmptyHistoryState,
} from "../../../components/history/HistoryModals";

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
        <EmptyHistoryState />
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
          {entries.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} />
          ))}
        </ScrollView>
      )}

      <ClearHistoryModal
        visible={showClearModal}
        onConfirm={handleClear}
        onCancel={() => setShowClearModal(false)}
      />
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
});
