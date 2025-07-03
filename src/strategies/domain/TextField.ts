import { z } from "zod";
import { BaseFieldSchema } from "@/extensions";
import { FieldTypes } from "./FieldTypes";

export const TextFieldSchema = BaseFieldSchema.merge(
  z.object({
    type: z.literal(FieldTypes.TEXT),
    value: z.string().optional(),
    placeholder: z.string().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  })
)
  .strict()
  .superRefine((data, ctx) => {
    if (data.pattern) {
      try {
        new RegExp(data.pattern); // Attempt to create a regex
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid regex pattern: ${data.pattern}`,
        });
      }
    }
  });

export type TextField = z.infer<typeof TextFieldSchema>;
