import { defineMLFormPlugin } from "mlform/view";
import { defineReportDefinition, resolveMappedReportPayload } from "mlform/schema";
import { z } from "zod";

const mappedToTargetSchema = z.union([z.string().min(1), z.number().int().nonnegative()]);
const mappedToSchema = z
  .union([mappedToTargetSchema, z.record(z.string().min(1), mappedToTargetSchema.nullish())])
  .optional();

const baseReportSchema = {
  id: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  mappedTo: mappedToSchema,
  ui: z.record(z.string(), z.unknown()).optional(),
};

const formulationPredictionReportDefinition = defineReportDefinition({
  kind: "formulation-prediction",
  schema: z.object({
    kind: z.literal("formulation-prediction"),
    ...baseReportSchema,
  }),
  resolvePayload(config, context) {
    return resolveMappedReportPayload(context.report, context.result);
  },
});

const formulationPredictionReportPresenter = {
  kind: "formulation-prediction",
  describe(config, context) {
    return {
      component: "formulation-prediction-report",
      props: {
        id: context.reportId,
        kind: config.kind,
        label: config.label ?? "Prediction",
        description: config.description ?? "",
        payload: context.payload,
        error: context.state.error,
        state: context.state.status,
      },
    };
  },
};

const formulationPredictionReportKind = {
  category: "report",
  kind: formulationPredictionReportDefinition.kind,
  register(registry, descriptorRegistry) {
    registry.registerReport(formulationPredictionReportDefinition);
    descriptorRegistry.registerReport(formulationPredictionReportPresenter);
  },
};

export const FORMULATION_PLUGIN = defineMLFormPlugin({
  reports: [formulationPredictionReportKind],
});
