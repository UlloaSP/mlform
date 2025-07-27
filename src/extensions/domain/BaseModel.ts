import * as z from "zod";

export const BaseModelSchema = z.strictObject({
  title: z.optional(z.string().min(1).max(100)),
});

export type BaseModel = z.infer<typeof BaseModelSchema>;
