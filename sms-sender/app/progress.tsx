import { useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Button,
  H3,
  Paragraph,
  Separator,
  Progress,
  Spinner,
} from "tamagui";
import { useBulkSend } from "../hooks/useBulkSend";
import { describeError } from "../lib/error-handler";
import { initDatabase, saveSendHistory } from "../lib/storage";
import {
  RecipientStatus,
  SendStatus,
} from "../lib/bulk-send";
import { Badge } from "../components/Badge";

const STATUS_META: Record<SendStatus, { label: string; color: string }> = {
  queued: { label: "Queued", color: "$gray11" },
  sending: { label: "Sending", color: "$blue10" },
  sent: { label: "Sent", color: "$green10" },
  delivered: { label: "Delivered", color: "$green10" },
  failed: { label: "Failed", color: "$red10" },
};

export default function ProgressScreen() {
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
    if (wasRunning.current && !isRunning && total > 0 && perRecipient.length > 0) {
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
  }, [isRunning, total, perRecipient]);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <YStack p="$4" gap="$4" flex={1}>
        <H3>Bulk Send</H3>

        {total === 0 ? (
          <YStack gap="$3" flex={1} items="center" justify="center" p="$6">
            <Paragraph color="$gray10">
              No send in progress. Compose a message and press Send.
            </Paragraph>
          </YStack>
        ) : (
          <>
            <YStack gap="$2">
              <XStack justify="space-between" items="center">
                <Text fontWeight="bold">
                  {doneCount}/{total}
                </Text>
                <Badge>
                  <Text fontSize="$2">
                    {isPaused
                      ? "Paused"
                      : isRunning
                        ? `${pct}%`
                        : failed > 0
                          ? "Completed with errors"
                          : "Completed"}
                  </Text>
                </Badge>
              </XStack>
              <Progress size="$5" value={pct}>
                <Progress.Indicator bg="$blue8" />
              </Progress>
            </YStack>

            <XStack gap="$2" justify="space-between">
              <YStack items="center">
                <Text fontWeight="bold" color="$green10">{sent + delivered}</Text>
                <Text fontSize="$2" color="$gray10">sent</Text>
              </YStack>
              <YStack items="center">
                <Text fontWeight="bold">{doneCount}</Text>
                <Text fontSize="$2" color="$gray10">total</Text>
              </YStack>
              <YStack items="center">
                <Text fontWeight="bold" color="$red10">{failed}</Text>
                <Text fontSize="$2" color="$gray10">failed</Text>
              </YStack>
            </XStack>

            <XStack gap="$2">
              {isRunning && !isPaused ? (
                <Button flex={1} theme="orange" onPress={pause}>
                  <Text>Pause</Text>
                </Button>
              ) : null}
              {isRunning && isPaused ? (
                <Button flex={1} theme="blue" onPress={resume}>
                  <Text>Resume</Text>
                </Button>
              ) : null}
              {isRunning ? (
                <Button flex={1} theme="red" onPress={cancel}>
                  <Text>Cancel</Text>
                </Button>
              ) : null}
              {!isRunning && failed > 0 ? (
                <Button flex={1} onPress={retryFailed}>
                  <Text>Retry failed</Text>
                </Button>
              ) : null}
            </XStack>

            <Separator />

            <YStack gap="$2">
              <Text fontWeight="bold">Recipients</Text>
              {perRecipient.length === 0 && isRunning ? (
                <XStack gap="$2" items="center">
                  <Spinner size="small" />
                  <Text color="$gray10">Preparing queue...</Text>
                </XStack>
              ) : (
                perRecipient.map((r) => (
                  <RecipientRow key={r.recipient.id} record={r} />
                ))
              )}
            </YStack>
          </>
        )}
      </YStack>
    </ScrollView>
  );
}

function RecipientRow({ record }: { record: RecipientStatus }) {
  const meta = STATUS_META[record.status];
  return (
    <XStack justify="space-between" items="center" py="$1">
      <YStack flex={1}>
        <Text numberOfLines={1}>{record.recipient.name}</Text>
        <Text fontSize="$2" color="$gray10">
          {record.recipient.phone}
        </Text>
      </YStack>
      <YStack items="flex-end" gap={1}>
        <Text fontSize="$2" color={meta.color as any} fontWeight="bold">
          {meta.label}
        </Text>
        {record.status === "failed" && record.errorCode ? (
          <Text fontSize="$1" color="$red10">
            {describeError(record.errorCode)}
          </Text>
        ) : null}
      </YStack>
    </XStack>
  );
}
