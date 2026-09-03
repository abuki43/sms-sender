import ExpoSimSms, {
  SendMultipartSmsResult,
  SimCard,
  SmsStatusEvent,
} from "../modules/expo-sim-sms/src";
import {
  DEFAULT_SEND_DELAY_MS,
  MAX_RETRY_ATTEMPTS,
  RATE_LIMIT_WARNING_THRESHOLD,
} from "./constants";

export type SendStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "failed";

export interface SendRecipient {
  id: string;
  name: string;
  phone: string;
}

export interface RecipientStatus {
  recipient: SendRecipient;
  status: SendStatus;
  errorCode?: string | null;
  partCount?: number | null;
  attempts: number;
}

export interface BulkSendProgress {
  sent: number;
  delivered: number;
  failed: number;
  total: number;
  perRecipient: RecipientStatus[];
  isRunning: boolean;
  isPaused: boolean;
  message: string;
  groupName?: string | null;
}

export interface BulkSendOptions {
  recipients: SendRecipient[];
  message: string;
  groupName?: string | null;
  simSubscriptionId?: number;
  delayMs?: number;
}

type Listener = (state: BulkSendProgress) => void;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Singleton orchestrator that lives outside the React tree so it survives
 * navigation changes. Drives the native expo-sim-sms module through the
 * send queue, applies per-recipient delay and retry logic, and notifies
 * subscribers of progress.
 */
class BulkSendOrchestrator {
  private recipients: SendRecipient[] = [];
  private message = "";
  private groupName?: string | null = null;
  private simSubscriptionId?: number;
  private delayMs = DEFAULT_SEND_DELAY_MS;

  private perRecipient = new Map<string, RecipientStatus>();
  private order: string[] = [];

  private isRunning = false;
  private isPaused = false;
  private cancelled = false;

  private listeners = new Set<Listener>();
  private eventSub: { remove(): void } | null = null;

  private emit() {
    const state = this.snapshot();
    this.listeners.forEach((l) => l(state));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot(): BulkSendProgress {
    const perRecipient = this.order.length
      ? this.order.map((id) => ({ ...this.perRecipient.get(id)! }))
      : [];
    return {
      sent: perRecipient.filter((r) => r.status === "sent").length,
      delivered: perRecipient.filter((r) => r.status === "delivered").length,
      failed: perRecipient.filter((r) => r.status === "failed").length,
      total: this.order.length,
      perRecipient,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      message: this.message,
      groupName: this.groupName,
    };
  }

  start(options: BulkSendOptions) {
    if (this.isRunning) return;

    this.recipients = options.recipients;
    this.message = options.message;
    this.groupName = options.groupName ?? null;
    this.simSubscriptionId = options.simSubscriptionId;
    this.delayMs = options.delayMs ?? DEFAULT_SEND_DELAY_MS;
    this.cancelled = false;
    this.isPaused = false;
    this.perRecipient = new Map();
    this.order = this.recipients.map((r) => r.id);

    for (const recipient of this.recipients) {
      this.perRecipient.set(recipient.id, {
        recipient,
        status: "queued",
        errorCode: null,
        partCount: null,
        attempts: 0,
      });
    }

    this.isRunning = true;
    this.emit();

    this.eventSub ??= ExpoSimSms.addListener(
      "onSmsStatus",
      this.handleSmsStatus
    );

    void this.run();
  }

  private handleSmsStatus = (event: SmsStatusEvent) => {
    const recipient = this.recipients.find(
      (r) => r.phone === event.phone
    );
    if (!recipient) return;
    const record = this.perRecipient.get(recipient.id);
    if (!record) return;

    // Upgrade sent -> delivered when a delivery report arrives.
    if (event.status === "delivered") {
      this.perRecipient.set(recipient.id, {
        ...record,
        status: "delivered",
      });
      this.emit();
    }
  };

  private async run() {
    for (const id of this.order) {
      if (this.cancelled) break;
      while (this.isPaused && !this.cancelled) {
        await sleep(150);
      }
      if (this.cancelled) break;

      const record = this.perRecipient.get(id)!;
      if (record.status === "sent" || record.status === "delivered") continue;

      const ok = await this.sendWithRetry(record);
      if (!ok) {
        // still failed after retries
      }
      await sleep(this.delayMs);
    }
    this.isRunning = false;
    this.eventSub?.remove();
    this.eventSub = null;
    this.emit();
  }

  private async sendWithRetry(record: RecipientStatus): Promise<boolean> {
    const id = record.recipient.id;
    let attempt = 0;
    while (attempt < MAX_RETRY_ATTEMPTS && !this.cancelled) {
      this.perRecipient.set(id, {
        ...this.perRecipient.get(id)!,
        status: "sending",
        attempts: attempt + 1,
      });
      this.emit();

      const result = await this.sendOnce(record.recipient);
      if (this.cancelled) return false;

      if (result.status === "sent") {
        this.perRecipient.set(id, {
          ...this.perRecipient.get(id)!,
          status: "sent",
          errorCode: null,
          partCount: result.partCount,
        });
        this.emit();
        return true;
      }

      this.perRecipient.set(id, {
        ...this.perRecipient.get(id)!,
        errorCode: result.errorCode ?? null,
      });
      attempt++;
      if (attempt < MAX_RETRY_ATTEMPTS) {
        // exponential backoff: 2s, 4s, 8s
        await sleep(2000 * Math.pow(2, attempt - 1));
        if (this.cancelled) return false;
      }
    }

    this.perRecipient.set(id, {
      ...this.perRecipient.get(id)!,
      status: "failed",
    });
    this.emit();
    return false;
  }

  private async sendOnce(
    recipient: SendRecipient
  ): Promise<SendMultipartSmsResult> {
    try {
      return await ExpoSimSms.sendMultipartSms(
        recipient.phone,
        this.message,
        this.simSubscriptionId
      );
    } catch (e) {
      return {
        phone: recipient.phone,
        status: "failed",
        errorCode: "EXCEPTION",
        partCount: 0,
      };
    }
  }

  pause() {
    if (!this.isRunning) return;
    this.isPaused = true;
    this.emit();
  }

  resume() {
    this.isPaused = false;
    this.emit();
  }

  cancel() {
    this.cancelled = true;
    this.isPaused = false;
    this.emit();
  }

  retryFailed() {
    for (const record of this.perRecipient.values()) {
      if (record.status === "failed") {
        record.status = "queued";
        record.errorCode = null;
      }
    }
    if (this.isRunning) return;
    this.isRunning = true;
    this.cancelled = false;
    this.isPaused = false;
    this.eventSub ??= ExpoSimSms.addListener(
      "onSmsStatus",
      this.handleSmsStatus
    );
    void this.run();
  }

  getSimCards(): Promise<SimCard[]> {
    return ExpoSimSms.getSimCards();
  }

  warnAboutRateLimit(): boolean {
    return this.order.length >= RATE_LIMIT_WARNING_THRESHOLD;
  }
}

/** Shared singleton instance. */
export const bulkSendOrchestrator = new BulkSendOrchestrator();
