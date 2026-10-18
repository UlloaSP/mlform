// Only the public prediction endpoints used by these demos are exposed.
export const API_ROUTES = [
  {
    prefix: "/api/dosetailor",
    target: "https://api.dosetailor.com",
    paths: [
      "/inference/labs",
      "/inference/nolabs",
      "/recommend_dose/labs",
      "/recommend_dose/nolabs",
    ],
  },
  {
    prefix: "/api/m3diseen",
    target: "https://api.m3diseen.com",
    paths: [
      "/a2022/filament_mechanical_characteristics",
      "/a2022/extrusion_temp",
      "/a2022/printability",
      "/a2022/printing_temp",
      "/a2022/dissolution",
    ],
  },
];
