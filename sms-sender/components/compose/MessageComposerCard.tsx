import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";
import { Badge } from "../Badge";

interface MessageComposerCardProps {
  message: string;
  onChange: (text: string) => void;
  charCount: number;
  charLimit: number;
  hasUnicode: boolean;
  parts: number;
}

export function MessageComposerCard({
  message,
  onChange,
  charCount,
  charLimit,
  hasUnicode,
  parts,
}: MessageComposerCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>MESSAGE CONTENT</Text>
        {hasUnicode ? (
          <Badge variant="warning" size="sm">
            Unicode (70 char limit)
          </Badge>
        ) : (
          <Badge variant="sand" size="sm">
            GSM 7-bit (160 char limit)
          </Badge>
        )}
      </View>

      <TextInput
        style={styles.textArea}
        placeholder="Type your SMS message here..."
        placeholderTextColor={theme.colors.textMuted}
        multiline
        numberOfLines={5}
        value={message}
        onChangeText={onChange}
        textAlignVertical="top"
      />

      <View style={styles.composerFooter}>
        <Text
          style={[
            styles.charCounter,
            charCount > charLimit && { color: theme.colors.error },
          ]}
        >
          {charCount} / {charLimit} chars
        </Text>

        {parts > 1 ? (
          <Badge variant="warning" size="sm">
            {parts} SMS parts
          </Badge>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
  },
  textArea: {
    backgroundColor: theme.colors.primaryUltraLight,
    borderRadius: theme.radius.md,
    padding: 12,
    fontSize: 15,
    color: theme.colors.textPrimary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    lineHeight: 22,
  },
  composerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  charCounter: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
});
