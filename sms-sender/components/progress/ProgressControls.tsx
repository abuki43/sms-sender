import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";

interface ProgressControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  failed: number;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetryFailed: () => void;
}

export function ProgressControls({
  isRunning,
  isPaused,
  failed,
  onPause,
  onResume,
  onCancel,
  onRetryFailed,
}: ProgressControlsProps) {
  return (
    <View style={styles.controlsRow}>
      {isRunning && !isPaused ? (
        <TouchableOpacity
          style={[styles.controlBtn, styles.controlBtnWarning]}
          onPress={onPause}
          activeOpacity={0.7}
        >
          <Text style={styles.controlBtnWarningText}>Pause</Text>
        </TouchableOpacity>
      ) : null}

      {isRunning && isPaused ? (
        <TouchableOpacity
          style={[styles.controlBtn, styles.controlBtnPrimary]}
          onPress={onResume}
          activeOpacity={0.7}
        >
          <Text style={styles.controlBtnPrimaryText}>Resume</Text>
        </TouchableOpacity>
      ) : null}

      {isRunning ? (
        <TouchableOpacity
          style={[styles.controlBtn, styles.controlBtnDanger]}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.controlBtnDangerText}>Cancel</Text>
        </TouchableOpacity>
      ) : null}

      {!isRunning && failed > 0 ? (
        <TouchableOpacity
          style={[styles.controlBtn, styles.controlBtnPrimary, { flex: 2 }]}
          onPress={onRetryFailed}
          activeOpacity={0.7}
        >
          <Text style={styles.controlBtnPrimaryText}>
            Retry {failed} Failed
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  controlsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  controlBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  controlBtnPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  controlBtnPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  controlBtnWarning: {
    backgroundColor: theme.colors.warningBg,
    borderColor: "#F7DEBE",
  },
  controlBtnWarningText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.warningText,
  },
  controlBtnDanger: {
    backgroundColor: theme.colors.errorBg,
    borderColor: "#FACDCD",
  },
  controlBtnDangerText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.errorText,
  },
});
