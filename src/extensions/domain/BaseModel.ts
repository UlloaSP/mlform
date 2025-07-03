import { z } from "zod";

export const BaseModelSchema = z
  .object({
    title: z.string().optional(),
  })
  .strict();

export type BaseModel = z.infer<typeof BaseModelSchema>;
