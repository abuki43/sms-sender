# Bulk SMS App — Implementation Plan

## Goal

Build an Android mobile app that sends the **same SMS message** to **multiple phone numbers simultaneously** using the **phone's own SIM card(s)** — just like the default messaging app but in bulk. Distribution via APK sideloading (not Google Play Store).

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Expo SDK 54+ / React Native 0.81+ | JS/TS ecosystem, dev builds support custom native modules |
| UI | Tamagui v2 (RC) | Full design system: Button, Select, Dialog, Toast, Sheet, dark mode |
| SMS Engine | Custom Expo Module (Kotlin) | Every existing npm package is broken/abandoned; native code is ~150 lines |
| Navigation | Expo Router | Standard for Expo apps, tab + stack pattern |
| Storage | expo-sqlite | Send history persistence (AsyncStorage has 6MB limit — insufficient) |
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
│  │  Lives outside component tree (survives nav)    │  │
│  └───────────────────┬────────────────────────────┘  │
│                      │ NativeModule calls             │
│  ┌───────────────────▼────────────────────────────┐  │
│  │  Custom Expo Module: expo-sim-sms (Kotlin)      │  │
│  │  getSimCards() / sendSms() / sendMultipartSms() │  │
│  │  BroadcastReceiver for sent/delivered status     │  │
│  │  Registered with RECEIVER_NOT_EXPORTED (API 33+) │  │
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
  android/src/main/AndroidManifest.xml   # Module manifest (permissions, receiver declarations)
  expo-module.config.json     # Module registration for autolinking
  package.json                # NPM package metadata with peerDependencies
```

### `expo-module.config.json` (Complete)

This file is required for autolinking. Without the correct content, the module silently will not be found at runtime:

```json
{
  "platforms": ["android"],
  "android": {
    "modules": ["expo.modules.simsms.ExpoSimSmsModule"]
  }
}
```

### `package.json` (for local module)

```json
{
  "name": "expo-sim-sms",
  "version": "0.1.0",
  "peerDependencies": {
    "expo": "*",
    "expo-modules-core": "*"
  }
}
```

### Exposed API to JavaScript

| Function | Signature | Description |
|---|---|---|
| `getSimCards()` | `-> SimCard[]` | Returns `{ id, displayName, slotIndex, carrierName }` for each SIM |
| `sendSms(phone, message, simSubscriptionId)` | `-> { status, errorCode? }` | Sends single SMS. Resolves when `sentIntent` fires. Rejects on error. |
| `sendMultipartSms(phone, message, simSubscriptionId)` | `-> { status, partCount, errorCode? }` | Auto-splits message via `divideMessage()`, sends via `sendMultipartTextMessage()`. |
| `onSmsStatus` (event) | `(event) -> void` | Broadcasts delivery status: `{ phone, status: 'sent' \| 'delivered' \| 'failed', errorCode? }` |

### Key Kotlin Implementation Details

**Dual SIM (correct modern API — version-branched):**
```kotlin
// SubscriptionManager — use getSystemService, NOT deprecated from()
val subscriptionManager = context.getSystemService(SubscriptionManager::class.java)
val subscriptions = subscriptionManager?.activeSubscriptionInfoList
val subId = subscriptions?.get(slotIndex)?.subscriptionId

// SmsManager — version-branched for API 31+ compatibility
val smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    context.getSystemService(SmsManager::class.java).createForSubscriptionId(subId)
} else {
    @Suppress("DEPRECATION")
    SmsManager.getSmsManagerForSubscriptionId(subId)
}
```

**Long messages (>160 chars):**
```kotlin
val parts: ArrayList<String> = smsManager.divideMessage(message)
smsManager.sendMultipartTextMessage(phone, null, parts, sentIntents, null)
```

**PendingIntent — correct flags per intent type:**
```kotlin
// Sent intent: IMMUTABLE is correct (result communicated via resultCode)
val sentIntent = PendingIntent.getBroadcast(context, uniqueRequestId, sentIntent, PendingIntent.FLAG_IMMUTABLE)

