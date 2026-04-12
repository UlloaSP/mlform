// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { SubmitRequest, Transport, TransportResponse } from "@/engine";
import { kitErrorMessages, kitTransportDefaults } from "./constants";
import type {
  FanoutTransportOptions,
  FanoutTransportResult,
  FallbackTransportFailure,
  FallbackTransportOptions,
  JsonTransportOptions,
  RoutingTransportOptions,
  TransportCollection,
} from "./types";

type TransportEntry = {
  id: string | undefined;
  index: number;
  label: string;
  transport: Transport;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeTransportResponse = (response: unknown): TransportResponse => {
  if (!isRecord(response)) {
    return { raw: response };
  }

  const reports = isRecord(response.reports) ? response.reports : undefined;
  const meta = isRecord(response.meta) ? response.meta : undefined;
  const raw = "raw" in response ? response.raw : response;

  return {
    reports,
    meta,
    raw,
  };
};

const resolveTransportEntries = (
  transports: TransportCollection,
  factoryName: string,
): readonly TransportEntry[] => {
  const entries = Array.isArray(transports)
    ? transports.map((transport, index) => ({
        id: undefined,
        index,
        label: `transport[${index}]`,
        transport,
      }))
    : Object.entries(transports).map(([id, transport], index) => ({
        id,
        index,
        label: id,
        transport,
      }));

  if (entries.length === 0) {
    throw new TypeError(kitErrorMessages.emptyComposedTransport(factoryName));
  }

  return entries;
};

const createAggregateFailure = (
  message: string,
  failures: readonly {
    label: string;
    error: unknown;
  }[],
): AggregateError => {
  return new AggregateError(
    failures.map(({ error, label }) =>
      error instanceof Error ? error : new Error(`${label}: ${String(error)}`),
    ),
    message,
  );
};

const defaultBody = (request: Parameters<Transport["submit"]>[0]) => ({
  [kitTransportDefaults.requestBodyKey]: request.serializedValues,
});

const defaultParse = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const resolveErrorMessage = (status: number, statusText: string, payload: unknown): string => {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return kitErrorMessages.requestFailed(status, statusText);
};

const resolveMethod = (method: string | undefined): NonNullable<JsonTransportOptions["method"]> => {
  const normalized = (method ?? kitTransportDefaults.method).toUpperCase();

  if (
    normalized === "POST" ||
    normalized === "PUT" ||
    normalized === "PATCH" ||
    normalized === "DELETE"
  ) {
    return normalized;
  }

  throw new TypeError(kitErrorMessages.unsupportedMethod(normalized));
};

const toFanoutMeta = (results: readonly FanoutTransportResult[]): Record<string, unknown> => {
  const transportMeta = results.some((result) => result.id !== undefined)
    ? Object.fromEntries(
        results.map((result) => [result.id ?? String(result.index), result.response.meta ?? {}]),
      )
    : results.map((result) => result.response.meta ?? {});

  return {
    transports: transportMeta,
  };
};

const toFanoutRaw = (results: readonly FanoutTransportResult[]): unknown => {
  return results.some((result) => result.id !== undefined)
    ? Object.fromEntries(
        results.map((result) => [result.id ?? String(result.index), result.response.raw]),
      )
    : results.map((result) => result.response.raw);
};

const mergeFanoutResponses = (results: readonly FanoutTransportResult[]): TransportResponse => {
  const reports: Record<string, unknown> = {};
  const reportSources = new Map<string, string>();

  for (const result of results) {
    for (const [reportId, payload] of Object.entries(result.response.reports ?? {})) {
      const currentSource = result.id ?? `transport[${result.index}]`;
      const previousSource = reportSources.get(reportId);
      if (previousSource) {
        throw new Error(
          kitErrorMessages.duplicateFanoutReport(reportId, previousSource, currentSource),
        );
      }

      reportSources.set(reportId, currentSource);
      reports[reportId] = payload;
    }
  }

  return {
    reports,
    meta: toFanoutMeta(results),
    raw: toFanoutRaw(results),
  };
};

export const createJsonTransport = (options: JsonTransportOptions): Transport => {
  const method = resolveMethod(options.method);

  return {
    async submit(request) {
      const fetchImpl = options.fetch ?? globalThis.fetch;

      if (typeof fetchImpl !== "function") {
        throw new Error(kitErrorMessages.missingFetch);
      }

      const headers = new Headers(options.headers);
      const body =
        typeof options.body === "function"
          ? options.body(request)
          : JSON.stringify(defaultBody(request));

      if (!headers.has("accept")) {
        headers.set("accept", kitTransportDefaults.acceptHeader);
      }
      if (typeof options.body !== "function" && !headers.has("content-type")) {
        headers.set("content-type", kitTransportDefaults.contentTypeHeader);
      }

      const response = await fetchImpl(String(options.endpoint), {
        method,
        headers,
        credentials: options.credentials,
        body,
        signal: request.signal,
      });

      const parse = options.parse ?? defaultParse;

      if (!response.ok) {
        let payload: unknown = null;

        try {
          payload = await parse(response);
        } catch {
          payload = null;
        }

        throw new Error(resolveErrorMessage(response.status, response.statusText, payload));
      }

      return parse(response);
    },
  };
};

export const createRoutingTransport = <TTransportId extends string = string>(
  options: RoutingTransportOptions<TTransportId>,
): Transport => {
  const transportEntries = resolveTransportEntries(
    options.transports,
    "createRoutingTransport",
  ) as readonly (TransportEntry & {
    id: TTransportId;
  })[];
  const transportIds = transportEntries.map((entry) => entry.id);

  return {
    async submit(request: SubmitRequest) {
      const transportId = await options.selectTransport(request, {
        transportIds,
      });
      const selectedTransport = options.transports[transportId];
      if (!selectedTransport) {
        throw new Error(
          kitErrorMessages.unknownComposedTransport(
            "createRoutingTransport",
            String(transportId),
            transportIds,
          ),
        );
      }

      return selectedTransport.submit(request);
    },
  };
};

export const createFanoutTransport = <TTransportId extends string = string>(
  options: FanoutTransportOptions<TTransportId>,
): Transport => {
  const transportEntries = resolveTransportEntries(
    options.transports,
    "createFanoutTransport",
  ) as readonly (TransportEntry & {
    id: TTransportId | undefined;
  })[];

  return {
    async submit(request: SubmitRequest) {
      const settledResults = await Promise.allSettled(
        transportEntries.map(async (entry) => ({
          id: entry.id,
          index: entry.index,
          response: normalizeTransportResponse(await entry.transport.submit(request)),
        })),
      );

      const failures = settledResults.flatMap((result, index) =>
        result.status === "rejected"
          ? [
              {
                label: transportEntries[index]?.label ?? `transport[${index}]`,
                error: result.reason,
              },
            ]
          : [],
      );

      if (failures.length > 0) {
        throw createAggregateFailure(
          kitErrorMessages.fanoutFailed(failures.map((failure) => failure.label)),
          failures,
        );
      }

      const results = settledResults
        .filter(
          (result): result is PromiseFulfilledResult<FanoutTransportResult<TTransportId>> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value);

      if (options.merge) {
        return options.merge({
          request,
          results,
        });
      }

      return mergeFanoutResponses(results);
    },
  };
};

export const createFallbackTransport = <TTransportId extends string = string>(
  options: FallbackTransportOptions<TTransportId>,
): Transport => {
  const transportEntries = resolveTransportEntries(
    options.transports,
    "createFallbackTransport",
  ) as readonly (TransportEntry & {
    id: TTransportId | undefined;
  })[];

  return {
    async submit(request: SubmitRequest) {
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
        kitErrorMessages.fallbackFailed(transportEntries.map((entry) => entry.label)),
        failures.map((failure) => ({
          label: failure.id ?? `transport[${failure.index}]`,
          error: failure.error,
        })),
      );
    },
  };
};
