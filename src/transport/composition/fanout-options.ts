// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  assertTransportCapabilities,
  inferTransportCapabilities,
  mergeTransportCapabilities,
} from "../capabilities";
import type { FanoutTransportOptions, SubmitRequest, TransportCapabilities } from "../types";

export type FanoutTransportEntry<TTransportId extends string> = {
  id: TTransportId | undefined;
  index: number;
  transport: import("../types").Transport;
};

export const resolveActiveFanoutEntries = async <TTransportId extends string>(
  entries: readonly FanoutTransportEntry<TTransportId>[],
  options: FanoutTransportOptions<TTransportId>,
  request: SubmitRequest,
): Promise<readonly FanoutTransportEntry<TTransportId>[]> => {
  let activeEntries = entries;

  if (options.filter) {
    const filterResults = await Promise.all(
      entries.map(async (entry) => ({
        entry,
        include: await options.filter!(entry.id ?? String(entry.index), request),
      })),
    );
    activeEntries = filterResults.filter((result) => result.include).map((result) => result.entry);
  }

  if (options.requiredCapabilities) {
    activeEntries = activeEntries.filter((entry) => {
      try {
        assertTransportCapabilities(
          entry.transport,
          options.requiredCapabilities!,
          "createFanoutTransport",
        );
        return true;
      } catch {
        return false;
      }
    });
  }

  return activeEntries;
};

export const collectFanoutCapabilities = (
  entries: readonly FanoutTransportEntry<string>[],
): TransportCapabilities | undefined => {
  return entries.reduce<TransportCapabilities | undefined>((caps, entry) => {
    return mergeTransportCapabilities(caps, inferTransportCapabilities(entry.transport));
  }, undefined);
};

export const createFanoutAbortOthers = (controllers: readonly AbortController[]) => {
  let abortTriggered = false;

  return (reason: string, skipIndex: number): void => {
    if (abortTriggered) {
      return;
    }
    abortTriggered = true;
    for (const [index, controller] of controllers.entries()) {
      if (index !== skipIndex) {
        controller.abort(reason);
      }
    }
  };
};
