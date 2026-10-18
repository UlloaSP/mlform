import { MATERIAL_CATALOG, getMaterialFieldId } from "./material-catalog.js";

const createEmptyMaterialValues = () =>
  Object.fromEntries(MATERIAL_CATALOG.map((material) => [getMaterialFieldId(material.id), 0]));

const createExampleValues = (config) => ({
  ...createEmptyMaterialValues(),
  ...Object.fromEntries(
    (config.materials ?? []).map((entry) => [
      getMaterialFieldId(entry.materialId),
      entry.proportion,
    ]),
  ),
  extruderbrand: config.extruderbrand,
  extrusionspeed: config.extrusionspeed,
  printerbrand: config.printerbrand,
  platetemperature: config.platetemperature,
  printingspeed: config.printingspeed,
  objecttype: config.objecttype,
  shape: config.shape,
  surfacearea: config.surfacearea,
  volume: config.volume,
  mediavolume: config.mediavolume,
  mediaph: config.mediaph,
});

export const FORMULATION_EXAMPLES = [
  {
    id: "example-1",
    label: "Example 1",
    values: createExampleValues({
      materials: [
        { materialId: "paracetamol", proportion: 5 },
        { materialId: "pva-filament", proportion: 95 },
      ],
      extruderbrand: "Filabot_Original_EX2",
      extrusionspeed: 35,
      printerbrand: "Makerbot_replicator_2x",
      platetemperature: 25,
      printingspeed: 90,
      objecttype: "tablet",
      shape: "cube",
      surfacearea: 341.4,
      volume: 429.2,
      mediavolume: 900,
      mediaph: 5,
    }),
  },
  {
    id: "example-2",
    label: "Example 2",
    values: createExampleValues({
      materials: [
        { materialId: "aqoat-as-hg", proportion: 40 },
        { materialId: "peg-400", proportion: 10 },
        { materialId: "pregabalin", proportion: 50 },
      ],
      extruderbrand: "Process_11",
      extrusionspeed: 15,
      printerbrand: "\u00a0good_bot_4025-mp",
      platetemperature: 50,
      printingspeed: 30,
      objecttype: "tablet",
      shape: "cylinder",
      surfacearea: 1114.01,
      volume: 554.26,
      mediavolume: 500,
      mediaph: 3,
    }),
  },
  {
    id: "example-3",
    label: "Example 3",
    values: createExampleValues({
      materials: [
        { materialId: "metformin-hcl", proportion: 60 },
        { materialId: "tecoflex-eg-72d", proportion: 40 },
      ],
      extruderbrand: "Eurolab_16",
      extrusionspeed: 100,
      printerbrand: "Makerbot_Replicator_2x",
      platetemperature: 50,
      printingspeed: 90,
      objecttype: "tablet",
      shape: "cylinder",
      surfacearea: 306.352407614809,
      volume: 377.186682573461,
      mediavolume: 900,
      mediaph: 5,
    }),
  },
];

export const getExampleById = (exampleId) =>
  FORMULATION_EXAMPLES.find((example) => example.id === exampleId) ?? null;
