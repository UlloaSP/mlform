// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { mappedToKey, resolveMappedTo, type MappedTo } from "./mapped-to";

export type OneHotDisplayOption = {
  label?: string;
  value: string;
  mappedTo?: MappedTo;
};

export type OneHotDisplayField = {
  id?: string;
  kind?: string;
  options?: readonly OneHotDisplayOption[];
};

export interface ResolveOneHotDisplayValueOptions {
  backend?: string;
}

const isSelectedOneHotValue = (value: unknown): boolean =>
  value === 1 || value === "1" || value === true;

export const resolveOneHotDisplayValue = (
  field: OneHotDisplayField,
  modelValues: Record<string, unknown>,
  options: ResolveOneHotDisplayValueOptions = {},
): string | undefined => {
  if (field.kind !== "onehot-category" || !Array.isArray(field.options)) {
    return undefined;
  }

  const seenTargets = new Set<string>();
  let selected: string | undefined;

  for (const option of field.options) {
    const target = resolveMappedTo(option.mappedTo, options.backend);
    if (target === undefined) {
      throw new Error(
        `onehot-category "${field.id ?? field.kind}": option "${option.value}" has no mappedTo.`,
      );
    }

    const key = mappedToKey(target);
    if (seenTargets.has(key)) {
      throw new Error(`onehot-category "${field.id ?? field.kind}": duplicate mappedTo "${key}".`);
    }
    seenTargets.add(key);

    if (!isSelectedOneHotValue(modelValues[key])) {
      continue;
    }

    if (selected !== undefined) {
      throw new Error(
        `onehot-category "${field.id ?? field.kind}": multiple selected mapped values.`,
      );
    }
    selected = option.value;
  }

  return selected;
};
