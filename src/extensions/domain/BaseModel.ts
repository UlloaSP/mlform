// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";

export const BaseModelSchema = z.strictObject({
  title: z.optional(z.string().min(1).max(100)),
  execution_time: z.optional(z.number().min(0)),
});

export type BaseModel = z.infer<typeof BaseModelSchema>;
