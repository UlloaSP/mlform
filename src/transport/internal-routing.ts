// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { transportErrorMessages } from "./constants";
import { TransportError } from "./errors";
import type { MaybePromise, SubmitRequest, TransportResponse } from "./types";

export const chooseWeightedTransport = async <TTransportId extends string>(
  request: SubmitRequest,
  transportIds: readonly TTransportId[],
  weights:
    | Partial<Record<TTransportId, number>>
    | ((request: SubmitRequest, transportId: TTransportId) => MaybePromise<number>),
  filter?: (transportId: TTransportId, request: SubmitRequest) => MaybePromise<boolean>,
): Promise<TTransportId> => {
  const candidates: { id: TTransportId; weight: number }[] = [];

  for (const transportId of transportIds) {
    if (filter && !(await filter(transportId, request))) {
      continue;
    }
    const weight =
      typeof weights === "function" ? await weights(request, transportId) : weights[transportId];
    if ((weight ?? 0) > 0) {
      candidates.push({ id: transportId, weight: weight ?? 0 });
    }
  }

  if (candidates.length === 0) {
    throw new TransportError("No eligible transport available for weighted routing.", {
      code: "NO_ELIGIBLE_TRANSPORT",
      retryable: false,
    });
  }

  const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let cursor = Math.random() * totalWeight;
  for (const candidate of candidates) {
    cursor -= candidate.weight;
    if (cursor <= 0) {
      return candidate.id;
    }
  }

  return candidates.at(-1)!.id;
};

export const toFanoutMeta = (
  results: readonly { id: string | undefined; index: number; response: TransportResponse }[],
  failures: readonly { id: string | undefined; index: number; error: unknown }[],
): Record<string, unknown> => {
  const transportMeta = results.some((result) => result.id !== undefined)
    ? Object.fromEntries(
        results.map((result) => [result.id ?? String(result.index), result.response.meta ?? {}]),
      )
    : results.map((result) => result.response.meta ?? {});

  const meta: Record<string, unknown> = { transports: transportMeta };
  if (failures.length > 0) {
    meta.failures = failures.map((failure) => ({
      id: failure.id ?? String(failure.index),
      error: failure.error instanceof Error ? failure.error.message : String(failure.error),
    }));
  }

  return meta;
};

export const toFanoutRaw = (
  results: readonly { id: string | undefined; index: number; response: TransportResponse }[],
): unknown => {
  return results.some((result) => result.id !== undefined)
    ? Object.fromEntries(
        results.map((result) => [result.id ?? String(result.index), result.response.raw]),
      )
    : results.map((result) => result.response.raw);
};

export const mergeFanoutResponses = (
  results: readonly { id: string | undefined; index: number; response: TransportResponse }[],
  failures: readonly { id: string | undefined; index: number; error: unknown }[],
): TransportResponse => {
  const reports: Record<string, unknown> = {};
  const reportSources = new Map<string, string>();

  for (const result of results) {
    for (const [reportId, payload] of Object.entries(result.response.reports ?? {})) {
      const currentSource = result.id ?? `transport[${result.index}]`;
      const previousSource = reportSources.get(reportId);
      if (previousSource) {
        throw new Error(
          transportErrorMessages.duplicateFanoutReport(reportId, previousSource, currentSource),
        );
      }

      reportSources.set(reportId, currentSource);
      reports[reportId] = payload;
    }
  }

  return {
    reports,
    meta: toFanoutMeta(results, failures),
    raw: toFanoutRaw(results),
  };
};
