import type { Infer } from "@/core";
import { RegressorModelSchema, ModelTypes } from "@/strategies/domain";
import { ReportStrategy } from "@/extensions/app";

export class RegressorStrategy extends ReportStrategy<
  typeof RegressorModelSchema
> {
  constructor() {
    super(
      ModelTypes.REGRESSOR,
      RegressorModelSchema,
      () => import("@/strategies/ui/regressor-prediction")
    );
  }
  buildControl(model: Infer<typeof RegressorModelSchema>) {
    return {
      tag: "regressor-prediction",
      props: {
        title: model.title,
        values: model.values,
        unit: model.unit,
        interval: model.interval,
      },
    };
  }
}
