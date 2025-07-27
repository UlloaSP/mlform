import { z } from "zod";
import { BaseFieldSchema } from "@/extensions";
import { FieldTypes } from "./FieldTypes";

export const DateFieldSchema = BaseFieldSchema.merge(
  z.object({
    type: z.literal(FieldTypes.DATE),
    value: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "El valor debe ser una fecha válida en formato ISO",
      }),
    min: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "La fecha mínima debe ser válida en formato ISO",
      }),
    max: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "La fecha máxima debe ser válida en formato ISO",
      }),
    step: z.number().int().positive().default(1),
  })
)
  .strict()
  .superRefine((data, ctx) => {
    const { min, max, value } = data;
    if (min && max && min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["min"],
        message: "La fecha mínima debe ser anterior o igual a la fecha máxima",
      });
    }
    if (value && min && value < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "La fecha debe ser posterior o igual a la fecha mínima",
      });
    }
    if (value && max && value > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "La fecha debe ser anterior o igual a la fecha máxima",
      });
    }
  });

export type DateField = z.infer<typeof DateFieldSchema>;
