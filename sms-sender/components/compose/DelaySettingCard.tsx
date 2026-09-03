import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../../lib/theme";
import { Badge } from "../Badge";

interface DelaySettingCardProps {
  delay: number;
  onChangeDelay: (val: number) => void;
}

const DELAY_OPTIONS = [1.0, 2.0, 3.0, 5.0];

export function DelaySettingCard({
  delay,
  onChangeDelay,
}: DelaySettingCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>SENDING SPEED & DELAY</Text>
        <Badge variant="sand" size="sm">
          {delay.toFixed(1)}s delay
        </Badge>
      </View>

      <Text style={styles.delayDescription}>
        A delay between dispatches prevents carrier rate limits and safeguards
        delivery.
      </Text>

      <View style={styles.delayButtonRow}>
        {DELAY_OPTIONS.map((val) => {
          const active = delay === val;
          return (
            <TouchableOpacity
              key={val}
              style={[styles.delayPill, active && styles.delayPillActive]}
              onPress={() => onChangeDelay(val)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.delayPillText,
                  active && styles.delayPillTextActive,
                ]}
              >
                {val.toFixed(1)}s
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
  delayDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  delayButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  delayPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.cardSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  delayPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  delayPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  delayPillTextActive: {
    color: "#FFFFFF",
  },
});
