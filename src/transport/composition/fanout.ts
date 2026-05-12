// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  assertTransportCapabilities,
  inferTransportCapabilities,
  mergeTransportCapabilities,
} from "../capabilities";
import {
  combineSignals,
  createAsyncQueue,
  createTransport,
  mergeFanoutResponses,
  normalizeTransportResponse,
  resolveStreamOrSubmit,
  resolveTransportEntries,
  withCapabilityRequirement,
  withEventMeta,
} from "../internal";
import type {
  FanoutTransportFailure,
  FanoutTransportOptions,
  FanoutTransportResult,
  SubmitRequest,
  Transport,
  TransportCapabilities,
  TransportStreamEvent,
} from "../types";
import { createFanoutFailure } from "./fanout-helpers";

export const createFanoutTransport = <TTransportId extends string = string>(
  options: FanoutTransportOptions<TTransportId>,
): Transport => {
  const transportEntries = resolveTransportEntries(
    options.transports,
    "createFanoutTransport",
  ) as readonly ({ id: TTransportId | undefined } & ReturnType<
    typeof resolveTransportEntries
  >[number])[];

  const resolveActiveEntries = async (request: SubmitRequest) => {
    let activeEntries = transportEntries;

    if (options.filter) {
      const filterResults = await Promise.all(
        transportEntries.map(async (entry) => ({
          entry,
          include: await options.filter!(entry.id ?? String(entry.index), request),
        })),
      );
      activeEntries = filterResults
        .filter((result) => result.include)
        .map((result) => result.entry) as typeof transportEntries;
    }

    if (options.requiredCapabilities) {
      activeEntries = activeEntries.filter((entry) => {
        try {
          assertTransportCapabilities(
            entry.transport,
            options.requiredCapabilities!,
            "createFanoutTransport",
          );
          return true;
        } catch {
          return false;
        }
      }) as typeof transportEntries;
    }

    return activeEntries;
  };

  return createTransport(
    async (request: SubmitRequest) => {
      const activeEntries = await resolveActiveEntries(request);

      if (activeEntries.length === 0) {
        return { reports: {}, meta: {}, raw: null };
      }

      const abortPolicy = options.abortPolicy ?? "wait-all";
      const entryControllers = activeEntries.map(() => new AbortController());
      let abortTriggered = false;
      const abortOthers = (reason: string, skipIndex: number) => {
        if (abortTriggered) {
          return;
        }
        abortTriggered = true;
        for (const [index, controller] of entryControllers.entries()) {
          if (index === skipIndex) {
            continue;
          }
          controller.abort(reason);
        }
      };

      const settledResults = await Promise.allSettled(
        activeEntries.map(async (entry, activeIndex) => {
          const transformedRequest = withCapabilityRequirement(
            options.transformRequest
              ? await options.transformRequest(entry.id ?? String(entry.index), request)
              : request,
            options.requiredCapabilities,
            entry.transport,
            "createFanoutTransport",
          );
          const { signal, cleanup } = combineSignals([
            transformedRequest.signal,
            entryControllers[activeIndex]?.signal,
          ]);

          try {
            const response = normalizeTransportResponse(
              await entry.transport.submit({
                ...transformedRequest,
                signal,
              }),
            );

            if (abortPolicy === "abort-pending-on-first-success") {
              abortOthers("fanout-first-success", activeIndex);
            }

            return {
              id: entry.id,
              index: entry.index,
              response,
            };
          } catch (error) {
            if (
              abortPolicy === "abort-pending-on-first-failure" &&
              !(entryControllers[activeIndex]?.signal.aborted ?? false)
            ) {
              abortOthers("fanout-first-failure", activeIndex);
            }

            throw error;
          } finally {
            cleanup();
          }
        }),
      );

      const results = settledResults
        .filter(
          (result): result is PromiseFulfilledResult<FanoutTransportResult<TTransportId>> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value);

      const failures: FanoutTransportFailure<TTransportId>[] = settledResults.flatMap(
        (result, index) =>
          result.status === "rejected"
            ? [
                {
                  id: activeEntries[index]?.id,
                  index: activeEntries[index]?.index ?? index,
                  error: result.reason,
                },
              ]
            : [],
      );

      const failurePolicy = options.failurePolicy ?? "fail-all";

      if (failures.length > 0 && failurePolicy === "fail-all") {
        throw createFanoutFailure(failures);
      }

      if (results.length === 0 && failures.length > 0) {
        throw createFanoutFailure(failures);
      }

      if (options.merge) {
        return options.merge({
          request,
          results,
          failures,
        });
      }

      return mergeFanoutResponses(results, failures);
    },
    async function* (request: SubmitRequest) {
      const activeEntries = await resolveActiveEntries(request);
      if (activeEntries.length === 0) {
        yield { type: "result", result: { reports: {}, meta: {}, raw: null } };
        return;
      }

      const abortPolicy = options.abortPolicy ?? "wait-all";
      const failurePolicy = options.failurePolicy ?? "fail-all";
      const queue = createAsyncQueue<TransportStreamEvent>();
      const entryControllers = activeEntries.map(() => new AbortController());
      const results: FanoutTransportResult<TTransportId>[] = [];
      const failures: FanoutTransportFailure<TTransportId>[] = [];
      let remaining = activeEntries.length;
      let abortTriggered = false;

      const abortOthers = (reason: string, skipIndex: number) => {
        if (abortTriggered) {
          return;
        }
        abortTriggered = true;
        for (const [index, controller] of entryControllers.entries()) {
          if (index === skipIndex) continue;
          controller.abort(reason);
        }
      };

      const finishIfDone = () => {
        remaining -= 1;
        if (remaining === 0) {
          queue.close();
        }
      };

      activeEntries.forEach((entry, activeIndex) => {
        void (async () => {
          const transportId = entry.id ?? (`transport[${entry.index}]` as TTransportId);
          const transformedRequest = withCapabilityRequirement(
            options.transformRequest
              ? await options.transformRequest(transportId, request)
              : request,
            options.requiredCapabilities,
            entry.transport,
            "createFanoutTransport.stream",
          );
          const { signal, cleanup } = combineSignals([
            transformedRequest.signal,
            entryControllers[activeIndex]?.signal,
          ]);

          try {
            const stream = await resolveStreamOrSubmit(entry.transport, {
              ...transformedRequest,
              signal,
            });
            for await (const event of stream) {
              const annotatedEvent = withEventMeta(event, {
                source: transportId,
              });

              if (event.type === "result") {
                results.push({
                  id: entry.id,
                  index: entry.index,
                  response: normalizeTransportResponse(event.result),
                });
                queue.push(annotatedEvent);
                if (abortPolicy === "abort-pending-on-first-success") {
                  abortOthers("fanout-first-success", activeIndex);
                }
                break;
              }

              if (event.type === "error") {
                throw event.error;
              }

              queue.push(annotatedEvent);
            }
          } catch (error) {
            failures.push({
              id: entry.id,
              index: entry.index,
              error,
            });
            queue.push(
              withEventMeta(
                {
                  type: "error",
                  error,
                },
                {
                  source: transportId,
                },
              ),
            );
            if (abortPolicy === "abort-pending-on-first-failure") {
              abortOthers("fanout-first-failure", activeIndex);
            }
          } finally {
            cleanup();
            finishIfDone();
          }
        })().catch((error) => {
          queue.push({
            type: "error",
            error,
            meta: {
              source: entry.id ?? `transport[${entry.index}]`,
            },
          });
          finishIfDone();
        });
      });

      for await (const event of queue) {
        yield event;
      }

      if (failures.length > 0 && failurePolicy === "fail-all") {
        throw createFanoutFailure(failures);
      }

      if (results.length === 0 && failures.length > 0) {
        throw createFanoutFailure(failures);
      }

      const finalResult = options.merge
        ? await options.merge({
            request,
            results,
            failures,
          })
        : mergeFanoutResponses(results, failures);

      yield {
        type: "result",
        result: finalResult,
        meta: {
          source: "fanout",
        },
      };
    },
    {
      capabilities: transportEntries.reduce<TransportCapabilities | undefined>((caps, entry) => {
        return mergeTransportCapabilities(caps, inferTransportCapabilities(entry.transport));
      }, undefined),
    },
  );
};
