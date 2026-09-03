import { useCallback, useEffect, useState } from "react";
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

  const start = useCallback(
    (options: BulkSendOptions) => bulkSendOrchestrator.start(options),
    []
  );
  const pause = useCallback(() => bulkSendOrchestrator.pause(), []);
  const resume = useCallback(() => bulkSendOrchestrator.resume(), []);
  const cancel = useCallback(() => bulkSendOrchestrator.cancel(), []);
  const retryFailed = useCallback(() => bulkSendOrchestrator.retryFailed(), []);
  const getSimCards = useCallback(() => bulkSendOrchestrator.getSimCards(), []);
  const warnAboutRateLimit = useCallback(
    () => bulkSendOrchestrator.warnAboutRateLimit(),
    []
  );

  return {
    progress: state,
    start,
    pause,
    resume,
    cancel,
    retryFailed,
    getSimCards,
    warnAboutRateLimit,
  };
}

export type { BulkSendOptions, SendRecipient, BulkSendProgress };
