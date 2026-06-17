// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type MappedToTarget = string | number;
export type MappedTo = MappedToTarget | Record<string, MappedToTarget | null | undefined>;

export const resolveMappedTo = (
  mappedTo: MappedTo | undefined,
  backend: string | undefined,
): MappedToTarget | undefined => {
  if (typeof mappedTo === "string" || typeof mappedTo === "number") {
    return mappedTo;
  }

  if (!mappedTo) {
    return undefined;
  }

  const target = backend ? mappedTo[backend] : undefined;
  return target ?? mappedTo.default ?? undefined;
};

export const mappedToKey = (target: MappedToTarget): string => String(target);

export const resolveMappedReportPayload = (
  report: { mappedTo?: MappedTo },
  result: {
    backend?: string;
    reports: Record<string, unknown>;
    raw: unknown;
  },
): unknown => {
  const target = resolveMappedTo(report.mappedTo, result.backend);
  if (target === undefined) {
    return undefined;
  }

  const keyed = result.reports[mappedToKey(target)];
  if (keyed !== undefined) {
    return keyed;
  }

  return typeof target === "number" && Array.isArray(result.raw) ? result.raw[target] : undefined;
};
