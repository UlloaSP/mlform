// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  assertHedgingSafe,
  combineSignals,
  createAggregateFailure,
  createTransport,
  resolveTransportEntries,
} from "../internal";
import { inferTransportCapabilities, mergeTransportCapabilities } from "../capabilities";
import { createRacingTransport } from "./racing";
import type { HedgedTransportOptions, Transport, TransportCapabilities } from "../types";

export const createHedgedTransport = <TTransportId extends string = string>(
  options: HedgedTransportOptions<TTransportId>,
): Transport => {
  const transportEntries = resolveTransportEntries(
    options.transports,
    "createHedgedTransport",
  ) as readonly ({ id: TTransportId } & ReturnType<typeof resolveTransportEntries>[number])[];
  const maxAttempts = Math.min(
    options.maxAttempts ?? transportEntries.length,
    transportEntries.length,
  );

  if (options.hedgeDelayMs < 0) {
    throw new TypeError("createHedgedTransport: hedgeDelayMs must be non-negative.");
  }

  for (const entry of transportEntries) {
    assertHedgingSafe(entry.transport, options.allowUnsafeHedging);
  }

  return createTransport(
    async (request) => {
      const raceController = new AbortController();
      const { signal, cleanup } = combineSignals([request.signal, raceController.signal]);
      const failures: { label: string; error: unknown }[] = [];

      try {
        return await new Promise<unknown>((resolve, reject) => {
          let finished = false;
          let completed = 0;

          const launch = (entry: (typeof transportEntries)[number], delayMs: number) => {
            setTimeout(async () => {
              if (finished) {
                return;
              }
              try {
                const result = await entry.transport.submit({ ...request, signal });
                if (!finished) {
                  finished = true;
                  raceController.abort("hedged-complete");
                  resolve(result);
                }
              } catch (error) {
                failures.push({ label: entry.id, error });
                completed += 1;
                if (!finished && completed >= maxAttempts) {
                  reject(
                    createAggregateFailure("createHedgedTransport: all attempts failed.", failures),
                  );
                }
              }
            }, delayMs);
          };

          for (const [index, entry] of transportEntries.slice(0, maxAttempts).entries()) {
            launch(entry, index * options.hedgeDelayMs);
          }
        });
      } finally {
        cleanup();
      }
    },
    async function* (request) {
      const race = createRacingTransport({
        transports: Object.fromEntries(
          transportEntries.slice(0, maxAttempts).map((entry) => [entry.id, entry.transport]),
        ) as Record<TTransportId, Transport>,
      });
      const queue = await race.stream!(request);
      for await (const event of queue) {
        yield event;
      }
    },
    {
      capabilities: transportEntries.reduce<TransportCapabilities | undefined>((caps, entry) => {
        return mergeTransportCapabilities(caps, inferTransportCapabilities(entry.transport));
      }, undefined),
    },
  );
};
