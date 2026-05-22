// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type PrimitiveRequestOutcome =
  | { status: "completed"; value: unknown }
  | { status: "failed"; message: string }
  | { status: "aborted" };

const extractErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const createPrimitiveRequestRunner = () => {
  let controller: AbortController | null = null;

  return {
    abort(): void {
      controller?.abort();
      controller = null;
    },
    async run(task: (signal: AbortSignal) => Promise<unknown>): Promise<PrimitiveRequestOutcome> {
      controller?.abort();
      controller = new AbortController();
      const current = controller;

      try {
        const value = await task(current.signal);
        if (current.signal.aborted) return { status: "aborted" };
        return { status: "completed", value };
      } catch (error) {
        if (current.signal.aborted) return { status: "aborted" };
        return { status: "failed", message: extractErrorMessage(error) };
      } finally {
        if (controller === current) controller = null;
      }
    },
  };
};
