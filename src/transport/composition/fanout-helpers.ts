// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createAggregateFailure } from "../internal";
import type { FanoutTransportFailure } from "../types";

const formatFanoutFailureSource = (failure: FanoutTransportFailure): string => {
  return failure.id ?? `transport[${failure.index}]`;
};

export const createFanoutFailure = (failures: readonly FanoutTransportFailure[]): Error => {
  return createAggregateFailure(
    `createFanoutTransport failed for ${failures.map(formatFanoutFailureSource).join(", ")}.`,
    failures.map((failure) => ({
      label: formatFanoutFailureSource(failure),
      error: failure.error,
    })),
  );
};
