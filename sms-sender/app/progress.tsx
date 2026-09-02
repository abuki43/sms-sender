import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { YStack, XStack, Text, Button, Spinner, H3, Paragraph, Separator } from "tamagui";
import ExpoSimSms, { SimCard, SmsStatusEvent } from "../modules/expo-sim-sms/src";

type Stage = "idle" | "loading" | "sending" | "done" | "error";

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

  useEffect(() => {
    loadSims();
  }, [loadSims]);

  useEffect(() => {
    const sub = ExpoSimSms.addListener("onSmsStatus", (event) => {
      setEvents((prev) => [...prev, event]);
    });
    return () => sub.remove();
  }, []);

  const sendTest = useCallback(async () => {
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

  return (
    <YStack p="$4" gap="$4" flex={1}>
      <H3>Phase 1 · SMS Module Test</H3>

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
        disabled={stage === "sending" || !phone}
        onPress={sendTest}
      >
        <Text>
          {stage === "sending" ? "Sending..." : "Send test SMS"}
        </Text>
      </Button>
    </YStack>
  );
}
