import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";
import { IconTrash, IconHistory } from "../Icons";

interface ClearHistoryModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ClearHistoryModal({
  visible,
  onConfirm,
  onCancel,
}: ClearHistoryModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View
            style={[
              styles.modalIconBox,
              { backgroundColor: theme.colors.errorBg },
            ]}
          >
            <IconTrash size={24} color={theme.colors.error} />
          </View>
          <Text style={styles.modalTitle}>Clear Send History?</Text>
          <Text style={styles.modalMessage}>
            This will permanently delete all saved message history records from
            local storage. This action cannot be undone.
          </Text>
          <View style={styles.modalActionRow}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={onCancel}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDeleteButton}
              onPress={onConfirm}
            >
              <Text style={styles.modalDeleteText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function EmptyHistoryState() {
  return (
    <View style={styles.centerContainer}>
      <View style={styles.emptyIconBox}>
        <IconHistory size={28} color={theme.colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No messages sent yet</Text>
      <Text style={styles.emptySubtitle}>
        Completed bulk SMS campaigns will automatically appear here with full
        delivery reports.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(32, 22, 16, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: 22,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.lg,
  },
  modalIconBox: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
