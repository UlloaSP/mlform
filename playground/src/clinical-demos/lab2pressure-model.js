export const BP_MODEL = "Best BP Minimal";

// The supplied bundle contains numeric symmetric trees and no preprocessing.
export const predictBloodPressure = (model, leaves, modelValues) => {
  const values = model.featureOrder.map((name) => {
    const value = modelValues[name];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new TypeError(`Falta una entrada numérica válida: ${name}.`);
    }
    return Math.fround(value); // CatBoost quantizes numeric input to float32.
  });
  const bins = model.borders.map(([feature, border]) => Number(values[feature] > border));
  let score = 0;
  let splitOffset = 0;
  let leafOffset = 0;
  for (const depth of model.depths) {
    let leaf = 0;
    for (let level = 0; level < depth; level += 1) {
      leaf |= bins[model.splits[splitOffset++]] << level;
    }
    score += leaves[leafOffset + leaf];
    leafOffset += 2 ** depth;
  }
  const positive = 1 / (1 + Math.exp(-(score * model.scale + model.bias)));
  return {
    prediction: positive > 0.5 ? "Hipertenso" : "Sano",
    probabilities: [1 - positive, positive],
  };
};

export const createBloodPressureTransport = () => {
  let loaded;
  const load = async () => {
    const base = `${import.meta.env.BASE_URL}models/best-bp-minimal`;
    const [metadata, binary] = await Promise.all([fetch(`${base}.json`), fetch(`${base}.bin`)]);
    if (!metadata.ok || !binary.ok)
      throw new Error("No se pudo cargar Best BP Minimal. Vuelve a intentarlo.");
    const [model, buffer] = await Promise.all([metadata.json(), binary.arrayBuffer()]);
    if (buffer.byteLength !== model.leafCount * 8)
      throw new Error("El modelo local está incompleto.");
    return { model, leaves: new Float64Array(buffer) };
  };
  return {
    async submit(request) {
      loaded ??= load().catch((error) => {
        loaded = undefined;
        throw error;
      });
      const { model, leaves } = await loaded;
      const prediction = predictBloodPressure(model, leaves, request.modelValues);
      return {
        reports: [{ backend: BP_MODEL, mappedTo: 0, status: "ready", payload: prediction }],
        meta: { model: BP_MODEL, bundleId: model.bundleId, inference: "local" },
      };
    },
  };
};
