import { z } from "zod";

export const BaseFieldSchema = z
  .object({
    title: z
      .string()
      .min(1)
      .max(100)
      .regex(/^\S.*\S$/, {
        message: "The title cannot be empty or contain only spaces.",
      }),
    description: z.string().min(1).max(500).optional(),
    required: z.boolean().default(true),
  })
  .strict();

export type BaseField = z.infer<typeof BaseFieldSchema>;
