import { z } from "zod";
import { BaseFieldSchema } from "@/extensions";
import { FieldTypes } from "./FieldTypes";

export const BooleanFieldSchema = BaseFieldSchema.merge(
  z.object({
    type: z.literal(FieldTypes.BOOLEAN),
    value: z.boolean().optional(),
  })
).strict();

export type BooleanField = z.infer<typeof BooleanFieldSchema>;
