export const MATERIAL_CATALOG = [
  {
    id: "allopurinol",
    label: "Allopurinol",
    supplier: "FarmaQuimica sur S.L.",
    modelKey: "Allopurinol@FarmaQuimica_sur_S.L.",
    category: "api",
    defaultPercent: 20,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "aqoat-as-hg",
    label: "Hydroxypropyl methyl cellulose acetate succinate (Aqoat AS-HG)",
    supplier: "Shin-Etsu",
    modelKey: "Hydroxypropyl_methyl_cellulose_acetate_succinate_(Aqoat_AS-HG)@Shin-Etsu",
    category: "polymer",
    defaultPercent: 40,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "peg-400",
    label: "Polyethylene glycol (PEG 400)",
    supplier: "Yakuri pure chemicals",
    modelKey: "Polyethylene_glycol_(PEG_400)@Yakuri_pure_chemicals",
    category: "plasticizer",
    defaultPercent: 10,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "pregabalin",
    label: "Pregabalin",
    supplier: "GL PharrmTech",
    modelKey: "Pregabalin@GL_PharrmTech",
    category: "api",
    defaultPercent: 50,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "pvp-va64",
    label: "PVP/VA 64",
    supplier: "BASF",
    modelKey: "Kollidon_VA64_(PVP/VA_Copolymer)@BASF",
    category: "polymer",
    defaultPercent: 35,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "mannitol",
    label: "Mannitol",
    supplier: "Sigma Aldrich",
    modelKey: "Mannitol@Sigma_Aldrich",
    category: "excipient",
    defaultPercent: 25,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "paracetamol",
    label: "Paracetamol",
    supplier: "Sigma Aldrich",
    category: "api",
    step: 1,
    modelKey: "Paracetamol@Sigma_Aldrich",
  },
  {
    id: "pva-filament",
    label: "Polyvinyl alcohol (PVA filament)",
    supplier: "Makerbot",
    category: "polymer",
    step: 1,
    modelKey: "Polyvinyl_alcohol_(PVA_filament)@Makerbot",
  },
  {
    id: "metformin-hcl",
    label: "Metformin HCl",
    supplier: "BASF",
    category: "api",
    step: 1,
    modelKey: "Metformin_HCl@BASF",
  },
  {
    id: "tecoflex-eg-72d",
    label: "Thermoplastic polyurethane (Tecoflex EG-72D)",
    supplier: "Merquinsa",
    category: "polymer",
    step: 1,
    modelKey: "Thermoplastic_polyurethane_(Tecoflex_EG-72D)@Merquinsa",
  },
];

export const getMaterialById = (materialId) =>
  MATERIAL_CATALOG.find((material) => material.id === materialId) ?? null;

export const getMaterialFieldId = (materialId) => `material-${materialId}`;

export const getMaterialOptionLabel = (materialId) => {
  const material = getMaterialById(materialId);
  return material ? `${material.label} (${material.supplier})` : materialId;
};
