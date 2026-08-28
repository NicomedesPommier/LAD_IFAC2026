// =============================================================
// FILE: src/components/sim/baseMaps.js
// Built-in maps available to everyone (no workspace file needed).
// MapRunner offers these at the top of its map picker and loads their
// `data` object directly (same shape MapCreator saves).
// =============================================================
import cityscapeImg from "./assets/sdcs_cityscape.png";

export const BASE_MAPS = [
  {
    id: "__sdcs_cityscape__",
    name: "🏙 SDCS Cityscape (built-in)",
    data: {
      version: "1.0",
      imageOriginalName: "sdcs_cityscape.png",
      imageData: cityscapeImg,
      // Sized to contain the SDCS roadmap (~4.24 × 5.58 m), centred on the origin.
      // The QCar (~0.4 m) fits the streets at this scale.
      imageSize: { width: 5, height: 6 },
      // Spawn on node 10 of the centred roadmap (start of the default
      // sequence 10→4→20→10) so the SDCS Roadmap node drives straight onto the
      // path. sim (x, z) = (roadmap_x - centreX, -(roadmap_y - centreY)).
      spawnPoint: { x: -1.42, z: 2.17, yaw: -0.733 },
      assets: [],
    },
  },
];

export function getBaseMap(id) {
  return BASE_MAPS.find((m) => m.id === id) || null;
}
