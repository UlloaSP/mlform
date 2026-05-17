// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { TransportStreamEvent } from "../types";
import type { SubmissionValueRecords } from "./request";

export type ApplySubmissionStreamEventOptions = {
  event: TransportStreamEvent;
  records: SubmissionValueRecords;
  backend: string | undefined;
  applyValidatedReportReplace: (
    reportId: string,
    payload: unknown,
    records: SubmissionValueRecords,
    backend: string | undefined,
  ) => Promise<void>;
  applyValidatedReportPatch: (
    reportId: string,
    patch: unknown,
    strategy: "replace" | "shallow-merge" | "deep-merge" | undefined,
    records: SubmissionValueRecords,
    backend: string | undefined,
  ) => Promise<void>;
  applyFieldUpdate: (event: Extract<TransportStreamEvent, { type: "field-update" }>) => void;
};

const applyReportPatchEvent = async (
  options: ApplySubmissionStreamEventOptions,
  event: Extract<TransportStreamEvent, { type: "report-patch" }>,
): Promise<void> => {
  await options.applyValidatedReportPatch(
    event.reportId,
    event.patch,
    event.strategy,
    options.records,
    options.backend,
  );
};

export const applySubmissionStreamEvent = async ({
  event,
  records,
  backend,
  applyValidatedReportReplace,
  applyValidatedReportPatch,
  applyFieldUpdate,
}: ApplySubmissionStreamEventOptions): Promise<void> => {
  switch (event.type) {
    case "report-replace":
      await applyValidatedReportReplace(event.reportId, event.payload, records, backend);
      break;
    case "report-patch":
      await applyReportPatchEvent(
        {
          event,
          records,
          backend,
          applyValidatedReportReplace,
          applyValidatedReportPatch,
          applyFieldUpdate,
        },
        event,
      );
      break;
    case "field-update":
      applyFieldUpdate(event);
      break;
    default:
      break;
  }
};
