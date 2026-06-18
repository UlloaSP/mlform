// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type MappedToTarget = string | number;
export type MappedTo = MappedToTarget | Record<string, MappedToTarget | null | undefined>;
export type ReportPayloadAliasOptions = {
  aliases?: readonly MappedToTarget[];
  onAlias?: (alias: MappedToTarget, target: MappedToTarget) => void;
};

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

export class MissingReportMappedToError extends Error {
  constructor() {
    super("Report requires mappedTo when backend response contains keyed reports.");
    this.name = "MissingReportMappedToError";
  }
}

const getReportPayload = (
  target: MappedToTarget,
  result: {
    reports: Record<string, unknown>;
    raw: unknown;
  },
): unknown => {
  const keyed = result.reports[mappedToKey(target)];
  if (keyed !== undefined) {
    return keyed;
  }

  return typeof target === "number" && Array.isArray(result.raw) ? result.raw[target] : undefined;
};

export const resolveMappedReportPayload = (
  report: { id?: string; mappedTo?: MappedTo },
  result: {
    backend?: string;
    reports: Record<string, unknown>;
    raw: unknown;
  },
  options: ReportPayloadAliasOptions = {},
): unknown => {
  const target = resolveMappedTo(report.mappedTo, result.backend);
  if (target === undefined) {
    if (Object.keys(result.reports).length > 0) {
      throw new MissingReportMappedToError();
    }
    return undefined;
  }

  const payload = getReportPayload(target, result);
  if (payload !== undefined) {
    return payload;
  }

  for (const alias of options.aliases ?? []) {
    const aliasPayload = getReportPayload(alias, result);
    if (aliasPayload !== undefined) {
      options.onAlias?.(alias, target);
      return aliasPayload;
    }
  }

  return undefined;
};
