// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { inferTransportCapabilities, mergeTransportCapabilities } from "../capabilities";
import { transportErrorMessages } from "../constants";
import {
  chooseWeightedTransport,
  createTransport,
  resolveStreamOrSubmit,
  resolveTransportEntries,
  withCapabilityRequirement,
} from "../internal";
import type {
  RoutingTransportOptions,
  SubmitRequest,
  Transport,
  TransportCapabilities,
  WeightedRoutingTransportOptions,
} from "../types";

export const createRoutingTransport = <TTransportId extends string = string>(
  options: RoutingTransportOptions<TTransportId>,
): Transport => {
  const transportEntries = resolveTransportEntries(
    options.transports,
    "createRoutingTransport",
  ) as readonly ({ id: TTransportId } & ReturnType<typeof resolveTransportEntries>[number])[];
  const transportIds = transportEntries.map((entry) => entry.id);

  return createTransport(
    async (request: SubmitRequest) => {
      const transportId = await options.selectTransport(request, {
        transportIds,
      });
      const selectedTransport = options.transports[transportId];
      if (!selectedTransport) {
        throw new Error(
          transportErrorMessages.unknownComposedTransport(
            "createRoutingTransport",
            String(transportId),
            transportIds,
          ),
        );
      }

      request = withCapabilityRequirement(
        request,
        options.requiredCapabilities,
        selectedTransport,
        "createRoutingTransport",
      );
      return selectedTransport.submit(request);
    },
    async (request: SubmitRequest) => {
      const transportId = await options.selectTransport(request, {
        transportIds,
      });
      const selectedTransport = options.transports[transportId];
      if (!selectedTransport) {
        throw new Error(
          transportErrorMessages.unknownComposedTransport(
            "createRoutingTransport",
            String(transportId),
            transportIds,
          ),
        );
      }

      request = withCapabilityRequirement(
        request,
        options.requiredCapabilities,
        selectedTransport,
        "createRoutingTransport.stream",
      );
      return resolveStreamOrSubmit(selectedTransport, request);
    },
    {
      capabilities: transportEntries.reduce<TransportCapabilities | undefined>((caps, entry) => {
        return mergeTransportCapabilities(caps, inferTransportCapabilities(entry.transport));
      }, undefined),
    },
  );
};

export const createWeightedRoutingTransport = <TTransportId extends string = string>(
  options: WeightedRoutingTransportOptions<TTransportId>,
): Transport => {
  const transportIds = Object.keys(options.transports) as TTransportId[];

  return createRoutingTransport({
    transports: options.transports,
    requiredCapabilities: options.requiredCapabilities,
    selectTransport: (request) =>
      chooseWeightedTransport(request, transportIds, options.weights, options.filter),
  });
};
