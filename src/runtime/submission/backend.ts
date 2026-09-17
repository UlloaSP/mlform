// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError } from "../errors";

export const isBackendIdentity = (backend: unknown): backend is string =>
  typeof backend === "string" && backend.trim().length > 0;

export const assertBackendIdentity = (backend: string | undefined): void => {
  if (backend !== undefined && !isBackendIdentity(backend)) {
    throw new EngineError("Backend identity must be a non-empty string.");
  }
};

export const assertUniqueBackendIdentities = (backends: readonly unknown[]): void => {
  const seen = new Set<string>();
  for (const backend of backends) {
    if (!isBackendIdentity(backend)) {
      throw new EngineError("Backend identities must be non-empty strings.");
    }
    if (seen.has(backend)) {
      throw new EngineError(`Duplicate backend "${backend}" in multi-backend submission.`);
    }
    seen.add(backend);
  }
};
