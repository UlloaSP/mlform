// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { SubmitRequest, Transport } from "./types";

export type FanoutOutcome<TTarget, TValue> =
  | { target: TTarget; status: "fulfilled"; value: TValue }
  | { target: TTarget; status: "rejected"; reason: unknown };

export type CreateFanoutTransportOptions<TTarget, TValue> = {
  targets: readonly TTarget[];
  submit: (target: TTarget, request: SubmitRequest) => Promise<TValue>;
  merge: (outcomes: readonly FanoutOutcome<TTarget, TValue>[], request: SubmitRequest) => unknown;
  failurePolicy?: "collect" | "fail-fast";
};

export const createFanoutTransport = <TTarget, TValue>(
  options: CreateFanoutTransportOptions<TTarget, TValue>,
): Transport => ({
  async submit(request) {
    if (options.failurePolicy === "fail-fast") {
      const values = await Promise.all(
        options.targets.map((target) => options.submit(target, request)),
      );
      return options.merge(
        values.map((value, index) => ({
          target: options.targets[index] as TTarget,
          status: "fulfilled" as const,
          value,
        })),
        request,
      );
    }

    const outcomes = await Promise.all(
      options.targets.map(async (target): Promise<FanoutOutcome<TTarget, TValue>> => {
        try {
          return { target, status: "fulfilled", value: await options.submit(target, request) };
        } catch (reason) {
          return { target, status: "rejected", reason };
        }
      }),
    );
    return options.merge(outcomes, request);
  },
});
