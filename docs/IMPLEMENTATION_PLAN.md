# Bulk SMS App — Implementation Plan

## Goal

Build an Android mobile app that sends the **same SMS message** to **multiple phone numbers simultaneously** using the **phone's own SIM card(s)** — just like the default messaging app but in bulk. Distribution via APK sideloading (not Google Play Store).

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Expo SDK 54+ / React Native 0.81+ | JS/TS ecosystem, dev builds support custom native modules |
| UI | Tamagui v2 | Full design system: Button, Select, Dialog, Toast, Sheet, dark mode |
| SMS Engine | Custom Expo Module (Kotlin) | Every existing npm package is broken/abandoned; native code is ~150 lines |
| Navigation | Expo Router | Standard for Expo apps, tab + stack pattern |
| Distribution | APK sideload | Avoids Google Play's strict SMS permission policy |

---

## Why Not Use an Existing Package

Deep research confirmed every npm package fails at least two core requirements (bulk send, long messages, dual SIM, delivery tracking):

- **expo-sms-manager** — `sendLongSms` promise hangs forever (confirmed bug, issues disabled on repo). Only 7 commits, abandoned.
- **expo-android-sms-sender** — No multipart support; truncates messages >160 chars. Only sends to one recipient at a time.
- **expo-sms** — Opens the compose UI; user must tap Send manually. Useless for bulk sending.
- **react-native-get-sms-android** — Dead 7 years. Doesn't work with Expo.
- **react-native-sms-android** — Dead 10 years.
- **react-native-send-direct-sms** — Confirmed bugs: doesn't work with long messages, no dual SIM.
- **react-native-background-sms** — Brand new, 1 star, 5 weekly downloads, not Expo-compatible.

The Kotlin code needed is small and well-documented (SmsManager + SubscriptionManager + BroadcastReceiver). The real complexity lives in the JS orchestration layer (queue, throttle, retry, progress).

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                 Expo App (TypeScript)                 │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Tamagui UI Layer                               │  │
│  │  Compose screen / Contact list / SIM picker    │  │
│  │  Send progress / History / Toasts              │  │
│  └───────────────────┬────────────────────────────┘  │
│                      │                               │
│  ┌───────────────────▼────────────────────────────┐  │
│  │  Bulk Send Orchestrator (TypeScript)            │  │
│  │  Queue / Throttle (2s delay) / Retry / Progress │  │
│  └───────────────────┬────────────────────────────┘  │
│                      │ NativeModule calls             │
│  ┌───────────────────▼────────────────────────────┐  │
│  │  Custom Expo Module: expo-sim-sms (Kotlin)      │  │
│  │  getSimCards() / sendSms() / sendMultipartSms() │  │
│  │  BroadcastReceiver for sent/delivered status     │  │
│  └───────────────────┬────────────────────────────┘  │
└──────────────────────┼──────────────────────────────┘
                       │
               SIM Card -> Carrier -> Recipients
```

---

## Module: `expo-sim-sms` (Custom Expo Module)

### Directory Structure

```
modules/expo-sim-sms/
  android/src/main/java/expo/modules/simsms/
    ExpoSimSmsModule.kt       # Main module definition (Expo Modules API)
    SmsService.kt             # SmsManager wrapper
    SimCardHelper.kt          # SubscriptionManager for dual SIM
  expo-module.config.json     # Module registration
  package.json                # NPM package metadata
