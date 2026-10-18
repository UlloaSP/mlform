import type { ReportPresenter } from "mlform/primitives";
import type { BaseReportConfig } from "mlform/schema";
import type { MLFormReportKind } from "mlform/view";
import { defineMLFormPlugin } from "mlform/view";
import { createBuiltinPrimitiveRegistry } from "mlform/primitives";
import { defineReportDefinition } from "mlform/schema";
import { z } from "zod";
import { BACKEND_COMPARE_REPORT_TAG } from "../backend-compare-report.ts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const mappedToTargetSchema = z.union([z.string().min(1), z.number().int().nonnegative()]);
const mappedToSchema = z
  .union([mappedToTargetSchema, z.record(z.string().min(1), mappedToTargetSchema.nullish())])
  .optional();

const baseReportSchema = {
  id: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  mappedTo: mappedToSchema,
};

const extractMaxProbability = (payload: unknown) => {
  if (!isRecord(payload) || !Array.isArray(payload.probabilities)) {
    return null;
  }

  const numericProbabilities = payload.probabilities
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));

  return numericProbabilities.length > 0 ? Math.max(...numericProbabilities) : null;
};

const backendCompareReportDefinition = defineReportDefinition({
  kind: "backend-compare",
  schema: z.object({
    kind: z.literal("backend-compare"),
    ...baseReportSchema,
    backends: z.array(z.string()).min(1).optional(),
    recommendationSource: z.string().optional().default("releaseRecommendation"),
    latencySource: z.string().optional().default("latencyForecast"),
    scoreSource: z.string().optional().default("launchScore"),
  }),
  resolvePayload(config, context) {
    const raw = context.result.raw;
    if (!isRecord(raw) || !isRecord(raw.backends)) {
      return undefined;
    }

    const backendIds =
      Array.isArray(config.backends) && config.backends.length > 0
        ? config.backends
        : Object.keys(raw.backends);

    const backends = raw.backends;
    const items = backendIds
      .map((backendId) => {
        const backend = backends[backendId];
        if (!isRecord(backend) || !isRecord(backend.reports)) {
          return null;
        }

        const recommendation = backend.reports[String(config.recommendationSource)];
        const latency = backend.reports[String(config.latencySource)];
        const launchScore = backend.reports[String(config.scoreSource)];

        return {
          id: backendId,
          label:
            typeof backend.label === "string" && backend.label.length > 0
              ? backend.label
              : backendId,
          prediction:
            isRecord(recommendation) && typeof recommendation.prediction === "string"
              ? recommendation.prediction
              : null,
          confidence: extractMaxProbability(recommendation),
          latencyValue:
            isRecord(latency) && typeof latency.value === "number"
              ? latency.value
              : Number(isRecord(latency) ? latency.value : undefined),
          latencyInterval:
            isRecord(latency) && Array.isArray(latency.interval) ? latency.interval : null,
          launchScore:
            isRecord(launchScore) && typeof launchScore.value === "number"
              ? launchScore.value
              : Number(isRecord(launchScore) ? launchScore.value : undefined),
          executionTime:
            isRecord(recommendation) && typeof recommendation.execution_time === "number"
              ? recommendation.execution_time
              : isRecord(latency) && typeof latency.execution_time === "number"
                ? latency.execution_time
                : isRecord(launchScore) && typeof launchScore.execution_time === "number"
                  ? launchScore.execution_time
                  : null,
        };
      })
      .filter((item) => item !== null);

    return items.length > 0 ? { items } : undefined;
  },
});

const backendCompareReportPresenter: ReportPresenter<BaseReportConfig> = {
  kind: "backend-compare",
  describe(config, context) {
    if (context.state.status === "idle" && context.payload === undefined) {
      return null;
    }

    return {
      component: "backend-compare-report",
      props: {
        id: context.reportId,
        kind: config.kind,
        label: config.label ?? "Backend comparison",
        description: config.description ?? "",
        payload: context.payload,
        error: context.state.error,
        state: context.state.status,
      },
    };
  },
};

const backendCompareReportKind: MLFormReportKind = {
  category: "report",
  kind: backendCompareReportDefinition.kind,
  register(registry, descriptorRegistry) {
    registry.registerReport(backendCompareReportDefinition);
    descriptorRegistry.registerReport(backendCompareReportPresenter);
  },
};

export const BACKEND_COMPARE_PLUGIN = defineMLFormPlugin({
  reports: [backendCompareReportKind],
});

export const createAppPrimitiveRegistry = () =>
  createBuiltinPrimitiveRegistry().registerReport(
    "backend-compare-report",
    BACKEND_COMPARE_REPORT_TAG,
  );
