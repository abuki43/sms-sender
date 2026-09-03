import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
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
import { IconSend } from "../../../components/Icons";
import { MessageComposerCard } from "../../../components/compose/MessageComposerCard";
import { RecipientsPreviewCard } from "../../../components/compose/RecipientsPreviewCard";
import { SimSelectorCard } from "../../../components/compose/SimSelectorCard";
import { DelaySettingCard } from "../../../components/compose/DelaySettingCard";
import {
  SendConfirmModal,
  PermissionModal,
} from "../../../components/compose/Modals";

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
        <MessageComposerCard
          message={message}
          onChange={setMessage}
          charCount={charCount}
          charLimit={charLimit}
          hasUnicode={hasUnicode}
          parts={parts}
        />

        <RecipientsPreviewCard
          recipients={recipients}
          onPress={() => router.push("/(tabs)/contacts")}
        />

        <SimSelectorCard
          sims={sims}
          selectedSimId={simId}
          onSelectSim={setSimId}
        />

        <DelaySettingCard delay={delay} onChangeDelay={setDelay} />

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

      <SendConfirmModal
        visible={confirming}
        recipientCount={recipients.length}
        delay={delay}
        onConfirm={() => {
          setConfirming(false);
          startSend();
        }}
        onCancel={() => setConfirming(false)}
      />

      <PermissionModal
        visible={permissionDenied}
        onClose={() => setPermissionDenied(false)}
      />
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
});
