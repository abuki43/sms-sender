import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createTemplate, MessageTemplate } from "../../lib/storage";
import { theme } from "../../lib/theme";
import { IconClose, IconCheck } from "../Icons";

interface SaveTemplateModalProps {
  visible: boolean;
  content: string;
  onClose: () => void;
  onSaved: (template: MessageTemplate) => void;
}

export function SaveTemplateModal({
  visible,
  content,
  onClose,
  onSaved,
}: SaveTemplateModalProps) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg("Please enter a title for the template.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      const newTemplate = await createTemplate(title.trim(), content.trim());
      setTitle("");
      onSaved(newTemplate);
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to save template.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Save Message as Template</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <IconClose size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.inputLabel}>TEMPLATE TITLE</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Payment Reminder, Holiday Promo"
              placeholderTextColor={theme.colors.textMuted}
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (errorMsg) setErrorMsg(null);
              }}
              autoFocus
            />

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>MESSAGE CONTENT</Text>
              <Text style={styles.previewText} numberOfLines={3}>
                {content || "No message content"}
              </Text>
            </View>

            {errorMsg ? (
              <Text style={styles.errorText}>{errorMsg}</Text>
            ) : null}

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  !title.trim() && styles.saveBtnDisabled,
                ]}
                disabled={saving || !title.trim()}
                onPress={handleSave}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <IconCheck size={16} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(32, 22, 16, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: 20,
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: theme.colors.primaryUltraLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewBox: {
    backgroundColor: theme.colors.cardSubtle,
    borderRadius: theme.radius.md,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textMuted,
    letterSpacing: 0.4,
  },
  previewText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  saveBtnDisabled: {
    backgroundColor: "#C9BEB3",
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