```

### Exposed API to JavaScript

| Function | Signature | Description |
|---|---|---|
| `getSimCards()` | `-> SimCard[]` | Returns `{ id, displayName, slotIndex, carrierName, phoneNumber }` for each SIM |
| `sendSms(phone, message, simSlotId)` | `-> { status, errorCode? }` | Sends single SMS via `SmsManager.createForSubscriptionId()`. Resolves when `sentIntent` fires. Rejects on error with descriptive code. |
| `sendMultipartSms(phone, message, simSlotId)` | `-> { status, partCount, errorCode? }` | Auto-splits message using `divideMessage()`, sends via `sendMultipartTextMessage()`. For messages >160 chars. |
| `onSmsStatus` (event) | `(event) -> void` | Broadcasts delivery status: `{ phone, status: 'sent' \| 'delivered' \| 'failed', errorCode? }` |

### Key Kotlin Implementation Details

**Dual SIM (avoid GENERIC_FAILURE):**
```kotlin
val subscriptionManager = SubscriptionManager.from(context)
val subscriptions = subscriptionManager.activeSubscriptionInfoList
val subId = subscriptions[slotIndex].subscriptionId
val smsManager = SmsManager.getSmsManagerForSubscriptionId(subId)
```

**Long messages (>160 chars):**
```kotlin
val parts: ArrayList<String> = smsManager.divideMessage(message)
smsManager.sendMultipartTextMessage(phone, null, parts, sentIntents, null)
```

**Delivery tracking:**
```kotlin
val sentIntent = PendingIntent.getBroadcast(context, id, Intent("SMS_SENT"), FLAG_IMMUTABLE)
val deliveredIntent = PendingIntent.getBroadcast(context, id, Intent("SMS_DELIVERED"), FLAG_IMMUTABLE)
```

### Android Permissions

Required in `AndroidManifest.xml` (via config plugin or manual):
```xml
<uses-permission android:name="android.permission.SEND_SMS" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.READ_PHONE_NUMBERS" />
```

Runtime permission request in JS for `SEND_SMS` before first send.

---

## Bulk Send Orchestrator (TypeScript)

**File:** `lib/bulk-send.ts` or `hooks/useBulkSend.ts`

Responsibilities:
- Receive: `{ recipients: string[], message: string, simSlot: number, delayMs: number }`
- Maintain a queue (array)
- Process one-by-one with configurable delay (default 2000ms between sends)
- Per-message: call `sendSms` or `sendMultipartSms` based on `message.length`
- Track per-recipient status: `'queued' | 'sending' | 'sent' | 'delivered' | 'failed'`
- On failure: retry up to N times with exponential backoff
- Expose: progress callback, cancel function, pause/resume
- Warning: if recipients > 30, prompt user about carrier rate limit (~30/30min)

**Hook pattern:**
```ts
useBulkSend()
  .start(recipients, message, simSlot)
  .pause()
  .resume()
  .cancel()
  // exposes: progress { sent, failed, total }, perRecipientStatus, isRunning
```

---

## UI Screens (Tamagui)

### Screen 1: Compose (`(tabs)/compose/`)

| Element | Tamagui Component | Purpose |
|---|---|---|
| Message input | `<TextArea>` with char counter | Type message, show length (warn if >160: "will be split into N parts") |
| SIM selector | `<Select>` or custom bottom sheet | Show available SIMs from `getSimCards()`, pick which to send from |
| Recipients count badge | `<Badge>` | "N contacts selected" — tap to go to contacts screen |
| Send button | `<Button>` | Triggers `useBulkSend().start(...)` — disabled if no recipients |
| Delay setting | `<Slider>` | 1-5s between sends, default 2s |

### Screen 2: Contacts (`(tabs)/contacts/`)

| Element | Purpose |
|---|---|
| Search bar | Filter contacts by name |
| `<SectionList>` (FlatList virtualized) | Show contacts grouped alphabetically |
| `<Checkbox>` per contact | Multi-select |
| "Select all" toggle | At top |
| Floating action button | "Done" — saves selection back to compose screen |

Uses `expo-contacts` to read device contacts.

### Screen 3: Send Progress (modal / pushed screen)

| Element | Purpose |
|---|---|
| Progress bar | Overall progress: `sent / total` |
| Per-recipient list | Name, phone, status icon (check sent, check delivered, x failed, clock queued) |
| Cancel / Pause button | Control the send queue |
| Retry failed button | Re-queue failed messages |

### Screen 4: History (`(tabs)/history/`)

Uses `expo-sqlite` (or AsyncStorage for MVP) to persist:
- Sent message text, timestamp, recipient list, per-recipient status summary

---

## Permissions Flow

On first launch (and before first send):

1. Request `READ_CONTACTS` — needed for contact picker
2. Request `SEND_SMS` — needed to send (show explanation dialog first: "This app needs SMS permission to send messages via your SIM card")
3. Request `READ_PHONE_STATE` + `READ_PHONE_NUMBERS` — needed for dual SIM
4. Store `hasRequestedPermissions` flag so we don't re-ask unnecessarily

---

## File Structure (Full Project)

```
bulk-sms-app/
  app.json                    # Expo config + Android permissions plugin
  babel.config.js             # Add @tamagui/babel-plugin
  metro.config.js             # Optional: Tamagui metro plugin
  tamagui.config.ts           # Default config v5
  eas.json                    # EAS build profiles
  app/
    _layout.tsx               # TamaguiProvider + Expo Router layout
    (tabs)/
      _layout.tsx             # Bottom tabs layout
      compose/
        index.tsx             # Compose + send screen
      contacts/
        index.tsx             # Contact picker screen
      history/
        index.tsx             # Send history screen
    progress.tsx              # Send progress modal
  components/
    ContactItem.tsx           # Contact list item
    SimCardPicker.tsx         # SIM card selector
    MessageComposer.tsx       # Message textarea with char count
    SendProgressItem.tsx      # Single recipient progress row
  hooks/
    useBulkSend.ts            # Bulk send orchestrator
    usePermissions.ts         # Permission request logic
    useContacts.ts            # Contact reading + state
  lib/
    bulk-send.ts              # Core queue/throttle/retry logic
    storage.ts                # AsyncStorage/SQLite helpers
    constants.ts              # SMS limits, delays, etc.
  modules/
    expo-sim-sms/             # Custom Expo Module (Kotlin)
      android/src/main/java/expo/modules/simsms/
        ExpoSimSmsModule.kt
        SmsService.kt
        SimCardHelper.kt
      android/src/main/AndroidManifest.xml
      expo-module.config.json
      package.json
  docs/
    IMPLEMENTATION_PLAN.md    # This file
