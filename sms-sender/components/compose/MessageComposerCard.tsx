import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { theme } from "../../lib/theme";
import { Badge } from "../Badge";
import { PlaceholderTagsBar } from "./PlaceholderTagsBar";
import { resolveTemplate, hasPlaceholders } from "../../lib/template-resolver";

interface MessageComposerCardProps {
  message: string;
  onChange: (text: string) => void;
  charCount: number;
  charLimit: number;
  hasUnicode: boolean;
  parts: number;
  onOpenTemplates: () => void;
  availableTags: string[];
  onInsertTag: (tag: string) => void;
  sampleRecipient?: {
    name: string;
    phone: string;
    customFields?: Record<string, string>;
  };
}

export function MessageComposerCard({
  message,
  onChange,
  charCount,
  charLimit,
  hasUnicode,
  parts,
  onOpenTemplates,
  availableTags,
  onInsertTag,
  sampleRecipient,
}: MessageComposerCardProps) {
  const showPreview = hasPlaceholders(message) && !!sampleRecipient;
  const renderedSample = sampleRecipient
    ? resolveTemplate(message, sampleRecipient)
    : "";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>MESSAGE CONTENT</Text>
        <View style={styles.headerRightRow}>
          <TouchableOpacity
            style={styles.templatesBtn}
            activeOpacity={0.7}
            onPress={onOpenTemplates}
          >
            <Text style={styles.templatesBtnText}>📋 Templates</Text>
          </TouchableOpacity>

          {hasUnicode ? (
            <Badge variant="warning" size="sm">
              Unicode (70 limit)
            </Badge>
          ) : (
            <Badge variant="sand" size="sm">
              GSM (160 limit)
            </Badge>
          )}
        </View>
      </View>

      {/* Dynamic Placeholder Tag Insert Bar */}
      <View style={styles.tagsBarWrapper}>
        <PlaceholderTagsBar
          availableTags={availableTags}
          onInsertTag={onInsertTag}
        />
      </View>

      <TextInput
        style={styles.textArea}
        placeholder="Type SMS or use {name}, {phone}, {Amount} tags..."
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

      {/* Live Sample Preview Box */}
      {showPreview && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTag}>👁 LIVE SAMPLE PREVIEW</Text>
            <Text style={styles.previewContactName} numberOfLines={1}>
              for {sampleRecipient.name || sampleRecipient.phone}
            </Text>
          </View>
          <Text style={styles.previewBody}>{renderedSample}</Text>
        </View>
      )}
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
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
  },
  headerRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  templatesBtn: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  templatesBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  tagsBarWrapper: {
    marginBottom: 8,
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
    marginTop: 8,
  },
  charCounter: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  previewContainer: {
    marginTop: 12,
    backgroundColor: theme.colors.cardSubtle,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    gap: 6,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  previewTag: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  previewContactName: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  previewBody: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
});
