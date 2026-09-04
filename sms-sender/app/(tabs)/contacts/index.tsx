import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SectionList,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import * as Contacts from "expo-contacts/legacy";
import { useContactsStore } from "../../../stores/contacts";
import {
  ContactGroup,
  GroupMember,
  getGroups,
  deleteGroup,
} from "../../../lib/storage";
import { theme } from "../../../lib/theme";
import { AppHeader } from "../../../components/AppHeader";
import { IconContacts, IconRefresh, IconPlus, IconUser, IconUsers } from "../../../components/Icons";
import { ContactSearchBar } from "../../../components/contacts/ContactSearchBar";
import { ContactActionBar } from "../../../components/contacts/ContactActionBar";
import {
  ContactRow,
  ContactItem,
} from "../../../components/contacts/ContactRow";
import { SectionHeader } from "../../../components/contacts/SectionHeader";
import { GroupCard } from "../../../components/groups/GroupCard";
import { CreateGroupModal } from "../../../components/groups/CreateGroupModal";
import { GroupMembersModal } from "../../../components/groups/GroupMembersModal";

interface Section {
  title: string;
  data: ContactItem[];
}

type MainTab = "address_book" | "groups";

export default function ContactsScreen() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<MainTab>("address_book");

  // Address book state
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const { selectedContacts, toggleContact, selectAll, clearAll, setSelectedContacts } =
    useContactsStore();

  // Groups state
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null);

  const loadContacts = useCallback(async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        sort: Contacts.SortTypes.FirstName,
      });

      const validContacts: ContactItem[] = (data || [])
        .filter(
          (c) =>
            !!c.name &&
            !!c.phoneNumbers &&
            c.phoneNumbers.length > 0 &&
            !!c.id
        )
        .map((c) => ({
          id: c.id!,
          name: c.name!,
          phoneNumbers: (c.phoneNumbers || []).map((p) => ({
            number: p.number ?? "",
            isPrimary: !!p.isPrimary,
          })),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const sectionMap = new Map<string, ContactItem[]>();
      for (const contact of validContacts) {
        const firstChar = contact.name.trim().charAt(0).toUpperCase();
        const letter = /^[A-Z]$/.test(firstChar) ? firstChar : "#";
        if (!sectionMap.has(letter)) sectionMap.set(letter, []);
        sectionMap.get(letter)!.push(contact);
      }

      const result: Section[] = Array.from(sectionMap.entries())
        .sort(([a], [b]) => {
          if (a === "#") return 1;
          if (b === "#") return -1;
          return a.localeCompare(b);
        })
        .map(([title, data]) => ({ title, data }));

      setSections(result);
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadGroupsList = useCallback(async () => {
    try {
      setLoadingGroups(true);
      const rows = await getGroups();
      setGroups(rows);
    } catch (e) {
      // ignore
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
    loadGroupsList();
  }, [loadContacts, loadGroupsList]);

  const handleDeleteGroup = async (group: ContactGroup) => {
    await deleteGroup(group.id);
    loadGroupsList();
  };

  const handleUseGroupInCompose = (members: GroupMember[]) => {
    const formattedContacts = members.map((m) => ({
      id: m.id,
      name: m.name,
      phoneNumbers: [{ number: m.phone, isPrimary: true }],
    }));
    setSelectedContacts(formattedContacts, selectedGroup?.name ?? null);
    router.push("/(tabs)/compose");
  };

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        data: s.data.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phoneNumbers.some((p) => p.number.includes(q))
        ),
      }))
      .filter((s) => s.data.length > 0);
  }, [sections, search]);

  const allVisible = useMemo(
    () => filteredSections.flatMap((s) => s.data),
    [filteredSections]
  );
  const allSelected =
    allVisible.length > 0 &&
    allVisible.every((c) => selectedContacts.some((s) => s.id === c.id));

  return (
    <View style={styles.container}>
      <AppHeader
        title="Contacts & Groups"
        rightElement={
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setIsRefreshing(true);
              if (currentTab === "address_book") loadContacts();
              else loadGroupsList();
            }}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <IconRefresh size={18} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        }
      />

      {/* Main Segmented Tab Switcher */}
      <View style={styles.segmentedContainer}>
        <View style={styles.segmentedTabBar}>
          <TouchableOpacity
            style={[
              styles.segmentedTab,
              currentTab === "address_book" && styles.segmentedTabActive,
            ]}
            onPress={() => setCurrentTab("address_book")}
          >
            <IconUser
              size={15}
              color={
                currentTab === "address_book"
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.segmentedTabText,
                currentTab === "address_book" && styles.segmentedTabTextActive,
              ]}
            >
              Address Book
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentedTab,
              currentTab === "groups" && styles.segmentedTabActive,
            ]}
            onPress={() => setCurrentTab("groups")}
          >
            <IconUsers
              size={15}
              color={
                currentTab === "groups"
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.segmentedTabText,
                currentTab === "groups" && styles.segmentedTabTextActive,
              ]}
            >
              Contact Groups ({groups.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TAB 1: ADDRESS BOOK */}
      {currentTab === "address_book" ? (
        <>
          <View style={styles.searchSection}>
            <ContactSearchBar
              search={search}
              onChangeText={setSearch}
              onClear={() => setSearch("")}
            />

            <ContactActionBar
              selectedCount={selectedContacts.length}
              showToggle={allVisible.length > 0}
              allSelected={allSelected}
              onToggleAll={allSelected ? clearAll : () => selectAll(allVisible)}
            />
          </View>

          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : filteredSections.length === 0 ? (
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconBox}>
                <IconContacts size={28} color={theme.colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No contacts found</Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? "No contacts match your search query"
                  : "No contacts with phone numbers found on device"}
              </Text>
            </View>
          ) : (
            <SectionList
              sections={filteredSections}
              keyExtractor={(item) => item.id}
              stickySectionHeadersEnabled
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    setIsRefreshing(true);
                    loadContacts();
                  }}
                  tintColor={theme.colors.primary}
                />
              }
              renderSectionHeader={({ section }) => (
                <SectionHeader title={section.title} />
              )}
              renderItem={({ item, index, section }) => (
                <ContactRow
                  item={item}
                  isSelected={selectedContacts.some((s) => s.id === item.id)}
                  onToggle={toggleContact}
                  isLast={index === section.data.length - 1}
                />
              )}
            />
          )}
        </>
      ) : (
        /* TAB 2: CONTACT GROUPS */
        <View style={styles.groupsContainer}>
          {/* Create Group Button */}
          <TouchableOpacity
            style={styles.createGroupCTA}
            activeOpacity={0.8}
            onPress={() => setShowCreateGroup(true)}
          >
            <View style={styles.createGroupIconBox}>
              <IconPlus size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.createGroupCTATitle}>
                Create New Group
              </Text>
              <Text style={styles.createGroupCTASubtitle}>
                Import CSV file or paste bulk phone numbers
              </Text>
            </View>
          </TouchableOpacity>

          {loadingGroups ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconBox}>
                <IconContacts size={28} color={theme.colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No contact groups yet</Text>
              <Text style={styles.emptySubtitle}>
                Create reusable contact groups by importing a CSV file or
                pasting bulk phone numbers.
              </Text>
            </View>
          ) : (
            <FlatList
              data={groups}
              keyExtractor={(g) => g.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.groupsList}
              renderItem={({ item }) => (
                <GroupCard
                  group={item}
                  onPress={(g) => setSelectedGroup(g)}
                  onDelete={handleDeleteGroup}
                />
              )}
            />
          )}
        </View>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={() => {
          loadGroupsList();
        }}
      />

      {/* View/Manage Group Members Modal */}
      <GroupMembersModal
        group={selectedGroup}
        visible={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        onSelectForCompose={handleUseGroupInCompose}
        onMemberRemoved={loadGroupsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentedContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: theme.colors.bg,
  },
  segmentedTabBar: {
    flexDirection: "row",
    backgroundColor: theme.colors.cardSubtle,
    borderRadius: theme.radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentedTabActive: {
    backgroundColor: theme.colors.card,
    ...theme.shadow.sm,
  },
  segmentedTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  segmentedTabTextActive: {
    color: theme.colors.primary,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: theme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 10,
  },
  listContent: {
    paddingBottom: 40,
  },
  groupsContainer: {
    flex: 1,
    padding: 16,
    gap: 14,
  },
  createGroupCTA: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...theme.shadow.sm,
  },
  createGroupIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  createGroupCTATitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  createGroupCTASubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  groupsList: {
    gap: 10,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
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
});
