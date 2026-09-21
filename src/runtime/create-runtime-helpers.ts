// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError } from "./errors";
import { createAbortError } from "./errors";
import type { CreateFormConfig, InactiveFieldPolicy } from "./types";

export const assertTransport = (transport: CreateFormConfig["transport"]): void => {
  if (!transport || typeof transport.submit !== "function") {
    throw new EngineError("createForm requires a transport with a submit(request) function.");
  }
};

export const resolveInactiveFieldPolicy = (
  field: {
    readonly config: { readonly inactiveFieldPolicy?: InactiveFieldPolicy };
  },
  fallbackPolicy: InactiveFieldPolicy | undefined,
): InactiveFieldPolicy => {
  return field.config.inactiveFieldPolicy ?? fallbackPolicy ?? "omit";
};

export const missingDefinitionError = (type: string, kind: string): EngineError => {
  return new EngineError(`${type} definition "${kind}" disappeared during form creation.`);
};

export const waitForBehaviorChanges = (
  completion: Promise<void>,
  signal: AbortSignal | undefined,
): Promise<void> => {
  if (!signal) return completion;
  if (signal.aborted) return Promise.reject(createAbortError(String(signal.reason ?? "")));

  return new Promise<void>((resolve, reject) => {
    const onAbort = () => reject(createAbortError(String(signal.reason ?? "")));
    signal.addEventListener("abort", onAbort, { once: true });
    void completion.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", onAbort);
    });
  });
};
