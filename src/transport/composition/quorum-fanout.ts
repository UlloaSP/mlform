// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { cloneCapabilities } from "../capabilities";
import { TransportError } from "../errors";
import {
  createTransport,
  isRecord,
  normalizeTransportResponse,
  resolveStreamOrSubmit,
} from "../internal";
import type { QuorumFanoutTransportOptions, Transport } from "../types";
import { createFanoutTransport } from "./fanout";

export const createQuorumFanoutTransport = <TTransportId extends string = string>(
  options: QuorumFanoutTransportOptions<TTransportId>,
): Transport => {
  const base = createFanoutTransport({
    ...options,
    failurePolicy: "partial-success",
  });

  const assertQuorum = (result: unknown) => {
    const normalized = normalizeTransportResponse(result);
    const transportsMeta = normalized.meta?.transports;
    const successCount = Array.isArray(transportsMeta)
      ? transportsMeta.length
      : isRecord(transportsMeta)
        ? Object.keys(transportsMeta).length
        : 0;

    if (successCount < options.quorum) {
      throw new TransportError(
        `createQuorumFanoutTransport: quorum ${options.quorum} not reached.`,
        {
          code: "QUORUM_NOT_REACHED",
          retryable: true,
          details: {
            required: options.quorum,
            actual: successCount,
          },
        },
      );
    }

    return result;
  };

  return createTransport(
    async (request) => assertQuorum(await base.submit(request)),
    async function* (request) {
      const stream = await resolveStreamOrSubmit(base, request);
      for await (const event of stream) {
        if (event.type === "result") {
          yield {
            ...event,
            result: assertQuorum(event.result),
          };
          continue;
        }
        yield event;
      }
    },
    {
      capabilities: cloneCapabilities(base.capabilities),
    },
  );
};
