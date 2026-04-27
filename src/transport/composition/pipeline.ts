// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { inferTransportCapabilities, mergeTransportCapabilities } from "../capabilities";
import { transportErrorMessages } from "../constants";
import {
  createTransport,
  normalizeRequest,
  resolveStreamOrSubmit,
  withCapabilityRequirement,
  withEventMeta,
} from "../internal";
import type {
  PipelineTransportOptions,
  SubmitRequest,
  Transport,
  TransportCapabilities,
} from "../types";

export const createPipelineTransport = (options: PipelineTransportOptions): Transport => {
  if (options.stages.length === 0) {
    throw new TypeError(transportErrorMessages.emptyPipeline);
  }

  return createTransport(
    async (request: SubmitRequest) => {
      let currentRequest = request;
      let lastResponse: unknown;

      for (const stage of options.stages) {
        if (request.signal?.aborted) {
          throw new Error(
            transportErrorMessages.pipelineAborted(
              stage.id ?? `stage[${options.stages.indexOf(stage)}]`,
            ),
          );
        }

        currentRequest = normalizeRequest(
          currentRequest,
          stage.transport,
          "createPipelineTransport",
        );
        lastResponse = await stage.transport.submit(currentRequest);

        if (stage.mapToNext) {
          currentRequest = await stage.mapToNext(lastResponse, request);
          const nextStage = options.stages[options.stages.indexOf(stage) + 1];
          if (nextStage?.nextStageRequirements) {
            currentRequest = withCapabilityRequirement(
              currentRequest,
              nextStage.nextStageRequirements,
              nextStage.transport,
              "createPipelineTransport.nextStage",
            );
          }
        }
      }

      return lastResponse;
    },
    async function* (request: SubmitRequest) {
      let currentRequest = request;
      let lastResponse: unknown;

      for (const [stageIndex, stage] of options.stages.entries()) {
        if (request.signal?.aborted) {
          throw new Error(
            transportErrorMessages.pipelineAborted(stage.id ?? `stage[${stageIndex}]`),
          );
        }

        currentRequest = withCapabilityRequirement(
          currentRequest,
          undefined,
          stage.transport,
          "createPipelineTransport.stream",
        );
        const stream = await resolveStreamOrSubmit(stage.transport, currentRequest);
        for await (const event of stream) {
          const annotatedEvent = withEventMeta(event, {
            stage: stage.id ?? `stage[${stageIndex}]`,
          });

          if (event.type === "result") {
            lastResponse = event.result;
            yield annotatedEvent;
            break;
          }

          if (event.type === "error") {
            throw event.error;
          }

          yield annotatedEvent;
        }

        if (stage.mapToNext) {
          currentRequest = await stage.mapToNext(lastResponse, request);
          const nextStage = options.stages[stageIndex + 1];
          if (nextStage?.nextStageRequirements) {
            currentRequest = withCapabilityRequirement(
              currentRequest,
              nextStage.nextStageRequirements,
              nextStage.transport,
              "createPipelineTransport.nextStage",
            );
          }
        }
      }

      yield {
        type: "result",
        result: lastResponse,
        meta: {
          source: "pipeline",
        },
      };
    },
    {
      capabilities: options.stages.reduce<TransportCapabilities | undefined>((caps, stage) => {
        return mergeTransportCapabilities(caps, inferTransportCapabilities(stage.transport));
      }, undefined),
    },
  );
};
