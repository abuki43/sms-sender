import { useCallback, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import {
  YStack,
  XStack,
  Text,
  H3,
  Paragraph,
  Button,
  Separator,
  Spinner,
} from "tamagui";
import { useFocusEffect } from "expo-router";
import {
  SendHistoryEntry,
  clearSendHistory,
  getSendHistory,
  initDatabase,
} from "../../../lib/storage";

function summarize(entry: SendHistoryEntry): string {
  const sent = entry.recipients.filter(
    (r) => r.status === "sent" || r.status === "delivered"
  ).length;
  const failed = entry.recipients.filter((r) => r.status === "failed").length;
  if (failed > 0) return `${sent} sent, ${failed} failed`;
  return `${sent} ${sent === 1 ? "message" : "messages"}`;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function HistoryScreen() {
  const [entries, setEntries] = useState<SendHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await initDatabase();
    const rows = await getSendHistory();
    setEntries(rows);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const handleClear = async () => {
    await clearSendHistory();
    setEntries([]);
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          void load();
        }} />
      }
    >
      <YStack p="$4" gap="$4" flex={1}>
        <XStack justify="space-between" items="center">
          <H3>Send History</H3>
          {entries.length > 0 ? (
            <Button theme="red" size="$3" onPress={handleClear}>
              <Text>Clear</Text>
            </Button>
          ) : null}
        </XStack>

        {loading ? (
          <YStack flex={1} items="center" justify="center">
            <Spinner size="large" />
          </YStack>
        ) : entries.length === 0 ? (
          <YStack flex={1} items="center" justify="center" p="$6" gap="$2">
            <Paragraph color="$gray10">
              No messages sent yet.
            </Paragraph>
            <Paragraph size="$2" color="$gray10">
              Completed bulk sends will appear here.
            </Paragraph>
          </YStack>
        ) : (
          entries.map((entry, idx) => (
            <YStack key={entry.id} gap="$2">
              {idx > 0 ? <Separator /> : null}
              <Text fontSize="$4" color="$gray10">
                {formatTimestamp(entry.timestamp)}
              </Text>
              <Text numberOfLines={2}>{entry.message}</Text>
              <XStack gap="$2" items="center">
                <Text fontSize="$2" fontWeight="bold" color="$blue10">
                  {summarize(entry)}
                </Text>
                <Text fontSize="$2" color="$gray10">
                  to {entry.recipients.length}{" "}
                  {entry.recipients.length === 1 ? "recipient" : "recipients"}
                </Text>
              </XStack>
            </YStack>
          ))
        )}
      </YStack>
    </ScrollView>
  );
}
