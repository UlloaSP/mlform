// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { normalizeValuePath, setPathValue } from "../paths";
import { mappedToKey, resolveMappedTo, type MappedTo, type MappedToTarget } from "@/schema";
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

export type SubmissionInputRecord = {
  fieldId: string;
  displayKey?: string;
  label: string;
  value: unknown;
  serializedValue: unknown;
  mappedTo?: string | number;
  modelValues: Record<string, unknown>;
  visible: boolean;
  disabled: boolean;
};

export type SubmissionValueRecords = {
  inputs: SubmissionInputRecord[];
  displayValues: Record<string, unknown>;
  modelValues: Record<string, unknown>;
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
  inputs: cloneValue(records.inputs),
  displayValues: cloneValue(records.displayValues),
  modelValues: cloneValue(records.modelValues),
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

const mappedTargetsFor = (
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

const writeOneHotSubmissionValues = (
  field: SubmissionField,
  backend: string | undefined,
  values: Record<string, unknown>,
  serializedValues: Record<string, unknown>,
): Record<string, unknown> => {
  if (!isOneHotFieldConfig(field.config)) {
    return {};
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

  const modelValues: Record<string, unknown> = {};
  for (const option of field.config.options) {
    const targets = mappedTargetsFor(option.mappedTo, backend);
    if (targets.length === 0) {
      throw new Error(`onehot-category "${field.id}": option "${option.value}" has no mappedTo.`);
    }

    const encoded = selected === option.value ? 1 : 0;
    for (const target of targets) {
      const key = mappedToKey(target);
      if (seen.has(key)) {
        throw new Error(`onehot-category "${field.id}": duplicate mappedTo "${key}".`);
      }
      seen.add(key);

      setSubmissionPath(values, key, field.id, encoded);
      setSubmissionPath(serializedValues, key, field.id, encoded);
      setSubmissionPath(modelValues, key, field.id, encoded);
    }
  }
  return modelValues;
};

const explicitDisplayKeyFor = (field: SubmissionField): string | undefined => {
  if (typeof field.config.displayKey !== "string") {
    return undefined;
  }

  const displayKey = field.config.displayKey.trim();
  return displayKey.length > 0 ? displayKey : undefined;
};

const writeVisibleDisplayValue = (
  displayValues: Record<string, unknown>,
  seenExplicitDisplayKeys: Set<string>,
  field: SubmissionField,
  displayKey: string | undefined,
  value: unknown,
): void => {
  if (!field.state.visible || displayKey === undefined) {
    return;
  }

  if (seenExplicitDisplayKeys.has(displayKey)) {
    throw new Error(`field "${field.id}": duplicate displayKey "${displayKey}".`);
  }
  seenExplicitDisplayKeys.add(displayKey);

  displayValues[displayKey] = cloneValue(value);
};

export const buildSubmissionValueRecords = (
  fields: readonly SubmissionField[],
  backend: string | undefined,
  resolveInactiveFieldPolicy: (field: SubmissionField) => "include" | "omit" | "reset-on-hide",
): SubmissionValueRecords => {
  const inputs: SubmissionInputRecord[] = [];
  const displayValues: Record<string, unknown> = {};
  const values: Record<string, unknown> = {};
  const fieldValues: Record<string, unknown> = {};
  const serializedValues: Record<string, unknown> = {};
  const serializedFieldValues: Record<string, unknown> = {};
  const seenExplicitDisplayKeys = new Set<string>();

  for (const field of fields) {
    if (!shouldIncludeFieldInSubmission(field, resolveInactiveFieldPolicy)) {
      continue;
    }

    const mappedTargets = mappedTargetsFor(field.config.mappedTo, backend);
    const valuePaths =
      mappedTargets.length > 0
        ? mappedTargets.map(mappedToKey)
        : field.config.valuePath === undefined
          ? []
          : [field.config.valuePath];
    const rawValue = field.state.value;
    const serializedValue = field.serialize();
    const displayKey = explicitDisplayKeyFor(field);
    let inputModelValues: Record<string, unknown> = {};

    fieldValues[field.id] = cloneValue(rawValue);
    serializedFieldValues[field.id] = cloneValue(serializedValue);

    if (isOneHotFieldConfig(field.config)) {
      inputModelValues = writeOneHotSubmissionValues(field, backend, values, serializedValues);
      writeVisibleDisplayValue(displayValues, seenExplicitDisplayKeys, field, displayKey, rawValue);
      inputs.push({
        fieldId: field.id,
        displayKey,
        label: field.config.label,
        value: cloneValue(rawValue),
        serializedValue: cloneValue(serializedValue),
        modelValues: cloneValue(inputModelValues),
        visible: field.state.visible,
        disabled: field.state.disabled,
      });
      continue;
    }

    for (const valuePath of valuePaths) {
      const normalizedValuePath = normalizeValuePath(valuePath, field.id);
      setPathValue(values, normalizedValuePath, cloneValue(rawValue));
      setPathValue(serializedValues, normalizedValuePath, cloneValue(serializedValue));
      setPathValue(inputModelValues, normalizedValuePath, cloneValue(serializedValue));
    }

    writeVisibleDisplayValue(displayValues, seenExplicitDisplayKeys, field, displayKey, rawValue);
    inputs.push({
      fieldId: field.id,
      displayKey,
      label: field.config.label,
      value: cloneValue(rawValue),
      serializedValue: cloneValue(serializedValue),
      mappedTo: mappedTargets[0],
      modelValues: cloneValue(inputModelValues),
      visible: field.state.visible,
      disabled: field.state.disabled,
    });
  }

  return {
    inputs,
    displayValues,
    modelValues: cloneValue(serializedValues),
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
