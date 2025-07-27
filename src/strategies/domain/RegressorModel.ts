import { z } from "zod";
import { BaseModelSchema } from "@/extensions";
import { ModelTypes } from "./ModelTypes";

export const RegressorModelSchema = BaseModelSchema.merge(
  z.object({
    type: z.literal(ModelTypes.REGRESSOR),
    values: z.array(z.number()).nonempty(),
    unit: z.string().optional(),
    interval: z.tuple([z.number(), z.number()]).optional(),
  })
).strict();

export type RegressorModel = z.infer<typeof RegressorModelSchema>;
