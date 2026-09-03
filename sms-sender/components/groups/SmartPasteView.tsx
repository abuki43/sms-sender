import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { parsePastedContacts, ParsedContact } from "../../lib/csv-parser";
import { theme } from "../../lib/theme";
import { Badge } from "../Badge";

interface SmartPasteViewProps {
  onContactsParsed: (contacts: ParsedContact[]) => void;
}

export function SmartPasteView({ onContactsParsed }: SmartPasteViewProps) {
  const [text, setText] = useState("");
  const [stats, setStats] = useState<{
    validCount: number;
    duplicateCount: number;
  }>({ validCount: 0, duplicateCount: 0 });

  useEffect(() => {
    if (!text.trim()) {
      setStats({ validCount: 0, duplicateCount: 0 });
      onContactsParsed([]);
      return;
    }

    const parsed = parsePastedContacts(text);
    setStats({
      validCount: parsed.contacts.length,
      duplicateCount: parsed.duplicateCount,
    });
    onContactsParsed(parsed.contacts);
  }, [text, onContactsParsed]);

  return (
    <View style={styles.container}>
      <Text style={styles.helperText}>
        Paste contacts in formats like "Abebe - 0911223344" or paste raw phone
        numbers (one per line):
      </Text>

      <TextInput
        style={styles.textArea}
        placeholder={`Abebe - 0911234567\nKebede, +251922345678\n0933456789`}
        placeholderTextColor={theme.colors.textMuted}
        multiline
        numberOfLines={6}
        value={text}
        onChangeText={setText}
        textAlignVertical="top"
      />

      <View style={styles.footerRow}>
        <Badge
          variant={stats.validCount > 0 ? "success" : "default"}
          size="sm"
        >
          {stats.validCount} {stats.validCount === 1 ? "contact detected" : "contacts detected"}
        </Badge>

        {stats.duplicateCount > 0 && (
          <Badge variant="warning" size="sm">
            {stats.duplicateCount} duplicates removed
          </Badge>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  helperText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  textArea: {
    backgroundColor: theme.colors.primaryUltraLight,
    borderRadius: theme.radius.md,
    padding: 12,
    fontSize: 14,
    color: theme.colors.textPrimary,
    minHeight: 130,
    borderWidth: 1,
    borderColor: theme.colors.border,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
});
