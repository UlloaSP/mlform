import * as z from "zod";
import { BaseFieldSchema } from "@/extensions/domain";
import { FieldTypes } from "./FieldTypes";

const NUMBER_MIN_MAX_MESSAGE: string =
  "The minimum value must be less than or equal to the maximum value";

const NUMBER_VALUE_MIN_MESSAGE: string =
  "The selected value must be greater than or equal to the minimum value";

const NUMBER_VALUE_MAX_MESSAGE: string =
  "The selected value must be less than or equal to the maximum value";

const isNotLessThanOrEqual = (a?: number, b?: number): boolean => {
  return !(a === undefined || b === undefined || a <= b);
};

export const NumberFieldSchema = z
  .strictObject({
    ...BaseFieldSchema.shape,
    type: z.literal(FieldTypes.NUMBER),
    min: z.optional(z.number()),
    max: z.optional(z.number()),
    step: z.optional(z.number().positive().default(1)),
    placeholder: z.optional(z.string()),
    value: z.optional(z.number()),
    unit: z.optional(z.string()),
  })
  .check((ctx) => {
    if (isNotLessThanOrEqual(ctx.value.min, ctx.value.max)) {
      ctx.issues.push({
        code: "custom",
        path: ["min"],
        message: NUMBER_MIN_MAX_MESSAGE,
        input: ctx.value,
        continue: true,
      });
    }
    if (isNotLessThanOrEqual(ctx.value.min, ctx.value.value)) {
      ctx.issues.push({
        code: "custom",
        path: ["min"],
        message: NUMBER_VALUE_MIN_MESSAGE,
        input: ctx.value,
        continue: true,
      });
    }
    if (isNotLessThanOrEqual(ctx.value.value, ctx.value.max)) {
      ctx.issues.push({
        code: "custom",
        path: ["value"],
        message: NUMBER_VALUE_MAX_MESSAGE,
        input: ctx.value,
        continue: true,
      });
    }
  });

export type NumberField = z.infer<typeof NumberFieldSchema>;
