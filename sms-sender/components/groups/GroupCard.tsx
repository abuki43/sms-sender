import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ContactGroup } from "../../lib/storage";
import { theme } from "../../lib/theme";
import { Badge } from "../Badge";
import { IconContacts, IconTrash, IconChevronRight } from "../Icons";

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface GroupCardProps {
  group: ContactGroup;
  onPress: (group: ContactGroup) => void;
  onDelete: (group: ContactGroup) => void;
  onSelectForCompose?: (group: ContactGroup) => void;
}

export const GroupCard = memo(function GroupCard({
  group,
  onPress,
  onDelete,
  onSelectForCompose,
}: GroupCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPress(group)}
    >
      <View style={styles.cardLeft}>
        <View style={styles.avatarBubble}>
          <IconContacts size={20} color={theme.colors.primary} />
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.groupName} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={styles.dateSubtext}>
            Created {formatDate(group.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.cardRight}>
        <Badge variant="sand" size="sm">
          {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
        </Badge>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(group)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconTrash size={16} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...theme.shadow.sm,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatarBubble: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoCol: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  dateSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.errorBg,
  },
});
