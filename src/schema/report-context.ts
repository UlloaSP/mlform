// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  mappedToKey,
  resolveMappedReportResult,
  resolveMappedTo,
  type MappedTo,
} from "./mapped-to";
import type { NormalizedReportConfig } from "./types/report";
import type { ReportContext, SubmitResult } from "./types/submit";

type ReportContextSource = Pick<SubmitResult, "backend"> & {
  reportContexts?: Record<string, ReportContext>;
};

type ReportContextLookup =
  | string
  | number
  | {
      id?: string;
      mappedTo?: MappedTo;
      config?: {
        id?: string;
        mappedTo?: MappedTo;
      };
    };

const directLookupId = (lookup: ReportContextLookup): string | undefined => {
  if (typeof lookup === "string") {
    return lookup;
  }

  if (typeof lookup === "number") {
    return undefined;
  }

  return lookup.id ?? lookup.config?.id;
};

const resolveLookupTarget = (
  lookup: ReportContextLookup,
  backend: string | undefined,
): string | undefined => {
  if (typeof lookup === "string" || typeof lookup === "number") {
    return String(lookup);
  }

  const target = resolveMappedTo(lookup.mappedTo ?? lookup.config?.mappedTo, backend);
  return target === undefined ? undefined : mappedToKey(target);
};

export const createReportContexts = (
  reports: readonly NormalizedReportConfig[],
  result: Pick<
    SubmitResult,
    "backend" | "displayValues" | "modelValues" | "serializedValues" | "reports" | "meta" | "raw"
  >,
): Record<string, ReportContext> =>
  Object.fromEntries(
    reports.map((report) => {
      const reportResult = resolveMappedReportResult(report, result);
      const context = reportResult?.context;
      const target = reportResult?.mappedTo ?? resolveMappedTo(report.mappedTo, result.backend);
      return [
        report.id,
        {
          reportId: report.id,
          kind: report.kind,
          label: report.label,
          mappedTo: report.mappedTo,
          target,
          targetKey: target === undefined ? undefined : mappedToKey(target),
          backend: reportResult?.backend ?? result.backend,
          displayValues: context?.displayValues ?? result.displayValues ?? {},
          modelValues: context?.modelValues ?? result.modelValues ?? result.serializedValues,
          reports: result.reports,
          meta: context?.meta ?? result.meta,
          raw: context && "raw" in context ? context.raw : result.raw,
        },
      ];
    }),
  );

export const getReportContext = (
  source: ReportContextSource,
  lookup: ReportContextLookup,
): ReportContext | undefined => {
  const contexts = source.reportContexts ?? {};
  const id = directLookupId(lookup);
  if (id && contexts[id]) {
    return contexts[id];
  }

  const targetKey = resolveLookupTarget(lookup, source.backend);
  if (targetKey === undefined) {
    return undefined;
  }

  const matches = Object.values(contexts).filter(
    (context) =>
      context.targetKey === targetKey &&
      (source.backend === undefined || context.backend === source.backend),
  );
  return matches.length === 1 ? matches[0] : undefined;
};
