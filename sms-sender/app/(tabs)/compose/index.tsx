import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useContactsStore } from "../../../stores/contacts";
import { useBulkSend } from "../../../hooks/useBulkSend";
import { requestSmsPermissions } from "../../../lib/permissions";
import { SimCard } from "../../../modules/expo-sim-sms/src";
import { RATE_LIMIT_WARNING_THRESHOLD } from "../../../lib/constants";
import { theme } from "../../../lib/theme";
import { AppHeader } from "../../../components/AppHeader";
import { Badge } from "../../../components/Badge";
import {
  IconContacts,
  IconSim,
  IconSend,
  IconCheck,
  IconChevronRight,
  IconWarning,
} from "../../../components/Icons";

export default function ComposeScreen() {
  const [message, setMessage] = useState("");
  const [delay, setDelay] = useState(2.0);
  const [sims, setSims] = useState<SimCard[]>([]);
  const [simId, setSimId] = useState<string>("default");
  const [confirming, setConfirming] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const router = useRouter();
  const selectedContacts = useContactsStore((s) => s.selectedContacts);
  const { start, getSimCards } = useBulkSend();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cards = await getSimCards();
        if (active && cards.length > 0) {
          setSims(cards);
          if (cards[0]) {
            setSimId(cards[0].id.toString());
          }
        }
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [getSimCards]);

  const charCount = message.length;
  const hasUnicode = /[^\x00-\x7F]/.test(message);
  const charLimit = hasUnicode ? 70 : 160;
  const parts = charCount > 0 ? Math.ceil(charCount / charLimit) : 0;
  const rateLimited = selectedContacts.length >= RATE_LIMIT_WARNING_THRESHOLD;

  const selectedSim = sims.find((s) => s.id.toString() === simId);
  const recipients = useMemo(() => {
    return selectedContacts
      .map((c) => ({
        id: c.id,
        name: c.name,
        phone:
          c.phoneNumbers?.find((p) => p.isPrimary)?.number ??
          c.phoneNumbers?.[0]?.number ??
          "",
      }))
      .filter((r) => r.phone.length > 0);
  }, [selectedContacts]);

  const canSend = message.trim().length > 0 && recipients.length > 0;

  const startSend = async () => {
    const perm = await requestSmsPermissions();
    if (perm.status !== "granted") {
      setPermissionDenied(true);
      return;
    }
    start({
      recipients,
      message,
      simSubscriptionId: selectedSim?.subscriptionId,
      delayMs: Math.round(delay * 1000),
    });
    router.push("/progress");
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Compose"
        subtitle="Send SMS in bulk via your phone's SIM"
        rightElement={
          <Badge variant="primary" size="sm">
            {sims.length > 0 ? `${sims.length} SIM active` : "1 SIM active"}
          </Badge>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Message Composer Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>MESSAGE CONTENT</Text>
            {hasUnicode ? (
              <Badge variant="warning" size="sm">
                Unicode (70 char limit)
              </Badge>
            ) : (
              <Badge variant="sand" size="sm">
                GSM 7-bit (160 char limit)
              </Badge>
            )}
          </View>

          <TextInput
            style={styles.textArea}
            placeholder="Type your SMS message here..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={5}
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />

          <View style={styles.composerFooter}>
            <Text
              style={[
                styles.charCounter,
                charCount > charLimit && { color: theme.colors.error },
              ]}
            >
              {charCount} / {charLimit} chars
            </Text>

            {parts > 1 ? (
              <Badge variant="warning" size="sm">
                {parts} SMS parts
              </Badge>
            ) : null}
          </View>
        </View>

        {/* 2. Recipients Selection Card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/contacts")}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>RECIPIENTS</Text>
            <View style={styles.rowCentered}>
              <Text style={styles.cardActionText}>Edit</Text>
              <IconChevronRight size={14} color={theme.colors.primaryMuted} />
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
                  <Text style={styles.emptyRecipientSubtitle}>
                    Tap to choose recipients from address book
                  </Text>
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
                    {recipients.map((r) => r.name).join(", ")}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* 3. SIM Selector Card */}
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
                const isSelected = simId === s.id.toString();
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.simTile,
                      isSelected && styles.simTileActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSimId(s.id.toString())}
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

        {/* 4. Delay Setting Card */}
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
            {[1.0, 2.0, 3.0, 5.0].map((val) => {
              const active = delay === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.delayPill,
                    active && styles.delayPillActive,
                  ]}
                  onPress={() => setDelay(val)}
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

        {/* 5. Primary Action Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            !canSend && styles.primaryButtonDisabled,
          ]}
          disabled={!canSend}
          activeOpacity={0.8}
          onPress={() => {
            if (rateLimited) {
              setConfirming(true);
            } else {
              startSend();
            }
          }}
        >
          <IconSend size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            {recipients.length === 0
              ? "Select contacts to send"
              : `Send to ${recipients.length} ${
                  recipients.length === 1 ? "contact" : "contacts"
                }`}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={confirming} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <IconWarning size={24} color={theme.colors.warning} />
            </View>
            <Text style={styles.modalTitle}>Large Send Confirmation</Text>
            <Text style={styles.modalMessage}>
              You are about to send to {recipients.length} recipients. To protect
              your SIM against carrier spam restrictions, a {delay}s delay is
              applied between each message.
            </Text>
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setConfirming(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => {
                  setConfirming(false);
                  startSend();
                }}
              >
                <Text style={styles.modalConfirmText}>Proceed & Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Permission Needed Modal */}
      <Modal visible={permissionDenied} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconBox, { backgroundColor: theme.colors.errorBg }]}>
              <IconWarning size={24} color={theme.colors.error} />
            </View>
            <Text style={styles.modalTitle}>SMS Permission Required</Text>
            <Text style={styles.modalMessage}>
              SMS Sender needs permission to access your SIM card and dispatch
              messages. Please grant SMS and Phone permissions in Settings.
            </Text>
            <TouchableOpacity
              style={[styles.modalConfirmButton, { width: "100%" }]}
              onPress={() => setPermissionDenied(false)}
            >
              <Text style={styles.modalConfirmText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
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
  textArea: {
    backgroundColor: theme.colors.primaryUltraLight,
    borderRadius: theme.radius.md,
    padding: 12,
    fontSize: 15,
    color: theme.colors.textPrimary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    lineHeight: 22,
  },
  composerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  charCounter: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "500",
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
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
    ...theme.shadow.md,
  },
  primaryButtonDisabled: {
    backgroundColor: "#C9BEB3",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(32, 22, 16, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: 22,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.lg,
  },
  modalIconBox: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.warningBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
