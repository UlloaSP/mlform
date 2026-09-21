// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormController, FormPersistenceAdapter } from "../types";

export const saveFormSnapshot = async (
  form: FormController,
  adapter: FormPersistenceAdapter,
  key: string,
): Promise<void> => {
  await adapter.save(key, form.createSnapshot());
};

export const restoreFormSnapshot = async (
  form: FormController,
  adapter: FormPersistenceAdapter,
  key: string,
): Promise<boolean> => {
  const snapshot = await adapter.load(key);
  if (snapshot === null) return false;
  form.restoreSnapshot(snapshot);
  return true;
};

export const removeFormSnapshot = async (
  adapter: FormPersistenceAdapter,
  key: string,
): Promise<void> => {
  await adapter.remove(key);
};
