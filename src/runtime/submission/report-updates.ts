// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { cloneValue } from "../values";
import type { SubmitResult } from "../types";
import type { LiveSubmissionReport } from "./types";
import type { SubmissionValueRecords } from "./request";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const applyPatchValue = (
  current: unknown,
  patch: unknown,
  strategy: "replace" | "shallow-merge" | "deep-merge" = "deep-merge",
): unknown => {
  if (strategy === "replace") {
    return cloneValue(patch);
  }

  if (strategy === "shallow-merge") {
    if (!isRecord(current) || !isRecord(patch)) {
      return cloneValue(patch);
    }
    return {
      ...cloneValue(current),
      ...cloneValue(patch),
    };
  }

  if (!isRecord(current) || !isRecord(patch)) {
    return cloneValue(patch);
  }

  const merged: Record<string, unknown> = { ...cloneValue(current) };
  for (const [key, value] of Object.entries(patch)) {
    merged[key] =
      key in merged ? applyPatchValue(merged[key], value, "deep-merge") : cloneValue(value);
  }
  return merged;
};

type CreateReportUpdatesOptions = {
  reportMap: Map<string, LiveSubmissionReport>;
  getReportState: (reportId: string) => { payload?: unknown } | undefined;
  getReportStates: () => Record<string, unknown>;
  getSubmissionMeta: () => Record<string, unknown>;
  storePendingPatch: (reportId: string, patch: Record<string, unknown>) => void;
};

export const createReportUpdates = ({
  reportMap,
  getReportState,
  getReportStates,
  getSubmissionMeta,
  storePendingPatch,
}: CreateReportUpdatesOptions) => {
  const applyReportReplace = (reportId: string, payload: unknown): void => {
    const report = reportMap.get(reportId);
    if (!report) {
      return;
    }

    report.commitState({
      payload: cloneValue(payload),
      error: null,
      status: payload === undefined ? "idle" : "ready",
    });
  };

  const createLivePartialResult = (
    records: SubmissionValueRecords,
    backend: string | undefined,
    reportId: string,
    payload: unknown,
  ): SubmitResult => {
    const report = reportMap.get(reportId);
    const source = report?.config?.source ?? reportId;

    return {
      backend,
      values: cloneValue(records.values),
      fieldValues: cloneValue(records.fieldValues),
      serializedValues: cloneValue(records.serializedValues),
      serializedFieldValues: cloneValue(records.serializedFieldValues),
      reports: {
        [source]: cloneValue(payload),
      },
      reportStates: cloneValue(getReportStates()) as SubmitResult["reportStates"],
      meta: cloneValue(getSubmissionMeta()),
      raw: cloneValue(payload),
    };
  };

  const applyValidatedReportReplace = async (
    reportId: string,
    payload: unknown,
    records: SubmissionValueRecords,
    backend: string | undefined,
  ): Promise<void> => {
    const report = reportMap.get(reportId);
    if (!report) {
      return;
    }

    if (report.partialUpdatePolicy === "trust") {
      applyReportReplace(reportId, payload);
      return;
    }

    if (report.partialUpdatePolicy === "defer") {
      storePendingPatch(reportId, {
        type: "replace",
        payload: cloneValue(payload),
      });
      return;
    }

    try {
      const nextState = await report.prepareState(
        createLivePartialResult(records, backend, reportId, payload),
      );
      report.commitState(nextState);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.commitState({
        payload: undefined,
        error: message,
        status: "error",
      });
    }
  };

  const applyReportPatch = (
    reportId: string,
    patch: unknown,
    strategy: "replace" | "shallow-merge" | "deep-merge" = "deep-merge",
  ): void => {
    const report = reportMap.get(reportId);
    if (!report) {
      return;
    }

    const current = getReportState(reportId);
    const nextPayload = applyPatchValue(current?.payload, patch, strategy);
    report.commitState({
      payload: nextPayload,
      error: null,
      status: nextPayload === undefined ? "idle" : "ready",
    });
  };

  const applyValidatedReportPatch = async (
    reportId: string,
    patch: unknown,
    strategy: "replace" | "shallow-merge" | "deep-merge" = "deep-merge",
    records: SubmissionValueRecords,
    backend: string | undefined,
  ): Promise<void> => {
    const report = reportMap.get(reportId);
    if (!report) {
      return;
    }

    if (report.partialUpdatePolicy === "trust") {
      applyReportPatch(reportId, patch, strategy);
      return;
    }

    if (report.partialUpdatePolicy === "defer") {
      storePendingPatch(reportId, {
        type: "patch",
        patch: cloneValue(patch),
        strategy,
      });
      return;
    }

    const current = getReportState(reportId);
    const nextPayload = applyPatchValue(current?.payload, patch, strategy);

    try {
      const nextState = await report.prepareState(
        createLivePartialResult(records, backend, reportId, nextPayload),
      );
      report.commitState(nextState);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.commitState({
        payload: undefined,
        error: message,
        status: "error",
      });
    }
  };

  return {
    applyValidatedReportReplace,
    applyValidatedReportPatch,
  };
};
