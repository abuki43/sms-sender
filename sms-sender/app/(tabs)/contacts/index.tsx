import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
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
import { IconContacts, IconRefresh } from "../../../components/Icons";
import { ContactSearchBar } from "../../../components/contacts/ContactSearchBar";
import { ContactActionBar } from "../../../components/contacts/ContactActionBar";
import {
  ContactRow,
  ContactItem,
} from "../../../components/contacts/ContactRow";
import { SectionHeader } from "../../../components/contacts/SectionHeader";

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
  listContent: {
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