```

---

## Android-Specific Gotchas and Solutions

| Gotcha | Solution |
|---|---|
| Android SMS rate limit (~30/30min) | Warn user before batches >25; throttle with configurable delay |
| `SmsManager.getDefault()` fails on multi-SIM | Always use `createForSubscriptionId(subId)` |
| Messages >160 chars truncated silently | Always use `sendMultipartSms` path via `divideMessage()` |
| Background process killed | Run sends via foreground service notification |
| `SEND_SMS` is "restricted" on Android 15+ sideloaded apps | Show user instructions: "Allow restricted settings" in app info |
| `SENT` broadcast not firing (timeout) | Implement 30s timeout in native module, resolve as 'failed' |
| OEM restrictions (Xiaomi, Huawei) | Document known issues; test on multiple devices |
| Unicode messages (emojis) — 70 char limit | Use `divideMessage()` which handles this automatically |

---

## Build & Run Commands

```bash
# Initial setup
npx create-expo-app bulk-sms-app --template expo-template-blank-typescript
cd bulk-sms-app
npx expo install tamagui @tamagui/config expo-dev-client expo-router
npx expo prebuild --clean

# Development
npx expo run:android          # Build and run on connected device
npx expo start --dev-client   # Start dev server for hot reload

# Production APK (local build)
eas build -p android --profile production --local
# OR
cd android && ./gradlew assembleRelease
```

---

## Testing Plan

1. **Single SIM test** — Send SMS to one number, verify it arrives
2. **Dual SIM test** — If device has dual SIM, verify SIM selection works and correct SIM sends
3. **Long message test** — Send >160 chars, verify multipart delivery (both parts arrive in order)
4. **Unicode message test** — Send message with emojis, verify correct splitting at 70 chars
5. **Bulk test** — Send to 5 contacts with 2s delay, verify all arrive
6. **Cancel test** — Start bulk send, cancel mid-way, verify it stops
7. **Background test** — App minimized during send, verify foreground service keeps sending
8. **Permission denial test** — Deny SMS permission, verify graceful error message
9. **No SIM test** — Remove SIM, verify error is caught and reported
10. **Rate limit test** — Send 30+ messages, observe carrier/system behavior

---

## Estimated Timeline

| Phase | Work | Days |
|---|---|---|
| Phase 0 | Project scaffold + Tamagui setup | 1-2 |
| Phase 1 | Custom SMS Expo Module (Kotlin) | 2-3 |
| Phase 2 | Bulk send orchestrator (TypeScript) | 1-2 |
| Phase 3 | UI screens (Tamagui) | 3-4 |
| Phase 4 | Permissions + polish + APK build | 1-2 |
| **Total** | | **~8-13 days** |

---

## Future Enhancements (Post-MVP)

- CSV/Excel import for contact lists
- Message templates with variable placeholders ({name}, {phone})
- Scheduled SMS (send at specific time)
- Contact groups management
- Send history with analytics
- Export send logs
- Delivery report export
