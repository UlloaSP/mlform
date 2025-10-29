// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";

export const BaseFieldSchema = z.strictObject({
  title: z
    .string()
    .min(1)
    .max(100)
    .regex(/^\S.*\S$/),
  description: z.optional(z.string().min(1).max(500)),
  required: z.boolean().default(true),
});

export type BaseField = z.infer<typeof BaseFieldSchema>;
