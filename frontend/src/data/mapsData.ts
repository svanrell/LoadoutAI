export interface MapData {
  uuid: string;
  displayName: string;
  splash: string;
  displayIcon?: string;
  coordinates?: string;
}

export const VALORANT_MAPS: MapData[] = [
  {
    uuid: "7eae2e51-4ece-f12b-57fc-92b2dd29d3c4",
    displayName: "Ascent",
    splash: "https://media.valorant-api.com/maps/7eae2e51-4ece-f12b-57fc-92b2dd29d3c4/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/7eae2e51-4ece-f12b-57fc-92b2dd29d3c4/displayicon.png",
    coordinates: "45°26'BF' N 12°20'Q' E",
  },
  {
    uuid: "2c9c43a2-4501-9441-727e-2d9435727bb2",
    displayName: "Bind",
    splash: "https://media.valorant-api.com/maps/2c9c43a2-4501-9441-727e-2d9435727bb2/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/2c9c43a2-4501-9441-727e-2d9435727bb2/displayicon.png",
    coordinates: "34°2'A' N 6°51'Z' W",
  },
  {
    uuid: "2bee0dc9-4aa9-526f-75b4-07e5aa9458e2",
    displayName: "Haven",
    splash: "https://media.valorant-api.com/maps/2bee0dc9-4aa9-526f-75b4-07e5aa9458e2/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/2bee0dc9-4aa9-526f-75b4-07e5aa9458e2/displayicon.png",
    coordinates: "27°28'A' N 89°38'WZ' E",
  },
  {
    uuid: "d960549e-485c-fb9e-1e4e-a69785a5f25d",
    displayName: "Split",
    splash: "https://media.valorant-api.com/maps/d960549e-485c-fb9e-1e4e-a69785a5f25d/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/d960549e-485c-fb9e-1e4e-a69785a5f25d/displayicon.png",
    coordinates: "35°41'CD' N 139°41'WX' E",
  },
  {
    uuid: "2fb9b465-41f0-842d-70a2-81e09416b4e8",
    displayName: "Breeze",
    splash: "https://media.valorant-api.com/maps/2fb9b465-41f0-842d-70a2-81e09416b4e8/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/2fb9b465-41f0-842d-70a2-81e09416b4e8/displayicon.png",
    coordinates: "26°11'AG' N 71°10'WY' W",
  },
  {
    uuid: "e2ad5e54-4114-a870-96ae-ab9b691135a8",
    displayName: "Icebox",
    splash: "https://media.valorant-api.com/maps/e2ad5e54-4114-a870-96ae-ab9b691135a8/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/e2ad5e54-4114-a870-96ae-ab9b691135a8/displayicon.png",
    coordinates: "76°44'A' N 149°18'Z' E",
  },
  {
    uuid: "2262b647-43e1-a4a1-0265-72ac2b2b1c41",
    displayName: "Sunset",
    splash: "https://media.valorant-api.com/maps/2262b647-43e1-a4a1-0265-72ac2b2b1c41/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/2262b647-43e1-a4a1-0265-72ac2b2b1c41/displayicon.png",
    coordinates: "34°2'A' N 118°12'Z' W",
  },
  {
    uuid: "2fe4ed3a-450a-948b-6d6d-e8f788c22147",
    displayName: "Lotus",
    splash: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6d-e8f788c22147/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6d-e8f788c22147/displayicon.png",
    coordinates: "14°07'AD' N 74°53'XW' E",
  },
  {
    uuid: "224b0c95-4d66-4661-49b9-1eab04c14b21",
    displayName: "Abyss",
    splash: "https://media.valorant-api.com/maps/224b0c95-4d66-4661-49b9-1eab04c14b21/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/224b0c95-4d66-4661-49b9-1eab04c14b21/displayicon.png",
    coordinates: "70°50'N 8°20'W",
  },
  {
    uuid: "fd267994-4364-77a8-c2b4-7f99994cfbdf",
    displayName: "Pearl",
    splash: "https://media.valorant-api.com/maps/fd267994-4364-77a8-c2b4-7f99994cfbdf/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/fd267994-4364-77a8-c2b4-7f99994cfbdf/displayicon.png",
    coordinates: "38°42'N 9°08'W",
  },
  {
    uuid: "b52973d7-44fa-493b-34e3-bdac627e8762",
    displayName: "Fracture",
    splash: "https://media.valorant-api.com/maps/b52973d7-44fa-493b-34e3-bdac627e8762/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/b52973d7-44fa-493b-34e3-bdac627e8762/displayicon.png",
    coordinates: "35°48'N 106°08'W",
  },
];

export const DEFAULT_MAP_NAMES = VALORANT_MAPS.map((m) => m.displayName);

export const DEFAULT_MAP_SPLASH =
  "https://media.valorant-api.com/maps/7eae2e51-4ece-f12b-57fc-92b2dd29d3c4/splash.png";

/**
 * Devuelve la imagen de fondo (Splash) en alta resolución para cualquier mapa de VALORANT.
 */
export function getMapSplash(mapNameOrId: string = ""): string {
  const norm = mapNameOrId.trim().toLowerCase();
  if (!norm) return DEFAULT_MAP_SPLASH;

  const found = VALORANT_MAPS.find(
    (m) =>
      m.displayName.toLowerCase() === norm ||
      m.uuid.toLowerCase() === norm ||
      norm.includes(m.displayName.toLowerCase())
  );

  return found ? found.splash : DEFAULT_MAP_SPLASH;
}

/**
 * Normaliza y devuelve el nombre canónico del mapa (ej. "ascent" -> "Ascent").
 */
export function getNormalizedMapName(mapNameOrId: string = ""): string {
  const norm = mapNameOrId.trim().toLowerCase();
  if (!norm) return "Ascent";

  const found = VALORANT_MAPS.find(
    (m) =>
      m.displayName.toLowerCase() === norm ||
      m.uuid.toLowerCase() === norm ||
      norm.includes(m.displayName.toLowerCase())
  );

  return found ? found.displayName : mapNameOrId;
}
