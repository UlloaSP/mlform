export interface FormulationPrediction {
  summary: Record<string, string | number>;
  curve: { timeMinutes: number; dissolvedPercent: number }[];
  errors: string[];
}
import type { SubmitRequest } from "mlform/transport";
import { MATERIAL_CATALOG } from "./material-catalog.ts";

const MODELS = [
  [
    "filament_mechanical_characteristics",
    "Mechanical characteristics",
    "mechanicalCharacteristics",
  ],
  ["extrusion_temp", "Extrusion temperature", "extrusionTemperature"],
  ["printability", "Printability", "printability"],
  ["printing_temp", "Printing temperature", "printingTemperature"],
  ["dissolution", "Dissolution", "curve"],
];

// Exact material/supplier keys and percentage units used by the public A2022 UI.
export const createFormulationRequest = (values: Record<string, unknown>) => {
  const formulation: Record<string, number> = {};
  for (const material of MATERIAL_CATALOG) {
    const proportion = values[material.id] ?? 0;
    if (
      typeof proportion !== "number" ||
      !Number.isFinite(proportion) ||
      proportion < 0 ||
      proportion > 100
    ) {
      throw new Error(`Invalid proportion for ${material.label}.`);
    }
    if (proportion > 0) formulation[material.modelKey] = proportion;
  }
  const total = Object.values(formulation).reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - 100) > 0.001)
    throw new Error("Materials must total 100% w/w before prediction.");
  const titleCase = (value: unknown) => {
    if (typeof value !== "string") throw new Error("Object type and shape must be strings.");
    return value.charAt(0).toUpperCase() + value.slice(1);
  };
  return {
    data: {
      formulation,
      extruder_brand: values.extruderbrand,
      extrusion_speed: values.extrusionspeed,
      printer_brand: values.printerbrand,
      platform_temp: values.platetemperature,
      printing_speed: values.printingspeed,
      object: titleCase(values.objecttype),
      shape: titleCase(values.shape),
      surface_area: values.surfacearea,
      volume: values.volume,
      volume_dissolution_media: values.mediavolume,
      ph: values.mediaph,
    },
  };
};

const normalize = (key: string, prediction: unknown) => {
  if (
    key === "curve" &&
    Array.isArray(prediction) &&
    prediction.length === 3 &&
    prediction.every((value) => typeof value === "number" && Number.isFinite(value))
  ) {
    return [
      { timeMinutes: 0, dissolvedPercent: 0 },
      ...prediction.map((timeMinutes, index) => ({
        timeMinutes,
        dissolvedPercent: 20 + index * 30,
      })),
    ];
  }
  if (
    ["extrusionTemperature", "printingTemperature"].includes(key) &&
    typeof prediction === "number" &&
    Number.isFinite(prediction)
  )
    return prediction;
  if (
    key === "mechanicalCharacteristics" &&
    typeof prediction === "string" &&
    prediction.length > 0
  )
    return prediction;
  if (
    key === "printability" &&
    typeof prediction === "string" &&
    ["yes", "no"].includes(prediction.toLowerCase())
  )
    return prediction.toLowerCase() === "yes" ? "Yes" : "No";
  throw new Error("The model returned an invalid prediction.");
};

export const createFormulationTransport = () => ({
  async submit(request: SubmitRequest) {
    const body = JSON.stringify(createFormulationRequest(request.modelValues));
    const signal = request.signal
      ? AbortSignal.any([request.signal, AbortSignal.timeout(30_000)])
      : AbortSignal.timeout(30_000);
    const results = await Promise.allSettled(
      MODELS.map(async ([endpoint, _label, key]) => {
        const response = await fetch(
          `${import.meta.env?.BASE_URL ?? "/"}api/m3diseen/a2022/${endpoint}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            signal,
          },
        );
        if (!response.ok) throw new Error(`Public model unavailable (HTTP ${response.status}).`);
        const payload = await response.json();
        if (payload.error) throw new Error(String(payload.error));
        return normalize(key, payload.prediction);
      }),
    );
    request.signal?.throwIfAborted();
    if (results.every((result) => result.status === "rejected")) {
      throw new Error(
        "The public M3DISEEN models could not return a prediction. Please try again.",
      );
    }
    const prediction: FormulationPrediction = { summary: {}, curve: [], errors: [] };
    results.forEach((result, index) => {
      const [, label, key] = MODELS[index];
      if (result.status === "fulfilled") {
        if (Array.isArray(result.value)) prediction.curve = result.value;
        else prediction.summary[key] = result.value;
      } else {
        prediction.errors.push(
          `${label}: ${result.reason.message ?? "Prediction request failed."}`,
        );
      }
    });
    return {
      reports: [
        {
          backend: "default",
          mappedTo: "prediction",
          status: "ready" as const,
          payload: prediction,
        },
      ],
      meta: {
        source: "https://api.m3diseen.com",
        profile: "A2022",
        partial: prediction.errors.length > 0,
      },
    };
  },
});
