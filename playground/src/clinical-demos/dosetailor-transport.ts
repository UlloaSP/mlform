export interface DoseTailorPrediction {
  mode: "dose" | "level";
  level: number;
  dose?: number;
  points?: { dose: number; level: number }[];
}
import type { SubmitRequest } from "mlform/transport";
export const LAB_FIELDS = [
  "state",
  "ast",
  "alt",
  "bilirubin",
  "albumin",
  "creatinine",
  "sodium",
  "potassium",
  "hemoglobin",
  "hematocrit",
  "pgp_inhibit",
  "pgp_induce",
  "cyp3a4_inhibit",
  "cyp3a4_induce",
];
const COMMON_FIELDS = [
  "age",
  "gender",
  "race",
  "weight",
  "height",
  "formulation",
  "route",
  "doses_per_24_hrs",
  "level_dose_timediff",
  "treatment_days",
  "previous_dose",
  "previous_level",
  "previous_level_timediff",
];
const NUMERIC_CATEGORIES = new Set([
  "gender",
  "state",
  "route",
  "doses_per_24_hrs",
  "pgp_inhibit",
  "pgp_induce",
  "cyp3a4_inhibit",
  "cyp3a4_induce",
]);
export const hasValue = (value: unknown) => value !== null && value !== undefined && value !== "";
export const hasLabs = (values: Record<string, unknown>) =>
  LAB_FIELDS.every((id) => hasValue(values[id]));

export const createDoseTailorRequest = (values: Record<string, unknown>) => {
  const labs = hasLabs(values);
  const recommendation = values.predict_with === "level";
  const body = Object.fromEntries(
    [...COMMON_FIELDS, ...(labs ? LAB_FIELDS : [])].map((id) => [
      id,
      NUMERIC_CATEGORIES.has(id) ? Number(values[id]) : values[id],
    ]),
  );
  body.age_group =
    Number(values.age) < 30 ? 0 : Math.min(6, Math.floor(Number(values.age) / 10) - 2);
  body.dose = recommendation ? 0 : values.dose;
  if (recommendation) body.target_level = values.level;
  return {
    path: `/${recommendation ? "recommend_dose" : "inference"}/${labs ? "labs" : "nolabs"}`,
    body,
    recommendation,
  };
};

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const normalizeDoseTailorResponse = (
  value: unknown,
  recommendation: boolean,
): DoseTailorPrediction => {
  const data = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  if (!recommendation && finite(data?.predicted_level)) {
    return { mode: "dose", level: data.predicted_level };
  }
  if (
    recommendation &&
    finite(data?.optimal_dose) &&
    finite(data?.optimal_level) &&
    Array.isArray(data.dose_values) &&
    Array.isArray(data.predictions) &&
    data.dose_values.length > 0 &&
    data.dose_values.length === data.predictions.length &&
    data.dose_values.every(finite) &&
    data.predictions.every(finite)
  ) {
    const predictions = data.predictions;
    return {
      mode: "level",
      dose: data.optimal_dose,
      level: data.optimal_level,
      points: data.dose_values.map((dose, index) => ({ dose, level: predictions[index] })),
    };
  }
  throw new Error("The prediction server returned an invalid response. Please try again.");
};

export const createDoseTailorTransport = () => ({
  async submit(request: SubmitRequest) {
    const { path, body, recommendation } = createDoseTailorRequest(request.modelValues);
    let response;
    try {
      response = await fetch(`${import.meta.env?.BASE_URL ?? "/"}api/dosetailor${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: request.signal
          ? AbortSignal.any([request.signal, AbortSignal.timeout(30_000)])
          : AbortSignal.timeout(30_000),
      });
    } catch (error) {
      if (request.signal?.aborted) throw error;
      throw new Error(
        "Could not reach the DoseTailor prediction server. Please check your connection and try again.",
      );
    }
    if (!response.ok) {
      throw new Error(
        response.status === 422
          ? "Some parameters are missing or invalid. Please review the form and try again."
          : `The DoseTailor prediction server is unavailable (${response.status}). Please try again.`,
      );
    }
    const payload = normalizeDoseTailorResponse(await response.json(), recommendation);
    return {
      reports: [{ backend: "default", mappedTo: "prediction", status: "ready" as const, payload }],
      meta: {
        source: "https://api.dosetailor.com",
        model: hasLabs(request.modelValues) ? "Labs Model" : "No Labs Model",
      },
    };
  },
});
