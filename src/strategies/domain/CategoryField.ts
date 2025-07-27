import { z } from "zod";
import { BaseFieldSchema } from "@/extensions";
import { FieldTypes } from "./FieldTypes";

export const CategoryFieldSchema = BaseFieldSchema.merge(
  z.object({
    type: z.literal(FieldTypes.CATEGORY),
    value: z.string().optional(),
    options: z.array(z.string()).nonempty(),
  })
)
  .strict()
  .superRefine(({ value, options }, ctx) => {
    if (value !== undefined && !options.includes(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "El valor debe coincidir con una de las opciones permitidas",
      });
    }
  });

export type CategoryField = z.infer<typeof CategoryFieldSchema>;
