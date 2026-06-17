// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { normalizeValuePath, setPathValue } from "../paths";
import { mappedToKey, resolveMappedTo, type MappedTo } from "@/schema";
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
  if (field.config.includeInSubmission === false) {
    return false;
  }

  const policy = resolveInactiveFieldPolicy(field);
  const state = field.state;
  const isInactive = !state.visible || state.disabled;

  return !(isInactive && (policy === "omit" || policy === "reset-on-hide"));
};

type OneHotSubmissionOption = {
  value: string;
  mappedTo?: MappedTo;
};

const isOneHotFieldConfig = (
  config: NormalizedFieldConfig,
): config is NormalizedFieldConfig & { options: OneHotSubmissionOption[] } => {
  return (
    config.kind === "onehot-category" && Array.isArray((config as { options?: unknown }).options)
  );
};

const setSubmissionPath = (
  target: Record<string, unknown>,
  path: string,
  fallback: string,
  value: unknown,
): void => {
  setPathValue(target, normalizeValuePath(path, fallback), cloneValue(value));
};

const writeOneHotSubmissionValues = (
  field: SubmissionField,
  backend: string | undefined,
  values: Record<string, unknown>,
  serializedValues: Record<string, unknown>,
): void => {
  if (!isOneHotFieldConfig(field.config)) {
    return;
  }

  const rawSelected = field.state.value;
  if (
    rawSelected !== null &&
    rawSelected !== undefined &&
    typeof rawSelected !== "string" &&
    typeof rawSelected !== "number" &&
    typeof rawSelected !== "boolean" &&
    typeof rawSelected !== "bigint"
  ) {
    throw new Error(`onehot-category "${field.id}": value is not scalar.`);
  }

  const selected =
    rawSelected === null || rawSelected === undefined ? undefined : String(rawSelected);
  const seen = new Set<string>();

  if (selected !== undefined && !field.config.options.some((option) => option.value === selected)) {
    throw new Error(`onehot-category "${field.id}": value "${selected}" is not an option.`);
  }

  for (const option of field.config.options) {
    const target = resolveMappedTo(option.mappedTo, backend);
    if (target === undefined) {
      throw new Error(`onehot-category "${field.id}": option "${option.value}" has no mappedTo.`);
    }

    const key = mappedToKey(target);
    if (seen.has(key)) {
      throw new Error(`onehot-category "${field.id}": duplicate mappedTo "${key}".`);
    }
    seen.add(key);

    const encoded = selected === option.value ? 1 : 0;
    setSubmissionPath(values, key, field.id, encoded);
    setSubmissionPath(serializedValues, key, field.id, encoded);
  }
};

export const buildSubmissionValueRecords = (
  fields: readonly SubmissionField[],
  backend: string | undefined,
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

    const mappedTo = resolveMappedTo(field.config.mappedTo, backend);
    const valuePath =
      mappedTo === undefined
        ? field.config.valuePath
        : typeof mappedTo === "number"
          ? mappedToKey(mappedTo)
          : mappedTo;
    const rawValue = field.state.value;
    const serializedValue = field.serialize();

    fieldValues[field.id] = cloneValue(rawValue);
    serializedFieldValues[field.id] = cloneValue(serializedValue);

    if (isOneHotFieldConfig(field.config)) {
      writeOneHotSubmissionValues(field, backend, values, serializedValues);
      continue;
    }

    if (valuePath === undefined) {
      continue;
    }

    const normalizedValuePath = normalizeValuePath(valuePath, field.id);
    setPathValue(values, normalizedValuePath, cloneValue(rawValue));
    setPathValue(serializedValues, normalizedValuePath, cloneValue(serializedValue));
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
