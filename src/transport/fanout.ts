// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { SubmitRequest, Transport } from "./types";
import { TransportError, transportErrorCodes } from "./errors";

export type FanoutOutcome<TTarget, TValue> =
  | { target: TTarget; status: "fulfilled"; value: TValue }
  | { target: TTarget; status: "rejected"; reason: unknown };

export type CreateFanoutTransportOptions<TTarget, TValue> = {
  targets: readonly TTarget[];
  submit: (target: TTarget, request: SubmitRequest) => Promise<TValue>;
  merge: (outcomes: readonly FanoutOutcome<TTarget, TValue>[], request: SubmitRequest) => unknown;
  failurePolicy?: "collect" | "fail-fast";
};

const aborted = (signal: AbortSignal): TransportError => {
  const reason =
    signal.reason instanceof Error ? signal.reason.message : String(signal.reason ?? "");
  return new TransportError(
    reason || "Transport request was aborted.",
    transportErrorCodes.ABORTED,
  );
};

const withSignal = (request: SubmitRequest, signal: AbortSignal): SubmitRequest =>
  Object.freeze({ ...request, signal });

const awaitWithAbort = async <T>(promise: PromiseLike<T>, signal: AbortSignal): Promise<T> => {
  if (signal.aborted) throw aborted(signal);

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(aborted(signal));
    signal.addEventListener("abort", onAbort, { once: true });
    void Promise.resolve(promise)
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", onAbort));
  });
};

export const createFanoutTransport = <TTarget, TValue>(
  options: CreateFanoutTransportOptions<TTarget, TValue>,
): Transport => ({
  async submit(request) {
    if (request.signal?.aborted) throw aborted(request.signal);

    if (options.failurePolicy === "fail-fast") {
      const controller = new AbortController();
      const signal = request.signal
        ? AbortSignal.any([request.signal, controller.signal])
        : controller.signal;
      let values: TValue[];
      try {
        values = await awaitWithAbort(
          Promise.all(
            options.targets.map((target) => options.submit(target, withSignal(request, signal))),
          ),
          signal,
        );
      } catch (error) {
        controller.abort(error);
        if (request.signal?.aborted) throw aborted(request.signal);
        throw error;
      }
      return options.merge(
        values.map((value, index) => ({
          target: options.targets[index] as TTarget,
          status: "fulfilled" as const,
          value,
        })),
        request,
      );
    }

    const outcomesPromise = Promise.all(
      options.targets.map(async (target): Promise<FanoutOutcome<TTarget, TValue>> => {
        try {
          return { target, status: "fulfilled", value: await options.submit(target, request) };
        } catch (reason) {
          if (request.signal?.aborted) throw aborted(request.signal);
          return { target, status: "rejected", reason };
        }
      }),
    );
    const outcomes = request.signal
      ? await awaitWithAbort(outcomesPromise, request.signal)
      : await outcomesPromise;
    if (request.signal?.aborted) throw aborted(request.signal);
    return options.merge(outcomes, request);
  },
});
