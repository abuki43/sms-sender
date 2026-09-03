import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";
import { IconSearch, IconClose } from "../Icons";

interface ContactSearchBarProps {
  search: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

export function ContactSearchBar({
  search,
  onChangeText,
  onClear,
}: ContactSearchBarProps) {
  return (
    <View style={styles.searchBar}>
      <IconSearch size={18} color={theme.colors.textMuted} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or number..."
        placeholderTextColor={theme.colors.textMuted}
        value={search}
        onChangeText={onChangeText}
        clearButtonMode="while-editing"
      />
      {search ? (
        <TouchableOpacity onPress={onClear}>
          <IconClose size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
