import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import {
  YStack,
  XStack,
  Text,
  TextArea,
  Button,
  Slider,
  Separator,
  H3,
  Paragraph,
  Select,
  Spinner,
  AlertDialog,
  XGroup,
} from "tamagui";
import { useRouter } from "expo-router";
import { useContactsStore } from "../../../stores/contacts";
import { useBulkSend } from "../../../hooks/useBulkSend";
import { SimCard } from "../../../modules/expo-sim-sms/src";
import { RATE_LIMIT_WARNING_THRESHOLD } from "../../../lib/constants";

export default function ComposeScreen() {
  const [message, setMessage] = useState("");
  const [delay, setDelay] = useState(2);
  const [sims, setSims] = useState<SimCard[]>([]);
  const [simId, setSimId] = useState<string>("default");
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const selectedContacts = useContactsStore((s) => s.selectedContacts);
  const { start, getSimCards } = useBulkSend();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cards = await getSimCards();
        if (active && cards.length > 0) setSims(cards);
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [getSimCards]);

  const charCount = message.length;
  const hasUnicode = /[^\x00-\x7F]/.test(message);
  const charLimit = hasUnicode ? 70 : 160;
  const parts = charCount > 0 ? Math.ceil(charCount / charLimit) : 0;
  const rateLimited = selectedContacts.length >= RATE_LIMIT_WARNING_THRESHOLD;

  const selectedSim = sims.find((s) => s.id.toString() === simId);
  const recipients = selectedContacts.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phoneNumbers[0]?.number ?? "",
  })).filter((r) => r.phone.length > 0);

  const startSend = () => {
    start({
      recipients,
      message,
      simSubscriptionId: selectedSim?.subscriptionId,
      delayMs: delay * 1000,
    });
    router.push("/progress");
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <YStack p="$4" gap="$4" flex={1}>
        <H3>Compose Message</H3>

        <YStack gap="$2">
          <TextArea
            placeholder="Type your message here..."
            value={message}
            onChangeText={setMessage}
            numberOfLines={6}
            minH={120}
          />
          <XStack justify="space-between">
            <Paragraph
              size="$2"
              color={charCount > charLimit ? "$red10" : "$gray10"}
            >
              {charCount}/{charLimit} chars
            </Paragraph>
            {parts > 1 && (
              <Paragraph size="$2" color="$orange10">
                Will be split into {parts} parts
              </Paragraph>
            )}
          </XStack>
        </YStack>

        <Separator />

        <YStack gap="$2">
          <Text fontWeight="bold">Recipients</Text>
          <Button
            onPress={() => router.push("/(tabs)/contacts")}
            borderWidth={1}
            borderColor="$gray8"
            justify="flex-start"
          >
            <Text color={selectedContacts.length > 0 ? "$color" : "$gray8"}>
              {selectedContacts.length > 0
                ? `${selectedContacts.length} contacts selected`
                : "Tap to select contacts"}
            </Text>
          </Button>
        </YStack>

        <YStack gap="$2">
          <Text fontWeight="bold">SIM to send from</Text>
          {sims.length === 0 ? (
            <XStack gap="$2" items="center">
              <Spinner size="small" />
              <Text color="$gray10">Detecting SIM cards...</Text>
            </XStack>
          ) : (
            <Select value={simId} onValueChange={(v) => setSimId(v)}>
              <Select.Trigger borderWidth={1} borderColor="$gray8">
                <Select.Value
                  placeholder={
                    selectedSim
                      ? `${selectedSim.displayName}${selectedSim.carrierName ? ` (${selectedSim.carrierName})` : ""}`
                      : "Select SIM"
                  }
                />
              </Select.Trigger>
              <Select.Content>
                <Select.Viewport>
                  {sims.map((s, i) => (
                    <Select.Item key={s.id} index={i} value={s.id.toString()}>
                      <Select.ItemText>
                        {s.displayName}
                        {s.carrierName ? ` (${s.carrierName})` : ""}
                      </Select.ItemText>
                      <Select.ItemIndicator>
                        <Text>✓</Text>
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select>
          )}
        </YStack>

        <YStack gap="$2">
          <Text fontWeight="bold">Delay between sends: {delay}s</Text>
          <Slider
            defaultValue={[2]}
            min={1}
            max={5}
            step={0.5}
            onValueChange={(v) => setDelay(v[0])}
          >
            <Slider.Track>
              <Slider.TrackActive bg="$blue8" />
            </Slider.Track>
            <Slider.Thumb />
          </Slider>
        </YStack>

        <Separator />

        <Button
          theme="blue"
          size="$5"
          disabled={!message || recipients.length === 0}
          onPress={() => {
            if (rateLimited) setConfirming(true);
            else startSend();
          }}
        >
          <Text>Send to {recipients.length} contacts</Text>
        </Button>

        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay
              key="overlay"
              opacity={0.5}
              bg="$black"
            />
            <AlertDialog.Content
              key="content"
              bordered
              elevate
            >
              <YStack gap="$3">
                <AlertDialog.Title>Large send ({recipients.length})</AlertDialog.Title>
                <Text color="$orange10">
                  You're about to send {recipients.length} messages. Some
                  carriers rate-limit SMS at {RATE_LIMIT_WARNING_THRESHOLD}+
                  per minute and may block rapid sends. Proceed?
                </Text>
                <AlertDialog.Description asChild>
                  <Text color="$gray10">
                    The built-in delay gives the carrier time to breathe.
                  </Text>
                </AlertDialog.Description>
                <XGroup>
                  <AlertDialog.Cancel asChild>
                    <Button flex={1}>
                      <Text>Cancel</Text>
                    </Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <Button
                      flex={1}
                      theme="blue"
                      onPress={() => {
                        setConfirming(false);
                        startSend();
                      }}
                    >
                      <Text>Send anyway</Text>
                    </Button>
                  </AlertDialog.Action>
                </XGroup>
              </YStack>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>
      </YStack>
    </ScrollView>
  );
}
