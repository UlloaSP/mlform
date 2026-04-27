// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { inferTransportCapabilities, mergeTransportCapabilities } from "../capabilities";
import {
  createAggregateFailure,
  createTransport,
  resolveStreamOrSubmit,
  resolveTransportEntries,
} from "../internal";
import type {
  FallbackTransportFailure,
  FallbackTransportOptions,
  SubmitRequest,
  Transport,
  TransportCapabilities,
} from "../types";

export const createFallbackTransport = <TTransportId extends string = string>(
  options: FallbackTransportOptions<TTransportId>,
): Transport => {
  const transportEntries = resolveTransportEntries(
    options.transports,
    "createFallbackTransport",
  ) as readonly ({ id: TTransportId | undefined } & ReturnType<
    typeof resolveTransportEntries
  >[number])[];

  return createTransport(
    async (request: SubmitRequest) => {
      const failures: FallbackTransportFailure<TTransportId>[] = [];

      for (const entry of transportEntries) {
        if (request.signal?.aborted) {
          throw new Error(String(request.signal.reason ?? "Submission aborted."));
        }

        try {
          return await entry.transport.submit(request);
        } catch (error) {
          if (request.signal?.aborted) {
            throw error;
          }

          const failure = {
            id: entry.id,
            index: entry.index,
            error,
          } satisfies FallbackTransportFailure<TTransportId>;
          failures.push(failure);

          const shouldFallback =
            (await options.shouldFallback?.(error, {
              request,
              id: failure.id,
              index: failure.index,
              failures,
            })) ?? true;

          if (!shouldFallback) {
            throw error;
          }
        }
      }

      throw createAggregateFailure(
        `createFallbackTransport exhausted all transports: ${transportEntries.map((entry) => entry.label).join(", ")}.`,
        failures.map((failure) => ({
          label: failure.id ?? `transport[${failure.index}]`,
          error: failure.error,
        })),
      );
    },
    async function* (request: SubmitRequest) {
      const failures: FallbackTransportFailure<TTransportId>[] = [];

      for (const entry of transportEntries) {
        if (request.signal?.aborted) {
          throw new Error(String(request.signal.reason ?? "Submission aborted."));
        }

        try {
          const stream = await resolveStreamOrSubmit(entry.transport, request);
          for await (const event of stream) {
            yield event;
          }
          return;
        } catch (error) {
          if (request.signal?.aborted) {
            throw error;
          }

          const failure = {
            id: entry.id,
            index: entry.index,
            error,
          } satisfies FallbackTransportFailure<TTransportId>;
          failures.push(failure);

          const shouldFallback =
            (await options.shouldFallback?.(error, {
              request,
              id: failure.id,
              index: failure.index,
              failures,
            })) ?? true;

          if (!shouldFallback) {
            throw error;
          }
        }
      }

      throw createAggregateFailure(
        `createFallbackTransport exhausted all transports: ${transportEntries.map((entry) => entry.label).join(", ")}.`,
        failures.map((failure) => ({
          label: failure.id ?? `transport[${failure.index}]`,
          error: failure.error,
        })),
      );
    },
    {
      capabilities: transportEntries.reduce<TransportCapabilities | undefined>((caps, entry) => {
        return mergeTransportCapabilities(caps, inferTransportCapabilities(entry.transport));
      }, undefined),
    },
  );
};
