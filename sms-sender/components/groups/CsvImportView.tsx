import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { parseCsvContacts, ParsedContact } from "../../lib/csv-parser";
import { theme } from "../../lib/theme";
import { Badge } from "../Badge";
import { IconCheck, IconWarning, IconUpload } from "../Icons";

interface CsvImportViewProps {
  onContactsParsed: (contacts: ParsedContact[]) => void;
}

export function CsvImportView({ onContactsParsed }: CsvImportViewProps) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseStats, setParseStats] = useState<{
    validCount: number;
    duplicateCount: number;
    invalidCount: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePickFile = async () => {
    setErrorMsg(null);
    try {
      setLoading(true);

      // Dynamically load DocumentPicker so APKs without the native module don't crash on boot
      let DocumentPicker: any;
      try {
        DocumentPicker = await import("expo-document-picker");
      } catch (err) {
        throw new Error(
          "Document Picker native module is not in your current APK build. Please use the 'Smart Paste' tab to paste your CSV text directly, or rebuild with EAS."
        );
      }

      if (!DocumentPicker || !DocumentPicker.getDocumentAsync) {
        throw new Error(
          "Document Picker is not available. Please use the 'Smart Paste' tab to paste your CSV text directly."
        );
      }

      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/comma-separated-values",
          "text/plain",
          "application/vnd.ms-excel",
          "*/*",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        setLoading(false);
        return;
      }

      const file = res.assets[0];
      setFileName(file.name);

      const response = await fetch(file.uri);
      const fileContent = await response.text();

      const parsed = parseCsvContacts(fileContent);

      if (parsed.contacts.length === 0) {
        setErrorMsg("No valid phone numbers found in the selected file.");
        setParseStats(null);
        onContactsParsed([]);
      } else {
        setParseStats({
          validCount: parsed.contacts.length,
          duplicateCount: parsed.duplicateCount,
          invalidCount: parsed.invalidCount,
        });
        onContactsParsed(parsed.contacts);
      }
    } catch (e: any) {
      setErrorMsg(
        e?.message ||
          "Failed to open file picker. Please use the Smart Paste tab."
      );
      onContactsParsed([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.uploadBox}
        activeOpacity={0.8}
        onPress={handlePickFile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <View style={styles.uploadIconCircle}>
              <IconUpload size={22} color={theme.colors.primary} />
            </View>
            <Text style={styles.uploadTitle}>
              {fileName ? fileName : "Tap to Select CSV or Text File"}
            </Text>
            <Text style={styles.uploadSubtitle}>
              Browse device files or use the Smart Paste tab
            </Text>
          </>
        )}
      </TouchableOpacity>

      {errorMsg ? (
        <View style={styles.errorBox}>
          <IconWarning size={18} color={theme.colors.error} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {parseStats ? (
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <IconCheck size={16} color={theme.colors.successText} />
            <Text style={styles.statsTitle}>File Parsed Successfully</Text>
          </View>

          <View style={styles.statsBadgesRow}>
            <Badge variant="success" size="sm">
              {parseStats.validCount} valid contacts
            </Badge>
            {parseStats.duplicateCount > 0 && (
              <Badge variant="warning" size="sm">
                {parseStats.duplicateCount} duplicates removed
              </Badge>
            )}
            {parseStats.invalidCount > 0 && (
              <Badge variant="default" size="sm">
                {parseStats.invalidCount} invalid skipped
              </Badge>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  uploadBox: {
    backgroundColor: theme.colors.cardSubtle,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: theme.colors.borderFocus,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  uploadEmoji: {
    fontSize: 22,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  uploadSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FACDCD",
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.errorText,
    flex: 1,
    lineHeight: 18,
  },
  statsCard: {
    backgroundColor: theme.colors.successBg,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: "#CFE7D6",
    gap: 8,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.successText,
  },
  statsBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
});
