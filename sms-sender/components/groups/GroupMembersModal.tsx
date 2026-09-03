import React, { useState, useEffect } from "react";
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
  ContactGroup,
  GroupMember,
  getGroupMembers,
  removeGroupMember,
} from "../../lib/storage";
import { theme } from "../../lib/theme";
import { Badge } from "../Badge";
import { IconClose, IconTrash, IconSend } from "../Icons";

interface GroupMembersModalProps {
  group: ContactGroup | null;
  visible: boolean;
  onClose: () => void;
  onSelectForCompose: (members: GroupMember[]) => void;
  onMemberRemoved?: () => void;
}

export function GroupMembersModal({
  group,
  visible,
  onClose,
  onSelectForCompose,
  onMemberRemoved,
}: GroupMembersModalProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (group && visible) {
      setLoading(true);
      getGroupMembers(group.id)
        .then(setMembers)
        .catch(() => setMembers([]))
        .finally(() => setLoading(false));
    }
  }, [group, visible]);

  const handleDeleteMember = async (memberId: string) => {
    await removeGroupMember(memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    onMemberRemoved?.();
  };

  if (!group) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {group.name}
              </Text>
              <Text style={styles.modalSubtitle}>
                {members.length} {members.length === 1 ? "member" : "members"} in
                group
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <IconClose size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Member List */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : members.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No members in this group</Text>
            </View>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(m) => m.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.memberRow,
                    index === members.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.memberPhone}>{item.phone}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteMemberBtn}
                    onPress={() => handleDeleteMember(item.id)}
                  >
                    <IconTrash size={14} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          {/* Primary CTA: Send to Group */}
          {members.length > 0 && (
            <TouchableOpacity
              style={styles.sendGroupBtn}
              activeOpacity={0.8}
              onPress={() => {
                onSelectForCompose(members);
                onClose();
              }}
            >
              <IconSend size={16} color="#FFFFFF" />
              <Text style={styles.sendGroupBtnText}>
                Use Group in Compose ({members.length} recipients)
              </Text>
            </TouchableOpacity>
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
    maxHeight: "85%",
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
  listContent: {
    paddingBottom: 16,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardSubtle,
    gap: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  memberPhone: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  deleteMemberBtn: {
    padding: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.errorBg,
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
  sendGroupBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    ...theme.shadow.md,
  },
  sendGroupBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
