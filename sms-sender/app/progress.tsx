import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Linking } from "react-native";
import { YStack, XStack, Text, Button, Spinner, H3, Paragraph, Separator } from "tamagui";
import ExpoSimSms, { SimCard, SmsStatusEvent } from "../modules/expo-sim-sms/src";
import {
  checkSmsPermissions,
  requestSmsPermissions,
  SmsPermissionResult,
} from "../lib/permissions";

type Stage = "idle" | "loading" | "sending" | "done" | "error";
type PermState = "checking" | "granted" | "denied";

export default function ProgressScreen() {
  const { message, phone, count } = useLocalSearchParams<{
    message?: string;
    phone?: string;
    count?: string;
  }>();

  const [sims, setSims] = useState<SimCard[]>([]);
  const [selectedSim, setSelectedSim] = useState<number | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<string | null>(null);
  const [events, setEvents] = useState<SmsStatusEvent[]>([]);
  const [permState, setPermState] = useState<PermState>("checking");
  const [permResult, setPermResult] = useState<SmsPermissionResult | null>(null);

  const last = events[events.length - 1] ?? null;

  const loadSims = useCallback(async () => {
    setStage("loading");
    try {
      const cards = await ExpoSimSms.getSimCards();
      setSims(cards);
      if (cards.length === 1) {
        setSelectedSim(cards[0].subscriptionId);
      }
      setStage("idle");
    } catch (e) {
      setStage("error");
      setResult(`Failed to read SIMs: ${(e as Error).message}`);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    setPermState("checking");
    const result = await requestSmsPermissions();
    setPermResult(result);
    if (result.status === "granted") {
      setPermState("granted");
      loadSims();
    } else {
      setPermState("denied");
    }
  }, [loadSims]);

  useEffect(() => {
    (async () => {
      const granted = await checkSmsPermissions();
      if (granted) {
        setPermState("granted");
        loadSims();
      } else {
        setPermState("denied");
      }
    })();
  }, [loadSims]);

  useEffect(() => {
    const sub = ExpoSimSms.addListener("onSmsStatus", (event) => {
      setEvents((prev) => [...prev, event]);
    });
    return () => sub.remove();
  }, []);

  const sendTest = useCallback(async () => {
    const granted = await checkSmsPermissions();
    if (!granted) {
      setStage("error");
      setResult("SMS / Phone permissions are required to send.");
      return;
    }
    if (!phone) {
      setStage("error");
      setResult("No recipient phone number found for the selected contact.");
      return;
    }
    setEvents([]);
    setStage("sending");
    setResult(null);
    try {
      const res = await ExpoSimSms.sendMultipartSms(
        phone,
        message ?? "",
        selectedSim ?? undefined
      );
      setResult(
        res.status === "sent"
          ? `Sent to ${phone} (${res.partCount} part(s))`
          : `Send reported: ${res.status}${res.errorCode ? ` (${res.errorCode})` : ""}`
      );
      setStage(res.status === "sent" ? "done" : "error");
    } catch (e) {
      setResult(`Error: ${(e as Error).message}`);
      setStage("error");
    }
  }, [phone, message, selectedSim]);

  const canAskAgain = permResult?.status === "denied" ? permResult.canAskAgain : true;

  return (
    <YStack p="$4" gap="$4" flex={1}>
      <H3>Phase 1 · SMS Module Test</H3>

      {permState === "denied" && (
        <YStack gap="$2" p="$3" bg="$orange2" rounded="$3" borderWidth={1} borderColor="$orange8">
          <Text color="$orange11" fontWeight="bold">
            SMS & Phone permissions required
          </Text>
          <Paragraph size="$3" color="$orange11">
            SMS Sender needs SMS and Phone permissions to detect SIM cards and
            send messages.
          </Paragraph>
          <XStack gap="$2">
            {canAskAgain ? (
              <Button size="$3" theme="orange" onPress={requestPermissions}>
                <Text>Grant permissions</Text>
              </Button>
            ) : (
              <Button
                size="$3"
                theme="orange"
                onPress={() => Linking.openSettings()}
              >
                <Text>Open Settings</Text>
              </Button>
            )}
          </XStack>
        </YStack>
      )}

      <YStack gap="$2">
        <Text fontWeight="bold">Recipient</Text>
        <Paragraph size="$3" color="$gray11">
          {phone ? `${phone}` : "No number available"}
          {count && Number(count) > 1 ? `  (+${count} selected total)` : ""}
        </Paragraph>
      </YStack>

      <Separator />

      <YStack gap="$2">
        <XStack justify="space-between" items="center">
          <Text fontWeight="bold">SIM cards</Text>
          <Button size="$2" chromeless onPress={loadSims}>
            <Text>Refresh</Text>
          </Button>
        </XStack>
        {stage === "loading" ? (
          <Spinner />
        ) : sims.length === 0 ? (
          <Paragraph size="$3" color="$gray11">
            No active SIM detected. Ensure the app has SMS/Phone permissions.
          </Paragraph>
        ) : (
          sims.map((sim) => {
            const active = selectedSim === sim.subscriptionId;
            return (
              <Button
                key={sim.id}
                justify="flex-start"
                theme={active ? "blue" : undefined}
                onPress={() => setSelectedSim(sim.subscriptionId)}
              >
                <Text>
                  {sim.displayName}
                  {sim.carrierName ? ` · ${sim.carrierName}` : ""}
                  {active ? "  ✓" : ""}
                </Text>
              </Button>
            );
          })
        )}
      </YStack>

      <Separator />

      <YStack gap="$2">
        <Text fontWeight="bold">Live status</Text>
        {last ? (
          <Paragraph size="$3">
            {last.status}: {last.phone}
            {last.errorCode ? ` (${last.errorCode})` : ""}
            {last.partCount ? ` · ${last.partCount} part(s)` : ""}
          </Paragraph>
        ) : (
          <Paragraph size="$3" color="$gray10">
            No events yet.
          </Paragraph>
        )}
      </YStack>

      {result && (
        <Paragraph
          size="$3"
          color={stage === "error" ? "$red10" : "$green10"}
        >
          {result}
        </Paragraph>
      )}

      <Button
        theme="blue"
        size="$5"
        disabled={stage === "sending" || !phone || permState !== "granted"}
        onPress={sendTest}
      >
        <Text>
          {stage === "sending" ? "Sending..." : "Send test SMS"}
        </Text>
      </Button>
    </YStack>
  );
}
