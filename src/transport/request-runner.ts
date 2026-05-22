// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type TransportRequestOutcome<TResult> =
  | {
      status: "completed";
      value: TResult;
    }
  | {
      status: "aborted";
    }
  | {
      status: "failed";
      error: unknown;
      message: string;
    };

export type TransportRequestRunner = {
  run<TResult>(
    submit: (signal: AbortSignal | undefined) => Promise<TResult>,
    signals?: readonly (AbortSignal | undefined)[],
  ): Promise<TransportRequestOutcome<TResult>>;
  abort(reason?: unknown): void;
};

export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string" && error.trim().length > 0) return error;
  return String(error);
};

const isAbortLikeError = (error: unknown): boolean => {
  return error instanceof Error && error.name === "AbortError";
};

const composeAbortSignal = (signals: readonly (AbortSignal | undefined)[]) => {
  const filtered = signals.filter((signal): signal is AbortSignal => signal !== undefined);
  return filtered.length === 0 ? undefined : AbortSignal.any(filtered);
};

export const createTransportRequestRunner = (): TransportRequestRunner => {
  let activeAbortController: AbortController | null = null;

  return {
    async run(submit, signals = []) {
      activeAbortController?.abort("request-restarted");
      const abortController = new AbortController();
      activeAbortController = abortController;
      const signal = composeAbortSignal([...signals, abortController.signal]);

      try {
        const value = await submit(signal);
        if (abortController.signal.aborted || signal?.aborted) {
          return { status: "aborted" };
        }
        return { status: "completed", value };
      } catch (error: unknown) {
        if (abortController.signal.aborted || signal?.aborted || isAbortLikeError(error)) {
          return { status: "aborted" };
        }
        return {
          status: "failed",
          error,
          message: extractErrorMessage(error),
        };
      } finally {
        if (activeAbortController === abortController) {
          activeAbortController = null;
        }
      }
    },
    abort(reason?: unknown) {
      activeAbortController?.abort(reason);
      activeAbortController = null;
    },
  };
};
