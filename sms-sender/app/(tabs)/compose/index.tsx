import { useState } from "react";
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
} from "tamagui";
import { useRouter } from "expo-router";
import { useContactsStore } from "../../../stores/contacts";
import { Badge } from "../../../components/Badge";

export default function ComposeScreen() {
  const [message, setMessage] = useState("");
  const [delay, setDelay] = useState(2);
  const router = useRouter();
  const selectedContacts = useContactsStore((s) => s.selectedContacts);

  const charCount = message.length;
  const hasUnicode = /[^\x00-\x7F]/.test(message);
  const charLimit = hasUnicode ? 70 : 160;
  const parts = charCount > 0 ? Math.ceil(charCount / charLimit) : 0;

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
          disabled={!message || selectedContacts.length === 0}
          onPress={() => {
            router.push({
              pathname: "/progress",
              params: {
                message,
                delay: delay.toString(),
                count: selectedContacts.length.toString(),
              },
            });
          }}
        >
          <Text>Send to {selectedContacts.length} contacts</Text>
        </Button>
      </YStack>
    </ScrollView>
  );
}
