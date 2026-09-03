# Bulk SMS App 📱

A fast, professional, offline-first Android Bulk SMS application built with **React Native (Expo SDK 54)**, **SQLite**, and a custom **native Kotlin multi-SIM module**.

---

## 🌟 Key Features

- **Multi-SIM Carrier Selection:** Automatically detects installed SIM cards (`Telebirr`, `Safaricom`, `Ethio Telecom`, etc.) and allows selecting which SIM subscription to route dispatches through.
- **Smart CSV & Text Import:** Zero-dependency CSV/TXT parser with delimiter auto-detection (`,`, `;`, `\t`, `|`), quote-escaping, and phone format sanitization.
- **Smart Paste (WhatsApp / Excel):** Paste raw phone numbers or lines like `Abebe - 0911223344` with instant contact detection and deduplication.
- **Contact Groups & Audiences:** Save custom contact lists permanently to local SQLite with 1-tap selection and group toggling in Compose.
- **Real-Time Live Dispatch Telemetry:** Live progress bar, Sent/Delivered/Failed counters, with **Pause**, **Resume**, **Cancel**, and **Retry Failed** controls.
- **Dispatch History Archive:** Offline local storage of all previous campaigns with delivery reports, group tags, and timestamps.


---

## 📁 Project Structure

```
bulk-sms-app/
└── sms-sender/
    ├── app/                           # Expo Router Screens & Orchestrators
    │   ├── (tabs)/
    │   │   ├── compose/index.tsx      # Message composer, SIM picker, group picker
    │   │   ├── contacts/index.tsx     # Segmented: Address Book & Contact Groups
    │   │   └── history/index.tsx      # Dispatch archive & delivery reports
    │   ├── progress.tsx               # Live telemetry & sending controls
    │   └── _layout.tsx                # Root layout & theme configuration
    │
    ├── components/                    # Modular Subcomponents (<100 lines each)
    │   ├── compose/                   # MessageComposer, RecipientsCard, SimSelector, Modals
    │   ├── contacts/                  # ContactSearchBar, ContactRow (memoized), ActionBar
    │   ├── groups/                    # GroupCard, CreateGroupModal, CsvImport, SmartPaste
    │   ├── history/                   # HistoryCard (memoized), HistoryModals
    │   ├── progress/                  # ProgressMetricsCard, ProgressControls, RecipientStatusRow
    │   ├── AppHeader.tsx              # Top navigation header with insets
    │   ├── Badge.tsx                  # Multi-variant badge pills
    │   └── Icons.tsx                  # Vector icons wrapper
    │
    ├── lib/                           # Core Utilities & Business Logic
    │   ├── bulk-send.ts               # Background send queue orchestrator & retry engine
    │   ├── csv-parser.ts              # Pure TS CSV & smart text parser
    │   ├── storage.ts                 # SQLite database & migrations
    │   ├── theme.ts                   # Espresso & Sand color tokens
    │   ├── constants.ts               # Carrier rate limits & retry delays
    │   └── permissions.ts             # SMS & Contacts runtime permission helpers
    │
    ├── modules/expo-sim-sms/          # Custom Native Kotlin Android Module
    │   └── android/src/main/java/     # SmsService.kt, SubscriptionManager, Delivery Receivers
    │
    └── stores/                        # Zustand Global State
        └── contacts.ts                # Selected contacts & active group state
```

---

## 🚀 How to Run the App

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Android Device** connected via USB (with Developer Options & USB Debugging enabled) OR an Android Emulator.

---

### 2. Install Dependencies
```bash
cd sms-sender
npm install
```

---

### 3. Start Development Server
```bash
npx expo start
```
- Press **`a`** to open on your connected Android device.
- Press **`r`** to reload the app after code changes.

---

### 4. Native Development Build (Recommended for Native SMS & SIM Features)

Because this app uses a custom native Kotlin module (`expo-sim-sms`) for multi-SIM routing, run the native build command:

```bash
# Run locally with Android Studio / Android SDK installed:
npx expo run:android

# OR build a development APK using EAS:
eas build -p android --profile development
```

---

## 🛠️ Permissions Used (Android)

| Permission | Purpose |
| :--- | :--- |
| `android.permission.SEND_SMS` | Transmits bulk SMS messages |
| `android.permission.READ_PHONE_STATE` | Detects installed SIM cards & carrier names |
| `android.permission.READ_CONTACTS` | Loads contacts from device address book |

---

-- Developed by Abubeker abe.
