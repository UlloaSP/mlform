// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { BaseModelSchema } from "@/extensions/domain";
import { ModelTypes } from "./ModelTypes";

export const RegressorModelSchema = z.strictObject({
  ...BaseModelSchema.shape,
  type: z.literal(ModelTypes.REGRESSOR),
  values: z.optional(z.array(z.number()).min(1)),
  unit: z.optional(z.string()),
  interval: z.optional(z.tuple([z.number(), z.number()])),
});

export type RegressorModel = z.infer<typeof RegressorModelSchema>;
