// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { NormalizedFormSchema } from "@/schema";
import type { SubmitRequest } from "../types";
import { deepFreeze } from "../utils";
import { cloneValue } from "../values";
import { cloneSubmissionValueRecords, type SubmissionValueRecords } from "./request";

type CreateTransportRequestOptions = {
  backend: string | undefined;
  records: SubmissionValueRecords;
  schema: NormalizedFormSchema;
  signal: AbortSignal;
};

export const createTransportRequest = ({
  backend,
  records,
  schema,
  signal,
}: CreateTransportRequestOptions): SubmitRequest => {
  const frozenRecords = deepFreeze(cloneSubmissionValueRecords(records));

  return Object.freeze({
    backend,
    ...frozenRecords,
    fields: deepFreeze(cloneValue(schema.fields)),
    reports: deepFreeze(cloneValue(schema.reports)),
    signal,
  });
};
