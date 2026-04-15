// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { transportErrorMessages } from "../constants";
import { TransportError, transportErrorCodes } from "../errors";
import { waitForDelay } from "../internal";
import type { SharedRateLimiter, SharedRateLimiterLease } from "../types";

export const createMemorySharedRateLimiter = (): SharedRateLimiter => {
  const activeCounts = new Map<string, number>();
  const queues = new Map<string, (() => void)[]>();
  const startedAt = new Map<string, number[]>();

  const pruneRateWindow = (key: string) => {
    const timestamps = startedAt.get(key) ?? [];
    const threshold = Date.now() - 1000;
    while (timestamps.length > 0 && timestamps[0] !== undefined && timestamps[0] < threshold) {
      timestamps.shift();
    }
    startedAt.set(key, timestamps);
  };

  const waitForDelayForKey = async (key: string, signal?: AbortSignal) => {
    const timestamps = startedAt.get(key) ?? [];
    const oldest = timestamps[0] ?? Date.now();
    await waitForDelay(Math.max(0, 1000 - (Date.now() - oldest)), signal);
  };

  return {
    async acquire(scope, lease) {
      const request = lease.request;
      const key = scope;
      const options = lease;
      const queue = queues.get(key) ?? [];
      queues.set(key, queue);

      while (options.maxConcurrent && (activeCounts.get(key) ?? 0) >= options.maxConcurrent) {
        if (options.queueLimit !== undefined && queue.length >= options.queueLimit) {
          throw new TransportError(transportErrorMessages.rateLimitQueueFull, {
            code: transportErrorCodes.RATE_LIMITED,
            retryable: true,
          });
        }

        await new Promise<void>((resolve, reject) => {
          if (request.signal?.aborted) {
            reject(request.signal.reason);
            return;
          }

          const releaseWaiter = () => {
            request.signal?.removeEventListener("abort", onAbort);
            resolve();
          };
          const onAbort = () => reject(request.signal?.reason);
          request.signal?.addEventListener("abort", onAbort, { once: true });
          queue.push(releaseWaiter);
        });
      }

      activeCounts.set(key, (activeCounts.get(key) ?? 0) + 1);

      if (options.perSecond) {
        while (true) {
          pruneRateWindow(key);
          const timestamps = startedAt.get(key) ?? [];
          if (timestamps.length < options.perSecond) {
            timestamps.push(Date.now());
            startedAt.set(key, timestamps);
            break;
          }
          await waitForDelayForKey(key, request.signal);
        }
      }

      let released = false;
      return {
        async release() {
          if (released) {
            return;
          }
          released = true;
          activeCounts.set(key, Math.max(0, (activeCounts.get(key) ?? 1) - 1));
          queue.shift()?.();
        },
      } satisfies SharedRateLimiterLease;
    },
  };
};
