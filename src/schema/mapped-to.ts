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

export const resolveMappedTargets = (
  mappedTo: MappedTo | undefined,
  backend: string | undefined,
): MappedToTarget[] => {
  const target = resolveMappedTo(mappedTo, backend);
  if (backend !== undefined || typeof mappedTo !== "object" || mappedTo === null) {
    return target === undefined ? [] : [target];
  }

  const seen = new Set<string>();
  return Object.values(mappedTo).filter((value): value is MappedToTarget => {
    if (typeof value !== "string" && typeof value !== "number") {
      return false;
    }

    const key = mappedToKey(value);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const getReportPayload = (
  target: MappedToTarget,
  result: {
    reports: readonly unknown[];
  },
): unknown => {
  const key = mappedToKey(target);
  const matches = result.reports.filter((item): item is Record<string, unknown> => {
    return (
      typeof item === "object" &&
      item !== null &&
      !Array.isArray(item) &&
      mappedToKey((item as { mappedTo?: MappedToTarget }).mappedTo ?? "") === key
    );
  });
  if (matches.length > 1) {
    throw new Error(`Duplicate report payload for mappedTo "${key}".`);
  }
  const match = matches[0];
  if (!match) return undefined;
  if ("payload" in match) return match.payload;

  const { id: _id, kind: _kind, mappedTo: _mappedTo, ...payload } = match;
  void _id;
  void _kind;
  void _mappedTo;
  return payload;
};

export const resolveMappedReportPayload = (
  report: { id?: string; mappedTo?: MappedTo },
  result: {
    backend?: string;
    reports: readonly unknown[];
  },
): unknown => {
  const targets = resolveMappedTargets(report.mappedTo, result.backend);
  if (targets.length === 0) return undefined;

  for (const target of targets) {
    const payload = getReportPayload(target, result);
    if (payload !== undefined) {
      return payload;
    }
  }

  return undefined;
};
