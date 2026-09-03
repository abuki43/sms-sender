import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import * as Contacts from "expo-contacts/legacy";
import { useContactsStore } from "../../../stores/contacts";
import { theme } from "../../../lib/theme";
import { AppHeader } from "../../../components/AppHeader";
import { Badge } from "../../../components/Badge";
import {
  IconSearch,
  IconClose,
  IconCheck,
  IconContacts,
  IconRefresh,
} from "../../../components/Icons";

interface ContactItem {
  id: string;
  name: string;
  phoneNumbers: { number: string; isPrimary: boolean }[];
}

interface Section {
  title: string;
  data: ContactItem[];
}

export default function ContactsScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const { selectedContacts, toggleContact, selectAll, clearAll } =
    useContactsStore();

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

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

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
        title="Contacts"
        subtitle="Select recipients from your address book"
        rightElement={
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setIsRefreshing(true);
              loadContacts();
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

      {/* Search & Action Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <IconSearch size={18} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or number..."
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <IconClose size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.actionBar}>
          <Badge variant="primary" size="md">
            {selectedContacts.length}{" "}
            {selectedContacts.length === 1 ? "contact selected" : "contacts selected"}
          </Badge>

          {allVisible.length > 0 && (
            <TouchableOpacity
              style={styles.selectToggleBtn}
              activeOpacity={0.7}
              onPress={allSelected ? clearAll : () => selectAll(allVisible)}
            >
              <Text style={styles.selectToggleText}>
                {allSelected ? "Deselect All" : "Select All"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main List */}
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
            <View style={styles.sectionHeaderContainer}>
              <View style={styles.sectionHeaderBadge}>
                <Text style={styles.sectionHeaderText}>{section.title}</Text>
              </View>
            </View>
          )}
          renderItem={({ item, index, section }) => {
            const isSelected = selectedContacts.some((s) => s.id === item.id);
            const isLast = index === section.data.length - 1;
            const primaryNumber =
              item.phoneNumbers.find((p) => p.isPrimary)?.number ??
              item.phoneNumbers[0]?.number ??
              "";

            const initials = item.name
              .split(" ")
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <TouchableOpacity
                style={[
                  styles.contactRow,
                  isSelected && styles.contactRowSelected,
                  isLast && { borderBottomWidth: 0 },
                ]}
                activeOpacity={0.7}
                onPress={() => toggleContact(item)}
              >
                {/* Initials Avatar */}
                <View
                  style={[
                    styles.avatarBubble,
                    isSelected && { backgroundColor: theme.colors.primaryLight },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarInitials,
                      isSelected && { color: theme.colors.primary },
                    ]}
                  >
                    {initials || "#"}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.contactPhone} numberOfLines={1}>
                    {primaryNumber}
                  </Text>
                </View>

                {/* Circular Checkbox */}
                <View
                  style={[
                    styles.checkboxCircle,
                    isSelected && styles.checkboxCircleSelected,
                  ]}
                >
                  {isSelected ? <IconCheck size={12} color="#FFFFFF" /> : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: theme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
    ...theme.shadow.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    height: "100%",
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  selectToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeaderContainer: {
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sectionHeaderBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.cardSubtle,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primaryMuted,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 14,
  },
  contactRowSelected: {
    backgroundColor: theme.colors.primaryUltraLight,
  },
  avatarBubble: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.primaryMuted,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCircleSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
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
