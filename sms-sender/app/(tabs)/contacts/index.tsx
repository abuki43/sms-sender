import { useState, useEffect, useCallback, useLayoutEffect } from "react";
import { SectionList, ActivityIndicator } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Input,
  Checkbox,
  Button,
  H3,
  Paragraph,
} from "tamagui";
import { useNavigation } from "expo-router";
import * as Contacts from "expo-contacts/legacy";
import { useContactsStore } from "../../../stores/contacts";

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
  const navigation = useNavigation();
  const { selectedContacts, toggleContact, selectAll, clearAll } =
    useContactsStore();

  const loadContacts = useCallback(async () => {
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
          !!c.name && !!c.phoneNumbers && c.phoneNumbers.length > 0 && !!c.id
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
      const letter = contact.name[0].toUpperCase();
      if (!sectionMap.has(letter)) sectionMap.set(letter, []);
      sectionMap.get(letter)!.push(contact);
    }

    const result: Section[] = Array.from(sectionMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, data]) => ({ title, data }));

    setSections(result);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        const onRefresh = () => {
          setIsRefreshing(true);
          loadContacts();
        };
        return (
          <Button
            chromeless
            size="$4"
            onPress={onRefresh}
            disabled={isRefreshing}
            ml="$2"
            mr="$2"
            aria-label="Refresh contacts"
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text fontSize={20}>🔄</Text>
            )}
          </Button>
        );
      },
    });
  }, [navigation, loadContacts, isRefreshing]);

  const filteredSections = search
    ? sections
        .map((s) => ({
          ...s,
          data: s.data.filter((c) =>
            c.name.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((s) => s.data.length > 0)
    : sections;

  const allVisible = filteredSections.flatMap((s) => s.data);
  const allSelected =
    allVisible.length > 0 &&
    allVisible.every((c) => selectedContacts.some((s) => s.id === c.id));

  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center">
        <ActivityIndicator size="large" />
        <Paragraph mt="$2">Loading contacts...</Paragraph>
      </YStack>
    );
  }

  return (
    <YStack flex={1} p="$4">
      <Input
        placeholder="Search contacts..."
        value={search}
        onChangeText={setSearch}
        mb="$3"
      />

      <XStack justify="space-between" items="center" mb="$3">
        <Paragraph size="$2" color="$gray10">
          {selectedContacts.length} selected
        </Paragraph>
        <XStack gap="$2">
          <Button size="$2" onPress={allSelected ? clearAll : () => selectAll(allVisible)}>
            {allSelected ? "Deselect All" : "Select All"}
          </Button>
        </XStack>
      </XStack>

      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <YStack
            bg="$gray3"
            px="$3"
            py="$1"
          >
            <Text fontWeight="bold" fontSize={14}>
              {section.title}
            </Text>
          </YStack>
        )}
        renderItem={({ item }) => {
          const isSelected = selectedContacts.some((s) => s.id === item.id);
          return (
            <XStack
              p="$3"
              gap="$3"
              items="center"
              pressStyle={{ bg: "$gray4" }}
              onPress={() => toggleContact(item)}
            >
              <Checkbox checked={isSelected} onCheckedChange={() => toggleContact(item)} />
              <YStack flex={1}>
                <Text fontWeight="500">{item.name}</Text>
                <Paragraph size="$2" color="$gray10">
                  {item.phoneNumbers.find((p) => p.isPrimary)?.number ??
                    item.phoneNumbers[0]?.number}
                </Paragraph>
              </YStack>
            </XStack>
          );
        }}
      />
    </YStack>
  );
}
