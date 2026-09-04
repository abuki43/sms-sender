# Bulk SMS App — Implementation Plan

## Goal

Build an Android mobile app that sends the **same SMS message** to **multiple phone numbers simultaneously** using the **phone's own SIM card(s)** — just like the default messaging app but in bulk.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Expo SDK 54+ / React Native 0.81+ | JS/TS ecosystem, dev builds support custom native modules |
| UI | Tamagui v2 (RC) | Full design system: Button, Select, Dialog, Toast, Sheet, dark mode |
| SMS Engine | Custom Expo Module (Kotlin) | Every existing npm package is broken/abandoned;
| Navigation | Expo Router | Standard for Expo apps, tab + stack pattern |
| Storage | expo-sqlite | Send history persistence 

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



