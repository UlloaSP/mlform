// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type MappedToTarget = string | number;
export type MappedTo = MappedToTarget | Record<string, MappedToTarget | null | undefined>;

import type { ReportResult } from "./types/submit";

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

type ReportRoute = { backend: string; mappedTo: MappedToTarget };

const reportRoutes = (
  mappedTo: MappedTo | undefined,
  backend: string | undefined,
): ReportRoute[] => {
  if (typeof mappedTo === "string" || typeof mappedTo === "number") {
    return [{ backend: backend ?? "default", mappedTo }];
  }
  if (!mappedTo) return [];
  if (backend) {
    const target = resolveMappedTo(mappedTo, backend);
    return target === undefined ? [] : [{ backend, mappedTo: target }];
  }
  return Object.entries(mappedTo).flatMap(([routeBackend, target]) =>
    typeof target === "string" || typeof target === "number"
      ? [{ backend: routeBackend, mappedTo: target }]
      : [],
  );
};

export const resolveMappedReportResult = (
  report: { mappedTo?: MappedTo },
  result: { backend?: string; reports: readonly ReportResult[] },
): ReportResult | undefined => {
  const routes = reportRoutes(report.mappedTo, result.backend);
  const matches = result.reports.filter((item) =>
    routes.some(
      (route) =>
        route.backend === item.backend &&
        mappedToKey(route.mappedTo) === mappedToKey(item.mappedTo),
    ),
  );
  if (matches.length > 1) {
    const route = matches[0];
    throw new Error(
      `Duplicate report result for backend "${route?.backend}" and mappedTo "${String(route?.mappedTo)}".`,
    );
  }
  return matches[0];
};

export const resolveMappedReportPayload = (
  report: { id?: string; mappedTo?: MappedTo },
  result: {
    backend?: string;
    reports: readonly ReportResult[];
  },
): unknown => {
  const match = resolveMappedReportResult(report, result);
  return match?.status === "ready" ? match.payload : undefined;
};
