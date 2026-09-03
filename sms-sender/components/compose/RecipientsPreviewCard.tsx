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
import { ContactGroup, getGroups, getGroupMembers } from "../../lib/storage";
import { useContactsStore } from "../../stores/contacts";
import { theme } from "../../lib/theme";
import { Badge } from "../Badge";
import {
  IconContacts,
  IconChevronRight,
  IconClose,
  IconTrash,
} from "../Icons";

export interface RecipientPreviewItem {
  id: string;
  name: string;
  phone: string;
}

interface RecipientsPreviewCardProps {
  recipients: RecipientPreviewItem[];
  onPress: () => void;
}

interface GroupWithMembers {
  group: ContactGroup;
  memberPhones: string[];
}

function formatRecipientSummary(
  recipients: RecipientPreviewItem[],
  groupName?: string | null
): string {
  if (recipients.length === 0) return "";
  if (groupName) {
    if (recipients.length <= 2) {
      return `👥 ${groupName} · ${recipients.map((r) => r.name).join(", ")}`;
    }
    const firstNames = recipients.slice(0, 2).map((r) => r.name).join(", ");
    const remaining = recipients.length - 2;
    return `👥 ${groupName} · ${firstNames} +${remaining} others`;
  }
  if (recipients.length <= 3) {
    return recipients.map((r) => r.name).join(", ");
  }
  const firstNames = recipients.slice(0, 2).map((r) => r.name).join(", ");
  const remaining = recipients.length - 2;
  return `${firstNames} +${remaining} others`;
}

