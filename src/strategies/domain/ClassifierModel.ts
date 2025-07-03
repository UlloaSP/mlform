import { z } from "zod";
import { BaseModelSchema } from "@/extensions";
import { ModelTypes } from "./ModelTypes";

export const ClassifierModelSchema = BaseModelSchema.merge(
  z.object({
    type: z.literal(ModelTypes.CLASSIFIER),
    mapping: z
      .array(z.string().min(1, "Label must be a non-empty string"))
      .optional(),
    probabilities: z.array(z.array(z.number().min(0.0).max(1.0))).nonempty(),
    details: z.boolean().default(false),
  })
).strict();

export type ClassifierModel = z.infer<typeof ClassifierModelSchema>;
