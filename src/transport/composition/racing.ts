// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { inferTransportCapabilities, mergeTransportCapabilities } from "../capabilities";
import { transportErrorMessages } from "../constants";
import {
  combineSignals,
  createAggregateFailure,
  createAsyncQueue,
  createTransport,
  isRecord,
  resolveStreamOrSubmit,
  resolveTransportEntries,
  withEventMeta,
} from "../internal";
import type {
  RacingTransportOptions,
  SubmitRequest,
  Transport,
  TransportCapabilities,
  TransportStreamEvent,
} from "../types";

export const createRacingTransport = (options: RacingTransportOptions): Transport => {
  const transportEntries = resolveTransportEntries(options.transports, "createRacingTransport");

  return createTransport(
    async (request: SubmitRequest) => {
      const raceController = new AbortController();
      const { signal: combinedSignal, cleanup } = combineSignals([
        request.signal,
        raceController.signal,
      ]);

      try {
        const result = await Promise.any(
          transportEntries.map((entry) =>
            entry.transport.submit({ ...request, signal: combinedSignal }),
          ),
        );
        if (isRecord(result)) {
          return {
            ...result,
            meta: {
              ...(isRecord(result.meta) ? result.meta : {}),
              selection: "first-success",
            },
          };
        }
        return result;
      } catch (error) {
        if (error instanceof AggregateError) {
          throw createAggregateFailure(
            transportErrorMessages.racingAllFailed,
            transportEntries.map((entry, index) => ({
              label: entry.id ?? `transport[${entry.index}]`,
              error: error.errors[index] ?? new Error("Unknown transport failure."),
            })),
          );
        }
        throw error;
      } finally {
        raceController.abort("racing-complete");
        cleanup();
      }
    },
    async function* (request: SubmitRequest) {
      const raceController = new AbortController();
      const { signal: combinedSignal, cleanup } = combineSignals([
        request.signal,
        raceController.signal,
      ]);
      const queue = createAsyncQueue<TransportStreamEvent>();
      const failures: { label: string; error: unknown }[] = [];
      let remaining = transportEntries.length;
      let winnerChosen = false;

      const finishIfDone = () => {
        remaining -= 1;
        if (remaining === 0) {
          queue.close();
        }
      };

      for (const entry of transportEntries) {
        void (async () => {
          try {
            const stream = await resolveStreamOrSubmit(entry.transport, {
              ...request,
              signal: combinedSignal,
            });
            for await (const event of stream) {
              const annotated = withEventMeta(event, {
                source: entry.id ?? `transport[${entry.index}]`,
              });

              if (event.type === "result") {
                if (!winnerChosen) {
                  winnerChosen = true;
                  queue.push(
                    withEventMeta(annotated, {
                      selection: "first-success",
                    }),
                  );
                  raceController.abort("racing-complete");
                }
                break;
              }

              if (event.type === "error") {
                throw event.error;
              }

              if (!winnerChosen) {
                queue.push(annotated);
              }
            }
          } catch (error) {
            if (!(combinedSignal.aborted && winnerChosen)) {
              failures.push({
                label: entry.id ?? `transport[${entry.index}]`,
                error,
              });
            }
          } finally {
            finishIfDone();
          }
        })();
      }

      for await (const event of queue) {
        yield event;
      }

      cleanup();

      if (!winnerChosen) {
        throw createAggregateFailure(
          transportErrorMessages.racingAllFailed,
          failures.length > 0
            ? failures
            : transportEntries.map((entry) => ({
                label: entry.id ?? `transport[${entry.index}]`,
                error: new Error("No transport produced a result."),
              })),
        );
      }
    },
    {
      capabilities: transportEntries.reduce<TransportCapabilities | undefined>((caps, entry) => {
        return mergeTransportCapabilities(caps, inferTransportCapabilities(entry.transport));
      }, undefined),
    },
  );
};
