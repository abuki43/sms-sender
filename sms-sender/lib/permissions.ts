import { PermissionsAndroid, Platform } from "react-native";
import type { Permission } from "react-native";

export type SmsPermissionResult =
  | { status: "granted" }
  | { status: "denied"; canAskAgain: boolean };

const REQUIRED_PERMISSIONS: Permission[] = [
  PermissionsAndroid.PERMISSIONS.SEND_SMS,
  PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
];

/**
 * Android-only. Returns whether both SEND_SMS and READ_PHONE_STATE
 * are currently granted. On non-Android platforms this reports granted
 * (short-circuit) since SMS sending is Android-only anyway.
 */
export async function checkSmsPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return true;

  const results = await PermissionsAndroid.requestMultiple(REQUIRED_PERMISSIONS);
  return REQUIRED_PERMISSIONS.every(
    (permission) => results[permission] === PermissionsAndroid.RESULTS.GRANTED
  );
}

/**
 * Android-only. Requests SEND_SMS and READ_PHONE_STATE at runtime and resolves
 * with a structured result. Uses requestMultiple so both permissions prompt
 * together.
 */
export async function requestSmsPermissions(): Promise<SmsPermissionResult> {
  if (Platform.OS !== "android") {
    return { status: "granted" };
  }

  const results = await PermissionsAndroid.requestMultiple(REQUIRED_PERMISSIONS);

  const allGranted = REQUIRED_PERMISSIONS.every(
    (permission) => results[permission] === PermissionsAndroid.RESULTS.GRANTED
  );
  if (allGranted) {
    return { status: "granted" };
  }

  const anyNeverAskAgain = REQUIRED_PERMISSIONS.some(
    (permission) =>
      results[permission] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
  );

  return {
    status: "denied",
    canAskAgain: !anyNeverAskAgain,
  };
}
