import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { ParsedContact } from "../../lib/csv-parser";
import { createGroup, ContactGroup } from "../../lib/storage";
import { theme } from "../../lib/theme";
import { IconClose, IconCheck } from "../Icons";
import { CsvImportView } from "./CsvImportView";
import { SmartPasteView } from "./SmartPasteView";

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: (group: ContactGroup) => void;
}

type TabType = "csv" | "paste";

export function CreateGroupModal({
  visible,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("paste");
  const [groupName, setGroupName] = useState("");
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    if (!groupName.trim()) {
      setErrorMsg("Please enter a name for this group.");
      return;
    }
    if (parsedContacts.length === 0) {
      setErrorMsg("Please add at least 1 valid phone number.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      const newGroup = await createGroup(groupName.trim(), parsedContacts);
      // Reset
      setGroupName("");
      setParsedContacts([]);
      onGroupCreated(newGroup);
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to save group to database.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Create Contact Group</Text>
              <Text style={styles.modalSubtitle}>
                Add bulk contacts via CSV file or paste
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <IconClose size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Group Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GROUP NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. VIP Clients, Marketing Batch A"
                placeholderTextColor={theme.colors.textMuted}
                value={groupName}
                onChangeText={(t) => {
                  setGroupName(t);
                  if (errorMsg) setErrorMsg(null);
                }}
              />
            </View>

            {/* Segmented Tab Selector */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[
                  styles.tabItem,
                  activeTab === "csv" && styles.tabItemActive,
                ]}
                onPress={() => {
                  setActiveTab("csv");
                  setParsedContacts([]);
                }}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === "csv" && styles.tabItemTextActive,
                  ]}
                >
                  📁 CSV / Text File
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabItem,
                  activeTab === "paste" && styles.tabItemActive,
                ]}
                onPress={() => {
                  setActiveTab("paste");
                  setParsedContacts([]);
                }}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === "paste" && styles.tabItemTextActive,
                  ]}
                >
                  📋 Smart Paste
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Views */}
            {activeTab === "csv" ? (
              <CsvImportView onContactsParsed={setParsedContacts} />
            ) : (
              <SmartPasteView onContactsParsed={setParsedContacts} />
            )}

            {errorMsg ? (
              <Text style={styles.errorBanner}>{errorMsg}</Text>
            ) : null}

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                (parsedContacts.length === 0 || !groupName.trim()) &&
                  styles.saveButtonDisabled,
              ]}
              disabled={
                saving || parsedContacts.length === 0 || !groupName.trim()
              }
              onPress={handleSave}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <IconCheck size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>
                    Save Group ({parsedContacts.length} contacts)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(32, 22, 16, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollBody: {
    gap: 14,
    paddingBottom: 16,
  },
  inputGroup: {
    gap: 6,
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
    height: 46,
    fontSize: 14,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: theme.colors.cardSubtle,
    borderRadius: theme.radius.md,
    padding: 3,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItemActive: {
    backgroundColor: theme.colors.card,
    ...theme.shadow.sm,
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  tabItemTextActive: {
    color: theme.colors.primary,
  },
  errorBanner: {
    fontSize: 13,
    color: theme.colors.error,
    fontWeight: "600",
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    ...theme.shadow.md,
  },
  saveButtonDisabled: {
    backgroundColor: "#C9BEB3",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
