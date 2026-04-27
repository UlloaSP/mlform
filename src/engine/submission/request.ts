// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { normalizeValuePath, setPathValue } from "../paths";
import type { NormalizedFieldConfig, TransportResponse } from "../types";
import { cloneValue } from "../values";
import { isRecord } from "../utils";

type SubmissionField = {
  readonly id: string;
  readonly config: NormalizedFieldConfig;
  readonly state: {
    value: unknown;
    visible: boolean;
    disabled: boolean;
  };
  serialize(): unknown;
};

export type SubmissionValueRecords = {
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
};

export const estimatePayloadBytes = (value: unknown): number | undefined => {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return undefined;
  }
};

export const cloneSubmissionValueRecords = (
  records: SubmissionValueRecords,
): SubmissionValueRecords => ({
  values: cloneValue(records.values),
  fieldValues: cloneValue(records.fieldValues),
  serializedValues: cloneValue(records.serializedValues),
  serializedFieldValues: cloneValue(records.serializedFieldValues),
});

export const shouldIncludeFieldInSubmission = (
  field: SubmissionField,
  resolveInactiveFieldPolicy: (field: SubmissionField) => "include" | "omit" | "reset-on-hide",
): boolean => {
  const policy = resolveInactiveFieldPolicy(field);
  const state = field.state;
  const isInactive = !state.visible || state.disabled;

  return !(isInactive && (policy === "omit" || policy === "reset-on-hide"));
};

export const buildSubmissionValueRecords = (
  fields: readonly SubmissionField[],
  resolveInactiveFieldPolicy: (field: SubmissionField) => "include" | "omit" | "reset-on-hide",
): SubmissionValueRecords => {
  const values: Record<string, unknown> = {};
  const fieldValues: Record<string, unknown> = {};
  const serializedValues: Record<string, unknown> = {};
  const serializedFieldValues: Record<string, unknown> = {};

  for (const field of fields) {
    if (!shouldIncludeFieldInSubmission(field, resolveInactiveFieldPolicy)) {
      continue;
    }

    const valuePath = normalizeValuePath(field.config.valuePath, field.id);
    const rawValue = field.state.value;
    const serializedValue = field.serialize();

    fieldValues[field.id] = cloneValue(rawValue);
    serializedFieldValues[field.id] = cloneValue(serializedValue);
    setPathValue(values, valuePath, cloneValue(rawValue));
    setPathValue(serializedValues, valuePath, cloneValue(serializedValue));
  }

  return {
    values,
    fieldValues,
    serializedValues,
    serializedFieldValues,
  };
};

export const normalizeTransportResponse = (response: unknown): TransportResponse => {
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
