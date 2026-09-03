import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  getTemplates,
  deleteTemplate,
  MessageTemplate,
} from "../../lib/storage";
import { theme } from "../../lib/theme";
import { IconClose, IconTrash, IconCheck } from "../Icons";

interface TemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (content: string) => void;
  onOpenSaveModal: () => void;
}

export function TemplatesModal({
  visible,
  onClose,
  onSelectTemplate,
  onOpenSaveModal,
}: TemplatesModalProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await getTemplates();
      setTemplates(rows);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadTemplates();
    }
  }, [visible, loadTemplates]);

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    loadTemplates();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Message Templates</Text>
              <Text style={styles.modalSubtitle}>
                Select a template or save custom templates
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <IconClose size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Action Row */}
          <TouchableOpacity
            style={styles.saveCurrentCTA}
            activeOpacity={0.8}
            onPress={() => {
              onClose();
              onOpenSaveModal();
            }}
          >
            <Text style={styles.saveCurrentEmoji}>💾</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.saveCurrentTitle}>
                Save Current Message as Template
              </Text>
              <Text style={styles.saveCurrentSubtitle}>
                Save your composed text with placeholders for reuse
              </Text>
            </View>
          </TouchableOpacity>

          {/* Templates List */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : templates.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No saved templates yet.</Text>
            </View>
          ) : (
            <FlatList
              data={templates}
              keyExtractor={(t) => t.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.templateCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelectTemplate(item.content);
                    onClose();
                  }}
                >
                  <View style={styles.templateCardHeader}>
                    <Text style={styles.templateTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                    >
                      <IconTrash size={14} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.templateContent} numberOfLines={2}>
                    {item.content}
                  </Text>

                  <View style={styles.templateFooter}>
                    <Text style={styles.useTemplateText}>Tap to use →</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
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
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
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
  saveCurrentCTA: {
    backgroundColor: theme.colors.primaryUltraLight,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  saveCurrentEmoji: {
    fontSize: 18,
  },
  saveCurrentTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  saveCurrentSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  centerContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  listContent: {
    gap: 10,
    paddingBottom: 16,
  },
  templateCard: {
    backgroundColor: theme.colors.cardSubtle,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  templateCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  deleteBtn: {
    padding: 4,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.errorBg,
  },
  templateContent: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  templateFooter: {
    alignItems: "flex-end",
    marginTop: 2,
  },
  useTemplateText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.primary,
  },
});
