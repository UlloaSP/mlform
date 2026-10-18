import { MATERIAL_CATALOG, getMaterialFieldId } from "./material-catalog.js";

export const MATERIAL_FIELD_IDS = MATERIAL_CATALOG.map((material) =>
  getMaterialFieldId(material.id),
);

export const getMaterialTotal = (values) =>
  MATERIAL_CATALOG.reduce(
    (sum, material) => sum + Number(values[getMaterialFieldId(material.id)] ?? 0),
    0,
  );

export const getActiveMaterials = (values) =>
  MATERIAL_CATALOG.map((material) => ({
    ...material,
    fieldId: getMaterialFieldId(material.id),
    value: Number(values[getMaterialFieldId(material.id)] ?? 0),
  })).filter((material) => Math.abs(material.value) > 0.0001);
