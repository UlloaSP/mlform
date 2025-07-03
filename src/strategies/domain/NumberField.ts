import { z } from "zod";
import { BaseFieldSchema } from "@/extensions";
import { FieldTypes } from "./FieldTypes";

export const NumberFieldSchema = BaseFieldSchema.merge(
  z.object({
    type: z.literal(FieldTypes.NUMBER),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    placeholder: z.string().optional(),
    value: z.number().optional(),
    unit: z.string().optional(),
  })
)
  .strict()
  .superRefine((data, ctx) => {
    const { min, max, value } = data;
    if (min != null && max != null && min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["min"],
        message: `${min} debe ser ≤ ${max}`,
      });
    }
    if (value != null) {
      if (min != null && value < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: `${value} debe ser ≥ ${min}`,
        });
      }
      if (max != null && value > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: `${value} debe ser ≤ ${max}`,
        });
      }
    }
  });

export type NumberField = z.infer<typeof NumberFieldSchema>;