// Delivery intent: MUTABLE required — system adds PDU extras for delivery report
val deliveredIntent = PendingIntent.getBroadcast(context, uniqueRequestId, deliveredIntent, PendingIntent.FLAG_MUTABLE)
```

**Unique request codes** — use an `AtomicInteger` counter to avoid PendingIntent collision on concurrent sends:
```kotlin
private val requestCodeCounter = AtomicInteger(0)
val requestId = requestCodeCounter.getAndIncrement()
```

**BroadcastReceiver registration (API 33+ compliant):**
```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    context.registerReceiver(receiver, intentFilter, Context.RECEIVER_NOT_EXPORTED)
} else {
    context.registerReceiver(receiver, intentFilter)
}
```

**Receiver cleanup** — unregister in `OnDestroy()`:
```kotlin
override fun definition() = ModuleDefinition {
    // ...
    OnDestroy {
        receivers.forEach { context.unregisterReceiver(it) }
    }
}
```

**Timeout handling** — use a Handler with postDelayed for 30s timeout per send:
```kotlin
handler.postDelayed({
    if (!sentPromise.isCompleted) {
        sentPromise.resolve(Bundle().apply {
            putString("status", "failed")
            putString("errorCode", "TIMEOUT")
        })
        context.unregisterReceiver(receiver)
    }
}, 30_000)
```

### Android Permissions

Required in `app.json` (no custom config plugin needed):
```json
{
  "expo": {
    "android": {
      "permissions": [
        "android.permission.SEND_SMS",
        "android.permission.READ_PHONE_STATE"
      ]
    }
  }
}
```

Note: `READ_PHONE_NUMBERS` is a **system signature permission** and will silently fail on sideloaded apps. It is NOT needed — `READ_PHONE_STATE` + `SubscriptionManager` provides all subscription info.

Runtime permission request in JS for `SEND_SMS` before first send.

---

## Bulk Send Orchestrator (TypeScript)

**File:** `lib/bulk-send.ts` + `hooks/useBulkSend.ts`

### Core Orchestrator (`lib/bulk-send.ts`)

This is a **singleton class** that lives outside the React component tree, so it survives navigation changes and app backgrounding:

```
BulkSendOrchestrator (singleton):
  State:
    - queue: SendJob[]
    - isRunning: boolean
    - isPaused: boolean
    - perRecipientStatus: Map<string, SendStatus>

  Methods:
    - start(recipients, message, simSlot, delayMs)
    - pause() / resume() / cancel()
    - retryFailed()

  Logic:
    - Process queue one-by-one with configurable delay (default 2000ms)
    - Per-message: call sendSms or sendMultipartSms based on message.length
      (Unicode check: if any char > 0x7F, threshold is 70 not 160)
    - Track per-recipient: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed'
    - On failure: retry up to 3 times with exponential backoff (2s, 4s, 8s)
    - Android rate limit: if recipients > 25, show warning ("Android allows ~30 SMS per 30 minutes. Sending may be paused by the system.")
    - Expose EventEmitter-style progress callbacks
```

### Hook (`hooks/useBulkSend.ts`)

Subscribes to the orchestrator singleton and exposes React state:

```ts
useBulkSend()
  // Returns:
  - start(recipients, message, simSlot)
  - pause() / resume() / cancel()
  - progress: { sent, failed, total }
  - perRecipientStatus: Map<string, SendStatus>
  - isRunning: boolean
  - isPaused: boolean
```

---

## UI Screens (Tamagui)

### Screen 1: Compose (`(tabs)/compose/`)

| Element | Tamagui Component | Purpose |
|---|---|---|
| Message input | `<TextArea>` with char counter | Type message, show length. If message contains non-GSM chars (emojis, non-Latin), warn at 70 chars; else warn at 160 chars. Show "will be split into N parts" |
| SIM selector | `<Select>` or custom bottom sheet | Show available SIMs from `getSimCards()`, pick which to send from |
| Recipients count badge | `<Badge>` | "N contacts selected" — tap to go to contacts screen |
| Send button | `<Button>` | Triggers `useBulkSend().start(...)` — disabled if no recipients or no message |
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
| Per-recipient list | Name, phone, status icon (sent, delivered, failed, queued) |
| Cancel / Pause button | Control the send queue via orchestrator |
| Retry failed button | Re-queue failed messages |

### Screen 4: History (`(tabs)/history/`)

Uses `expo-sqlite` to persist:
- Sent message text, timestamp, recipient list, per-recipient status summary

### State Management

Selected contacts and send state are managed by:
- **Zustand store** (or React Context) for selected contacts list
- **BulkSendOrchestrator singleton** for in-flight send state (survives navigation)
- **expo-sqlite** for history persistence

---

## Permissions Flow

On first launch (and before first send):

1. Request `READ_CONTACTS` — needed for contact picker
2. Request `SEND_SMS` — needed to send. Show explanation dialog first: "This app needs SMS permission to send messages via your SIM card"
3. Request `READ_PHONE_STATE` — needed for dual SIM
4. Store `hasRequestedPermissions` flag in AsyncStorage so we don't re-ask unnecessarily

Note: On Android 15+ sideloaded apps, `SEND_SMS` is a **restricted permission**. The toggle is greyed out in Settings. User must go to: App Info -> (three-dot menu) -> "Allow restricted settings", then grant SMS permission. Show a help dialog explaining this if permission is denied.

---

## File Structure (Full Project)

```
bulk-sms-app/
  app.json                    # Expo config + Android permissions
  babel.config.js             # @tamagui/babel-plugin (REQUIRED)
  metro.config.js             # Tamagui resolveRequest hook (REQUIRED, not optional)
  tamagui.config.ts           # Default config v5
  eas.json                    # EAS build profiles
  .npmrc                      # legacy-peer-deps=true (for Tamagui peer dep conflicts)
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
    useBulkSend.ts            # React hook wrapping orchestrator singleton
    usePermissions.ts         # Permission request logic
    useContacts.ts            # Contact reading + state
  lib/
    bulk-send.ts              # BulkSendOrchestrator singleton (queue/throttle/retry)
    storage.ts                # expo-sqlite helpers
    constants.ts              # SMS limits, delays, char thresholds
    error-handler.ts          # Global error boundary + try/catch wrappers
  modules/
    expo-sim-sms/             # Custom Expo Module (Kotlin)
      android/
        src/main/
          java/expo/modules/simsms/
            ExpoSimSmsModule.kt
            SmsService.kt
            SimCardHelper.kt
          AndroidManifest.xml
        build.gradle          # Depends on expo-modules-core
      expo-module.config.json
      package.json
  docs/
    IMPLEMENTATION_PLAN.md    # This file
