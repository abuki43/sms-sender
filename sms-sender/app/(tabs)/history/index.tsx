import { YStack, Text, H3, Paragraph } from "tamagui";

export default function HistoryScreen() {
  return (
    <YStack flex={1} p="$4" items="center" justify="center">
      <H3>Send History</H3>
      <Paragraph color="$gray10" mt="$2">
        No messages sent yet
      </Paragraph>
    </YStack>
  );
}
