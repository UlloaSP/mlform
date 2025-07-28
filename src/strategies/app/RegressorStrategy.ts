import type { Infer } from "@/core/domain";
import { ReportStrategy } from "@/extensions/app";
import { ModelTypes, RegressorModelSchema } from "@/strategies/domain";

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
