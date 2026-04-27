// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  assertTransportCapabilities,
  inferTransportCapabilities,
  mergeTransportCapabilities,
} from "../capabilities";
import { TransportError, transportErrorCodes } from "../errors";
import {
  chooseWeightedTransport,
  createTransport,
  getTransportScope,
  resolveStreamOrSubmit,
  resolveTransportEntries,
  withCapabilityRequirement,
  withEventMeta,
} from "../internal";
import type {
  LoadBalancingTransportOptions,
  SubmitRequest,
  Transport,
  TransportCapabilities,
} from "../types";

export const createLoadBalancedTransport = <TTransportId extends string = string>(
  options: LoadBalancingTransportOptions<TTransportId>,
): Transport => {
  const transportEntries = resolveTransportEntries(
    options.transports,
    "createLoadBalancedTransport",
  ) as readonly ({ id: TTransportId } & ReturnType<typeof resolveTransportEntries>[number])[];
  const activeCounts = new Map<TTransportId, number>();
  let cursor = 0;

  const resolveWeight = async (request: SubmitRequest, transportId: TTransportId) => {
    if (!options.weights) {
      return 1;
    }
    return typeof options.weights === "function"
      ? options.weights(request, transportId)
      : (options.weights[transportId] ?? 1);
  };

  const resolveHealthWeight = async (request: SubmitRequest, transportId: TTransportId) => {
    const baseWeight = await resolveWeight(request, transportId);
    const snapshot = await options.healthState?.getSnapshot(
      getTransportScope(request, "transport"),
      transportId,
    );
    const penalty = (snapshot?.consecutiveFailures ?? 0) * 0.25;
    return snapshot ? Math.max(0.05, baseWeight - penalty) : baseWeight;
  };

  const pickTransport = async (
    request: SubmitRequest,
  ): Promise<(typeof transportEntries)[number]> => {
    const eligibleEntries = transportEntries.filter((entry) => {
      if (!options.requiredCapabilities) {
        return true;
      }
      try {
        assertTransportCapabilities(
          entry.transport,
          options.requiredCapabilities,
          "createLoadBalancedTransport",
        );
        return true;
      } catch {
        return false;
      }
    });
    if (eligibleEntries.length === 0) {
      throw new TransportError("createLoadBalancedTransport: no eligible transport available.", {
        code: transportErrorCodes.CAPABILITY_MISMATCH,
        retryable: false,
      });
    }
    const strategy = options.strategy ?? "round-robin";

    if (strategy === "random") {
      return eligibleEntries[Math.floor(Math.random() * eligibleEntries.length)]!;
    }

    if (strategy === "least-loaded") {
      return [...eligibleEntries].sort(
        (left, right) => (activeCounts.get(left.id) ?? 0) - (activeCounts.get(right.id) ?? 0),
      )[0]!;
    }

    if (strategy === "weighted" || strategy === "health-weighted") {
      const weights = await Promise.all(
        eligibleEntries.map(async (entry) => ({
          id: entry.id,
          weight:
            strategy === "health-weighted"
              ? await resolveHealthWeight(request, entry.id)
              : await resolveWeight(request, entry.id),
        })),
      );
      const chosenId = await chooseWeightedTransport(
        request,
        eligibleEntries.map((entry) => entry.id),
        Object.fromEntries(weights.map((entry) => [entry.id, entry.weight])) as Partial<
          Record<TTransportId, number>
        >,
      );
      return eligibleEntries.find((entry) => entry.id === chosenId)!;
    }

    const entry = eligibleEntries[cursor % eligibleEntries.length]!;
    cursor += 1;
    return entry;
  };

  const recordSuccess = async (
    request: SubmitRequest,
    transportId: TTransportId,
    startedAt: number,
  ) => {
    activeCounts.set(transportId, Math.max(0, (activeCounts.get(transportId) ?? 1) - 1));
    await options.healthState?.recordSuccess(
      getTransportScope(request, "transport"),
      transportId,
      Date.now() - startedAt,
    );
  };

  const recordFailure = async (
    request: SubmitRequest,
    transportId: TTransportId,
    _startedAt: number,
    error: unknown,
  ) => {
    activeCounts.set(transportId, Math.max(0, (activeCounts.get(transportId) ?? 1) - 1));
    await options.healthState?.recordFailure(
      getTransportScope(request, "transport"),
      transportId,
      error,
    );
  };

  return createTransport(
    async (request) => {
      const entry = await pickTransport(request);
      const startedAt = Date.now();
      activeCounts.set(entry.id, (activeCounts.get(entry.id) ?? 0) + 1);
      try {
        request = withCapabilityRequirement(
          request,
          options.requiredCapabilities,
          entry.transport,
          "createLoadBalancedTransport",
        );
        const result = await entry.transport.submit(request);
        await recordSuccess(request, entry.id, startedAt);
        return result;
      } catch (error) {
        await recordFailure(request, entry.id, startedAt, error);
        throw error;
      }
    },
    async function* (request) {
      const entry = await pickTransport(request);
      const startedAt = Date.now();
      activeCounts.set(entry.id, (activeCounts.get(entry.id) ?? 0) + 1);
      try {
        request = withCapabilityRequirement(
          request,
          options.requiredCapabilities,
          entry.transport,
          "createLoadBalancedTransport.stream",
        );
        const stream = await resolveStreamOrSubmit(entry.transport, request);
        for await (const event of stream) {
          yield withEventMeta(event, {
            source: entry.id,
          });
        }
        await recordSuccess(request, entry.id, startedAt);
      } catch (error) {
        await recordFailure(request, entry.id, startedAt, error);
        throw error;
      }
    },
    {
      capabilities: transportEntries.reduce<TransportCapabilities | undefined>((caps, entry) => {
        return mergeTransportCapabilities(caps, inferTransportCapabilities(entry.transport));
      }, undefined),
    },
  );
};