```

---

## Metro Config (REQUIRED for Tamagui)

The Tamagui metro resolveRequest hook is **not optional** — without it, Tamagui loads web ESM builds on Android, causing blank screens or crashes:

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Tamagui resolveRequest is required for SDK 54+
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tamagui' || moduleName.startsWith('@tamagui/')) {
    return context.resolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
```

---

## Android-Specific Gotchas and Solutions

| Gotcha | Solution |
|---|---|
| Android SMS rate limit (~30 SMS per 30 minutes, per-app) | Warn user before batches >25. This is Android OS limit (SmsUsageMonitor), NOT carrier throttling. Multi-part messages count each part separately. |
| `SmsManager.getDefault()` fails on multi-SIM | Always use `createForSubscriptionId(subId)` with version branch (see Kotlin code above) |
| `SubscriptionManager.from()` deprecated API 28+ | Use `context.getSystemService(SubscriptionManager::class.java)` |
| Messages >160 chars truncated silently | Always use `sendMultipartSms` path via `divideMessage()` |
| Unicode messages (emojis) — 70 char limit vs 160 | `divideMessage()` handles this automatically. UI char counter must also check for non-GSM chars and adjust threshold. |
| Background process killed (Android 8+) | For MVP: keep app foregrounded during send. Phase 2: add foreground service. |
| `SEND_SMS` is "restricted" on Android 15+ sideloaded apps | Show user instructions: "Allow restricted settings" in app info. ADB fallback: `adb shell cmd appops set <pkg> ACCESS_RESTRICTED_SETTINGS allow` |
| `SENT` broadcast not firing (timeout) | Implement 30s timeout via `Handler.postDelayed`, resolve as 'failed' with TIMEOUT error code |
| PendingIntent collision on concurrent sends | Use `AtomicInteger` counter for unique request codes per send |
| BroadcastReceiver not unregistered (memory leak) | Unregister in Expo Module's `OnDestroy()` handler |
| Delivery intent needs PDU extras | Use `FLAG_MUTABLE` for delivery PendingIntent (not IMMUTABLE) |
| OEM restrictions (Xiaomi, Huawei, Samsung) | Test on multiple devices. Document known issues. |
| `POST_NOTIFICATIONS` permission (Android 13+) | Only needed if implementing foreground service (Phase 2). Add to manifest then. |

---

## Build & Run Commands

```bash
# Initial setup
npx create-expo-app bulk-sms-app --template expo-template-blank-typescript
cd bulk-sms-app
npx expo install tamagui @tamagui/config expo-dev-client expo-router expo-contacts expo-sqlite
npx expo prebuild --clean

# Development
npx expo run:android          # Build and run on connected device
npx expo start --dev-client   # Start dev server for hot reload

# Production APK (local build)
eas build -p android --profile production --local
# OR
cd android && ./gradlew assembleRelease
```

### Build Requirements

- Android SDK 34+ (SDK 54 targets API 34)
- JDK 17 (required by React Native 0.81)
- NDK installed (needed for native builds)
- `.npmrc` with `legacy-peer-deps=true` (Tamagui peer dep conflict with RN 0.81)
- Correct `expo-module.config.json` in custom module (see above)

---

## Testing Plan

