import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SimCard } from "../../modules/expo-sim-sms/src";
import { theme } from "../../lib/theme";
import { Badge } from "../Badge";
import { IconSim, IconCheck } from "../Icons";

interface SimSelectorCardProps {
  sims: SimCard[];
  selectedSimId: string;
  onSelectSim: (id: string) => void;
}

export function SimSelectorCard({
  sims,
  selectedSimId,
  onSelectSim,
}: SimSelectorCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>SEND FROM SIM</Text>
        <Badge variant="primary" size="sm">
          Carrier Direct
        </Badge>
      </View>

      {sims.length === 0 ? (
        <TouchableOpacity
          style={[styles.simTile, styles.simTileActive]}
          activeOpacity={0.8}
        >
          <View style={styles.simIconBox}>
            <IconSim size={18} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.simTitle}>Default Device SIM</Text>
            <Text style={styles.simSubtitle}>
              Uses current active mobile network
            </Text>
          </View>
          <View style={styles.simCheckCircle}>
            <IconCheck size={12} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.simTilesContainer}>
          {sims.map((s) => {
            const isSelected = selectedSimId === s.id.toString();
            return (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.simTile,
                  isSelected && styles.simTileActive,
                ]}
                activeOpacity={0.8}
                onPress={() => onSelectSim(s.id.toString())}
              >
                <View
                  style={[
                    styles.simIconBox,
                    isSelected && { backgroundColor: theme.colors.primaryLight },
                  ]}
                >
                  <IconSim
                    size={18}
                    color={
                      isSelected
                        ? theme.colors.primary
                        : theme.colors.textMuted
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.simTitle}>
                    {s.displayName || `SIM ${s.slotIndex + 1}`}
                  </Text>
                  {s.carrierName ? (
                    <Text style={styles.simSubtitle}>{s.carrierName}</Text>
                  ) : (
                    <Text style={styles.simSubtitle}>
                      Slot {s.slotIndex + 1}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.simRadioCircle,
                    isSelected && styles.simRadioCircleActive,
                  ]}
                >
                  {isSelected ? <IconCheck size={12} color="#FFFFFF" /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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
  simTilesContainer: {
    gap: 8,
  },
  simTile: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.cardSubtle,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: 12,
  },
  simTileActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryUltraLight,
  },
  simIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  simTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  simSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  simRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  simRadioCircleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  simCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
