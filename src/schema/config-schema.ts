// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import type { DeclarativeFieldCondition, FieldConfig } from "./types/field";
import type { ReportConfig } from "./types/report";

const mappedToTargetSchema = z.union([z.string().min(1), z.number().int().nonnegative()]);

export const mappedToSchema = z
  .union([mappedToTargetSchema, z.record(z.string().min(1), mappedToTargetSchema.nullish())])
  .optional();

const functionFieldConditionSchema = z.custom<(context: unknown) => boolean>(
  (value) => typeof value === "function",
);

const formStatusSchema = z.enum([
  "idle",
  "editing",
  "validating",
  "submitting",
  "success",
  "error",
]);

const declarativeFieldConditionSchema: z.ZodType<DeclarativeFieldCondition> = z.lazy(() =>
  z.union([
    z.object({
      kind: z.literal("field-value"),
      field: z.string().min(1),
      equals: z.unknown().optional(),
      notEquals: z.unknown().optional(),
      greaterThan: z.unknown().optional(),
      greaterThanOrEqual: z.unknown().optional(),
      lessThan: z.unknown().optional(),
      lessThanOrEqual: z.unknown().optional(),
      in: z.array(z.unknown()).optional(),
      notIn: z.array(z.unknown()).optional(),
      empty: z.boolean().optional(),
      notEmpty: z.boolean().optional(),
      truthy: z.boolean().optional(),
      falsy: z.boolean().optional(),
    }),
    z.object({
      kind: z.literal("field-comparison"),
      field: z.string().min(1),
      otherField: z.string().min(1),
      operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte"]),
    }),
    z.object({
      kind: z.literal("form-status"),
      equals: z.union([formStatusSchema, z.array(formStatusSchema).min(1)]),
    }),
    z.object({
      kind: z.literal("submit-count"),
      eq: z.number().int().nonnegative().optional(),
      gte: z.number().int().nonnegative().optional(),
      lte: z.number().int().nonnegative().optional(),
    }),
    z.object({
      kind: z.literal("all"),
      conditions: z.array(declarativeFieldConditionSchema).min(1),
    }),
    z.object({
      kind: z.literal("any"),
      conditions: z.array(declarativeFieldConditionSchema).min(1),
    }),
    z.object({ kind: z.literal("not"), condition: declarativeFieldConditionSchema }),
  ]),
);

const fieldConditionSchema = z.union([
  functionFieldConditionSchema,
  declarativeFieldConditionSchema,
]);

const uiSchema = z.record(z.string(), z.unknown()).optional();

export const baseFieldConfigSchema = z.object({
  id: z.string().optional(),
  kind: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  showDescriptionInline: z.boolean().optional().default(false),
  required: z.boolean().optional().default(false),
  disabled: z.boolean().optional().default(false),
  hidden: z.boolean().optional().default(false),
  readOnly: z.boolean().optional().default(false),
  disabledWhen: fieldConditionSchema.optional(),
  hiddenWhen: fieldConditionSchema.optional(),
  readOnlyWhen: fieldConditionSchema.optional(),
  asyncValidationDebounceMs: z.number().int().nonnegative().optional(),
  inactiveFieldPolicy: z.enum(["include", "omit", "reset-on-hide"]).optional(),
  includeInSubmission: z.boolean().optional(),
  displayKey: z.string().min(1).optional(),
  mappedTo: mappedToSchema,
  valuePath: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).optional(),
  defaultValue: z.unknown().optional(),
  ui: uiSchema,
});

export const baseReportConfigSchema = z.object({
  id: z.string().optional(),
  kind: z.string().min(1),
  label: z.string().optional(),
  description: z.string().optional(),
  mappedTo: mappedToSchema,
  ui: uiSchema,
});

type ConfigSchema = z.ZodObject<z.ZodRawShape>;

const withMetadata = (source: z.ZodType, target: z.ZodType): z.ZodType => {
  const metadata = source.meta();
  return metadata ? target.meta(metadata) : target;
};

const resolveObjectSchema = (schema: z.ZodType): ConfigSchema | undefined => {
  let current = schema;
  while (current instanceof z.ZodLazy) current = current.unwrap() as z.ZodType;
  return current instanceof z.ZodObject ? current : undefined;
};

const composePropertySchema = (
  baseProperty: z.ZodType,
  definitionProperty: z.ZodType,
): z.ZodType => {
  const chained = baseProperty.pipe(definitionProperty);
  const combined = z.intersection(chained, definitionProperty);
  const missing = chained.safeParse(undefined);
  if (!missing.success) return combined;
  return missing.data === undefined
    ? combined.optional()
    : combined.optional().default(missing.data);
};

const composeConfigSchema = (base: ConfigSchema, definition: z.ZodType): z.ZodType => {
  if (definition instanceof z.ZodPipe) {
    const input = composeConfigSchema(base, definition.in as z.ZodType);
    return withMetadata(definition, input.pipe(definition.out));
  }

  const objectSchema = resolveObjectSchema(definition);
  // Object schemas are the declarative extension contract. Keep legacy parser-like definitions
  // working without assuming they expose Zod internals; they retain their existing behavior.
  if (!objectSchema) return definition;

  const definitionShape = objectSchema.shape as Record<string, z.ZodType>;
  const composedShape: Record<string, z.ZodType> = {};
  for (const [key, baseProperty] of Object.entries(base.shape as Record<string, z.ZodType>)) {
    const definitionProperty = definitionShape[key];
    if (!definitionProperty || definitionProperty === baseProperty) {
      composedShape[key] = definitionProperty ?? baseProperty;
      continue;
    }

    // The pipe validates the shared input through the base contract, then returns the
    // definition's output. Intersecting with the definition preserves both JSON Schemas.
    composedShape[key] = composePropertySchema(baseProperty, definitionProperty);
  }

  const combined = objectSchema.safeExtend(composedShape);

  return withMetadata(definition, combined);
};

const parseConfig = <TConfig extends FieldConfig | ReportConfig>(
  base: ConfigSchema,
  definition: z.ZodType,
  value: unknown,
): TConfig => {
  const inputBase = base.parse(value);
  const parsed = composeConfigSchema(base, definition).parse(value);
  // Definitions may transform extension-owned properties, but shared properties remain owned by
  // the base contract so runtime output cannot diverge from validation or generated JSON Schema.
  return { ...(parsed as Record<string, unknown>), ...inputBase } as TConfig;
};

export const composeFieldConfigSchema = (definition: z.ZodType): z.ZodType =>
  composeConfigSchema(baseFieldConfigSchema, definition);

export const composeReportConfigSchema = (definition: z.ZodType): z.ZodType =>
  composeConfigSchema(baseReportConfigSchema, definition);

export const parseFieldConfig = (schema: z.ZodType, value: unknown): FieldConfig =>
  parseConfig<FieldConfig>(baseFieldConfigSchema, schema, value);

export const parseReportConfig = (schema: z.ZodType, value: unknown): ReportConfig =>
  parseConfig<ReportConfig>(baseReportConfigSchema, schema, value);
