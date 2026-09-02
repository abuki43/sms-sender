/**
 * Small helpers for describing and surfacing send errors consistently.
 * The orchestrator returns error codes; UI layers decide how to display them.
 */

export type SendErrorCode =
  | "NO_SIM"
  | "NO_SERVICE"
  | "GENERIC_FAILURE"
  | "NULL_PDU"
  | "RADIO_OFF"
  | "INVALID_ARGUMENTS"
  | "TIMEOUT"
  | "EXCEPTION"
  | "PERMISSION_DENIED";

export function describeError(code: string | undefined, fallback = "Unknown error"): string {
  if (!code) return fallback;
  const map: Record<string, string> = {
    NO_SIM: "No active SIM card detected.",
    NO_SERVICE: "No mobile service available (check signal/airplane mode).",
    GENERIC_FAILURE: "The message could not be sent.",
    NULL_PDU: "The carrier returned an invalid message.",
    RADIO_OFF: "The radio is off — check airplane mode.",
    INVALID_ARGUMENTS: "Recipient or message is missing.",
    TIMEOUT: "Timed out waiting for the carrier response.",
    EXCEPTION: "An unexpected error occurred while sending.",
    PERMISSION_DENIED: "SMS/Phone permission was denied.",
  };
  return map[code] ?? fallback;
}
