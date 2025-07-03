import type { Infer } from "@/core";
import { ClassifierModelSchema, ModelTypes } from "@/strategies/domain";
import { ReportStrategy } from "@/extensions/app";

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