1. **Single SIM test** — Send SMS to one number, verify it arrives
2. **Dual SIM test** — If device has dual SIM, verify SIM selection works and correct SIM sends
3. **Long message test** — Send >160 chars, verify multipart delivery (all parts arrive in order)
4. **Unicode message test** — Send message with emojis, verify correct splitting at 70 chars
5. **Bulk test** — Send to 5 contacts with 2s delay, verify all arrive
6. **Cancel test** — Start bulk send, cancel mid-way, verify it stops
7. **Rate limit test** — Send 30+ messages, observe Android's SmsUsageMonitor dialog
8. **Permission denial test** — Deny SMS permission, verify graceful error message
9. **No SIM test** — Remove SIM, verify error is caught and reported
10. **Background test** — Minimize app mid-send (MVP: verify it pauses gracefully)
11. **Unicode char counter test** — Type emojis, verify char limit adjusts from 160 to 70

---

## Estimated Timeline

| Phase | Work | Days |
|---|---|---|
| Phase 0 | Project scaffold + Tamagui setup + verify runs on device | 1-2 |
| Phase 1 | Custom SMS Expo Module (Kotlin) + test SMS on device | 2-3 |
| Phase 2 | Bulk send orchestrator (TypeScript) + SQLite history | 1-2 |
| Phase 3 | UI screens (Tamagui) — Compose, Contacts, Progress, History | 3-4 |
| Phase 4 | Permissions flow + edge cases + APK build + device testing | 1-2 |
| **Total** | | **~8-13 days** |

---

## Known Limitations (MVP)

- **No background sending** — Sends stop if app is backgrounded (foreground service deferred to Phase 2)
- **No iOS support** — Apple blocks programmatic SMS from third-party apps entirely
- **No delivery guarantee** — SmsManager is fire-and-forget; delivery reports are best-effort
- **30 SMS/30min OS limit** — Android's SmsUsageMonitor shows a confirmation dialog at this threshold

---

## Future Enhancements (Post-MVP)

- Foreground service for background sending (requires `FOREGROUND_SERVICE` permission, notification channel, ~150 extra lines of Kotlin)
- CSV/Excel import for contact lists
- Message templates with variable placeholders ({name}, {phone})
- Scheduled SMS (send at specific time via WorkManager)
- Contact groups management
- Send history with analytics
- Export send logs
- Delivery report export

---

## Appendix A: Review Findings (Fixed)

The following issues were identified during plan review and have been corrected above:

| # | Issue Found | Severity | Fix Applied |
|---|---|---|---|
| 1 | `expo-module.config.json` contents not specified | Critical | Added full JSON content |
| 2 | `SmsManager.getSmsManagerForSubscriptionId()` deprecated API 31+ | High | Replaced with `getSystemService().createForSubscriptionId()` with version branch |
| 3 | `SubscriptionManager.from()` deprecated API 28 | Medium | Replaced with `getSystemService(SubscriptionManager::class.java)` |
| 4 | Delivery PendingIntent needs `FLAG_MUTABLE`, not `FLAG_IMMUTABLE` | High | Corrected: IMMUTABLE for sent, MUTABLE for delivered |
| 5 | Missing unique request codes for concurrent PendingIntents | High | Added `AtomicInteger` counter pattern |
| 6 | BroadcastReceiver missing `RECEIVER_NOT_EXPORTED` for API 33+ | High | Added version-branched registration |
| 7 | BroadcastReceiver never unregistered (memory leak) | High | Added `OnDestroy()` cleanup |
| 8 | `READ_PHONE_NUMBERS` is system-only permission | High | Removed from permissions list |
| 9 | Missing `POST_NOTIFICATIONS` permission | Medium | Added note (only needed for foreground service in Phase 2) |
| 10 | Foreground service plan had zero implementation detail | Critical | Deferred to Phase 2; MVP keeps app foregrounded |
| 11 | No timeout handling for sentIntent | High | Added 30s Handler.postDelayed pattern |
| 12 | No error boundary / crash handling strategy | Critical | Added error-handler.ts to file structure |
| 13 | No data flow between screens | Critical | Added Zustand store + orchestrator singleton pattern |
| 14 | Tamagui metro config was "optional" | High | Changed to REQUIRED with code example |
| 15 | 30 SMS/30min mislabeled as "carrier throttling" | Low | Corrected: Android OS per-app limit (SmsUsageMonitor) |
| 16 | Unicode char counter not handled | Medium | Added non-GSM char detection, threshold adjusts to 70 |
| 17 | AsyncStorage 6MB limit insufficient for history | Medium | Switched to expo-sqlite from the start |
| 18 | Missing `build.gradle` for module | High | Added to file structure |
| 19 | Missing `.npmrc` for peer dep conflicts | Medium | Added to file structure and build requirements |
| 20 | Tamagui v2 is RC, not stable | Medium | Noted in tech stack; `.npmrc` legacy-peer-deps needed |