export function RecipientsPreviewCard({
  recipients,
  onPress,
}: RecipientsPreviewCardProps) {
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [groupsData, setGroupsData] = useState<GroupWithMembers[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const selectedContacts = useContactsStore((s) => s.selectedContacts);
  const selectedGroupName = useContactsStore((s) => s.selectedGroupName);
  const setSelectedContacts = useContactsStore((s) => s.setSelectedContacts);
  const clearAll = useContactsStore((s) => s.clearAll);

  const loadGroupsWithMembers = useCallback(async () => {
    try {
      setLoadingGroups(true);
      const rows = await getGroups();
      const withMembers: GroupWithMembers[] = await Promise.all(
        rows.map(async (g) => {
          const members = await getGroupMembers(g.id);
          return {
            group: g,
            memberPhones: members.map((m) => m.phone),
          };
        })
      );
      setGroupsData(withMembers);
    } catch {
      setGroupsData([]);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    if (showGroupPicker) {
      loadGroupsWithMembers();
    }
  }, [showGroupPicker, loadGroupsWithMembers]);

  const handleToggleGroup = async (groupItem: GroupWithMembers) => {
    const members = await getGroupMembers(groupItem.group.id);
    const groupPhones = new Set(members.map((m) => m.phone));

    // Check if group is currently selected (all its member phones are in selectedContacts)
    const isCurrentlySelected =
      members.length > 0 &&
      members.every((m) =>
        selectedContacts.some((c) =>
          c.phoneNumbers.some((p) => p.number === m.phone)
        )
      );

    if (isCurrentlySelected) {
      // DESELECT GROUP: Remove this group's members
      const updated = selectedContacts.filter(
        (c) => !c.phoneNumbers.some((p) => groupPhones.has(p.number))
      );
      setSelectedContacts(updated, null);
    } else {
      // SELECT GROUP: Add this group's members (preventing duplicates)
      const newEntries = members
        .filter(
          (m) =>
            !selectedContacts.some((c) =>
              c.phoneNumbers.some((p) => p.number === m.phone)
            )
        )
        .map((m) => ({
          id: m.id,
          name: m.name,
          phoneNumbers: [{ number: m.phone, isPrimary: true }],
          customFields: m.customFields,
        }));

      setSelectedContacts(
        [...selectedContacts, ...newEntries],
        groupItem.group.name
      );
    }
  };

  const isGroupSelected = (groupItem: GroupWithMembers) => {
    if (groupItem.memberPhones.length === 0) return false;
    return groupItem.memberPhones.every((phone) =>
      selectedContacts.some((c) =>
        c.phoneNumbers.some((p) => p.number === phone)
      )
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>RECIPIENTS</Text>
          <View style={styles.headerActionsRow}>
            {recipients.length > 0 && (
              <TouchableOpacity
                style={styles.clearQuickBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
              >
                <Text style={styles.clearQuickBtnText}>Clear</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.groupQuickBtn}
              onPress={(e) => {
                e.stopPropagation();
                setShowGroupPicker(true);
              }}
            >
              <Text style={styles.groupQuickBtnText}>👥 Pick Group</Text>
            </TouchableOpacity>

            <View style={styles.rowCentered}>
              <Text style={styles.cardActionText}>Edit</Text>
              <IconChevronRight size={14} color={theme.colors.primaryMuted} />
            </View>
          </View>
        </View>

        <View style={styles.recipientContent}>
          {recipients.length === 0 ? (
            <View style={styles.emptyRecipientRow}>
              <View style={styles.avatarPlaceholder}>
                <IconContacts size={18} color={theme.colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyRecipientTitle}>
                  No contacts selected
                </Text>
                {/* <Text style={styles.emptyRecipientSubtitle}>
                  Tap to pick from contacts or choose a saved group
                </Text> */}
              </View>
            </View>
          ) : (
            <View style={styles.selectedRecipientsRow}>
              <View style={styles.avatarStack}>
                {recipients.slice(0, 3).map((r, i) => (
                  <View
                    key={r.id}
                    style={[
                      styles.avatarCircle,
                      { marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {r.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.recipientCountText}>
                  {recipients.length}{" "}
                  {recipients.length === 1 ? "recipient" : "recipients"} selected
                </Text>
                <Text style={styles.recipientSubtext} numberOfLines={1}>
                  {formatRecipientSummary(recipients, selectedGroupName)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Group Picker & Toggle Modal */}
      <Modal visible={showGroupPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Select Contact Groups</Text>
                <Text style={styles.modalSubtitle}>
                  Tap a group to select or deselect its members
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowGroupPicker(false)}
              >
                <IconClose size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Total Selected Summary & Clear Button */}
            {selectedContacts.length > 0 && (
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryText}>
                  Current Queue:{" "}
                  <Text style={{ fontWeight: "700", color: theme.colors.primary }}>
                    {selectedContacts.length} recipients
                  </Text>
                </Text>
                <TouchableOpacity
                  style={styles.modalClearBtn}
                  onPress={clearAll}
                >
                  <IconTrash size={14} color={theme.colors.error} />
                  <Text style={styles.modalClearBtnText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}

            {loadingGroups ? (
              <View style={styles.modalCenter}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : groupsData.length === 0 ? (
              <View style={styles.modalCenter}>
                <Text style={styles.modalEmptyText}>
                  No saved groups found. You can create groups in the Contacts
                  tab via CSV import or Smart Paste.
                </Text>
              </View>
            ) : (
              <FlatList
                data={groupsData}
                keyExtractor={(g) => g.group.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalListContent}
                renderItem={({ item }) => {
                  const selected = isGroupSelected(item);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.groupPickItem,
                        selected && styles.groupPickItemSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleToggleGroup(item)}
                    >
                      <View style={styles.groupPickLeft}>
                        <View
                          style={[
                            styles.groupAvatar,
                            selected && styles.groupAvatarSelected,
                          ]}
                        >
                          <IconContacts
                            size={18}
                            color={
                              selected
                                ? theme.colors.successText
                                : theme.colors.primary
                            }
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.groupPickName} numberOfLines={1}>
                            {item.group.name}
                          </Text>
                          <Text style={styles.groupPickSubtext}>
                            {item.group.memberCount}{" "}
                            {item.group.memberCount === 1 ? "member" : "members"}
                          </Text>
                        </View>
                      </View>

                      <Badge
                        variant={selected ? "success" : "default"}
                        size="sm"
                      >
                        {selected ? "✓ Selected" : "+ Add Group"}
                      </Badge>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
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
  headerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clearQuickBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.errorBg,
  },
  clearQuickBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.error,
  },
  groupQuickBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primaryLight,
  },
  groupQuickBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  cardActionText: {
    fontSize: 13,
    color: theme.colors.primaryMuted,
    fontWeight: "600",
    marginRight: 2,
  },
  rowCentered: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipientContent: {
    marginTop: 2,
  },
  emptyRecipientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyRecipientTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  emptyRecipientSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  selectedRecipientsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 2,
    borderColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  recipientCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  recipientSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
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
    maxHeight: "75%",
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.lg,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
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
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.cardSubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalSummaryText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  modalClearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.errorBg,
  },
  modalClearBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.error,
  },
  modalListContent: {
    gap: 10,
    paddingBottom: 16,
  },
  groupPickItem: {
    backgroundColor: theme.colors.cardSubtle,
    borderRadius: theme.radius.md,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  groupPickItemSelected: {
    backgroundColor: theme.colors.successBg,
    borderColor: "#CFE7D6",
  },
  groupPickLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
    marginRight: 10,
  },
  groupAvatar: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  groupAvatarSelected: {
    backgroundColor: "#D7EFE0",
  },
  groupPickName: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  groupPickSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  modalCenter: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalEmptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
