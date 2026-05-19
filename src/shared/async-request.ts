// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type AsyncRequestOutcome<TResult> =
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

export type AsyncRequestRunner = {
  run<TResult>(
    submit: (signal: AbortSignal | undefined) => Promise<TResult>,
    signals?: readonly (AbortSignal | undefined)[],
  ): Promise<AsyncRequestOutcome<TResult>>;
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

const combineAbortSignals = (signals: readonly (AbortSignal | undefined)[]) => {
  const filtered = signals.filter((signal): signal is AbortSignal => signal !== undefined);
  if (filtered.length === 0) {
    return {
      signal: undefined,
      cleanup: () => {},
    };
  }

  const controller = new AbortController();
  const cleanups: Array<() => void> = [];

  for (const signal of filtered) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return {
        signal: controller.signal,
        cleanup: () => {},
      };
    }

    const onAbort = () => controller.abort(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    cleanups.push(() => signal.removeEventListener("abort", onAbort));
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    },
  };
};

export const createAsyncRequestRunner = (): AsyncRequestRunner => {
  let activeAbortController: AbortController | null = null;

  return {
    async run(submit, signals = []) {
      activeAbortController?.abort("request-restarted");
      const abortController = new AbortController();
      activeAbortController = abortController;
      const combined = combineAbortSignals([...signals, abortController.signal]);

      try {
        const value = await submit(combined.signal);
        if (abortController.signal.aborted || combined.signal?.aborted) {
          return { status: "aborted" };
        }
        return { status: "completed", value };
      } catch (error: unknown) {
        if (abortController.signal.aborted || combined.signal?.aborted || isAbortLikeError(error)) {
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
        combined.cleanup();
      }
    },
    abort(reason?: unknown) {
      activeAbortController?.abort(reason);
      activeAbortController = null;
    },
  };
};
