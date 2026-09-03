import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";
import { IconWarning } from "../Icons";

interface SendConfirmModalProps {
  visible: boolean;
  recipientCount: number;
  delay: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SendConfirmModal({
  visible,
  recipientCount,
  delay,
  onConfirm,
  onCancel,
}: SendConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconBox}>
            <IconWarning size={24} color={theme.colors.warning} />
          </View>
          <Text style={styles.modalTitle}>Large Send Confirmation</Text>
          <Text style={styles.modalMessage}>
            You are about to send to {recipientCount} recipients. To protect your
            SIM against carrier spam restrictions, a {delay}s delay is applied
            between each message.
          </Text>
          <View style={styles.modalActionRow}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={onCancel}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={onConfirm}
            >
              <Text style={styles.modalConfirmText}>Proceed & Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface PermissionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PermissionModal({ visible, onClose }: PermissionModalProps) {
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
            <IconWarning size={24} color={theme.colors.error} />
          </View>
          <Text style={styles.modalTitle}>SMS Permission Required</Text>
          <Text style={styles.modalMessage}>
            SMS Sender needs permission to access your SIM card and dispatch
            messages. Please grant SMS and Phone permissions in Settings.
          </Text>
          <TouchableOpacity
            style={[styles.modalConfirmButton, { width: "100%" }]}
            onPress={onClose}
          >
            <Text style={styles.modalConfirmText}>Understood</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: theme.colors.warningBg,
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
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
