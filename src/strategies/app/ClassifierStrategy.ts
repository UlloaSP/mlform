// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Infer } from "@/core/domain";
import { ReportStrategy } from "@/extensions/app";
import { ClassifierModelSchema, ModelTypes } from "@/strategies/domain";

export class ClassifierStrategy extends ReportStrategy<
  typeof ClassifierModelSchema
> {
  constructor() {
    super(
      ModelTypes.CLASSIFIER,
      ClassifierModelSchema,
      () => import("@/strategies/ui/classifier-prediction")
    );
  }

  buildControl(model: Infer<typeof ClassifierModelSchema>) {
    return {
      tag: "classifier-prediction",
      props: {
        title: model.title,
        mapping: model.mapping,
        probabilities: model.probabilities,
        details: model.details.toString(),
      },
    };
  }
}
