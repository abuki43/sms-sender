import { useEffect, useState } from "react";
import {
  BulkSendOptions,
  BulkSendProgress,
  SendRecipient,
  bulkSendOrchestrator,
} from "../lib/bulk-send";

/**
 * Subscribes a component to the shared BulkSendOrchestrator singleton so the
 * UI reflects live send state while navigation changes don't interrupt sends.
 */
export function useBulkSend() {
  const [state, setState] = useState<BulkSendProgress>(() =>
    bulkSendOrchestrator.snapshot()
  );

  useEffect(() => {
    return bulkSendOrchestrator.subscribe(setState);
  }, []);

  return {
    progress: state,
    start: (options: BulkSendOptions) => bulkSendOrchestrator.start(options),
    pause: () => bulkSendOrchestrator.pause(),
    resume: () => bulkSendOrchestrator.resume(),
    cancel: () => bulkSendOrchestrator.cancel(),
    retryFailed: () => bulkSendOrchestrator.retryFailed(),
    getSimCards: () => bulkSendOrchestrator.getSimCards(),
    warnAboutRateLimit: () => bulkSendOrchestrator.warnAboutRateLimit(),
  };
}

export type { BulkSendOptions, SendRecipient, BulkSendProgress };
