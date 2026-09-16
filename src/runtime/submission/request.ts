// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { normalizeValuePath, setPathValue } from "../paths";
import { mappedToKey, type SubmissionInputRecord } from "@/schema";
import type { NormalizedFieldConfig } from "../types";
import { cloneValue } from "../values";

type SubmissionField = {
  readonly id: string;
  readonly config: NormalizedFieldConfig;
  readonly state: {
    value: unknown;
    visible: boolean;
    disabled: boolean;
  };
  serialize(): unknown;
  getMappedTargets(backend?: string): readonly (string | number)[];
  getSubmissionEntries(
    backend?: string,
  ): readonly { target: string | number; value: unknown }[] | undefined;
};

export type SubmissionValueRecords = {
  inputs: SubmissionInputRecord[];
  displayValues: Record<string, unknown>;
  modelValues: Record<string, unknown>;
};

export const cloneSubmissionValueRecords = (
  records: SubmissionValueRecords,
): SubmissionValueRecords => ({
  inputs: cloneValue(records.inputs),
  displayValues: cloneValue(records.displayValues),
  modelValues: cloneValue(records.modelValues),
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

const setSubmissionPath = (
  target: Record<string, unknown>,
  path: string,
  fallback: string,
  value: unknown,
): void => {
  setPathValue(target, normalizeValuePath(path, fallback), cloneValue(value));
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
  const modelValues: Record<string, unknown> = {};
  const seenExplicitDisplayKeys = new Set<string>();

  for (const field of fields) {
    if (!shouldIncludeFieldInSubmission(field, resolveInactiveFieldPolicy)) {
      continue;
    }

    const mappedTargets = field.getMappedTargets(backend);
    const valuePaths =
      mappedTargets.length > 0
        ? mappedTargets.map(mappedToKey)
        : field.config.valuePath === undefined
          ? []
          : [field.config.valuePath];
    const rawValue = field.state.value;
    const serializedValue = field.serialize();
    const displayKey = explicitDisplayKeyFor(field);
    const inputModelValues: Record<string, unknown> = {};

    const submissionEntries = field.getSubmissionEntries(backend);
    if (submissionEntries) {
      const declaredTargets = new Set(mappedTargets.map(mappedToKey));
      const emittedTargets = new Set<string>();
      for (const entry of submissionEntries) {
        const entryTarget = mappedToKey(entry.target);
        if (!declaredTargets.has(entryTarget)) {
          throw new Error(
            `field "${field.id}": submission target "${entryTarget}" was not declared by getMappedTargets.`,
          );
        }
        if (emittedTargets.has(entryTarget)) {
          throw new Error(
            `field "${field.id}": duplicate submission target "${entryTarget}" was emitted.`,
          );
        }
        emittedTargets.add(entryTarget);
        setSubmissionPath(inputModelValues, entryTarget, field.id, entry.value);
        setSubmissionPath(modelValues, entryTarget, field.id, entry.value);
      }
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
      setPathValue(modelValues, normalizedValuePath, cloneValue(serializedValue));
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
    modelValues,
  };
};
