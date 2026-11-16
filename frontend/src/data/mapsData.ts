export type MapCategory = "standard" | "teamDeathmatch" | "range";

export interface MapData {
  uuid: string;
  displayName: string;
  splash: string;
  displayIcon?: string;
  coordinates?: string;
  /** Sin indicar = "standard" */
  category?: MapCategory;
}

export const VALORANT_MAPS: MapData[] = [
  {
    uuid: "7eaecc1b-4337-bbf6-6ab9-04b8f06b3319",
    displayName: "Ascent",
    splash: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png",
    coordinates: "45°26'BF' N 12°20'Q' E",
  },
  {
    uuid: "2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba",
    displayName: "Bind",
    splash: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/displayicon.png",
    coordinates: "34°2'A' N 6°51'Z' W",
  },
  {
    uuid: "2bee0dc9-4ffe-519b-1cbd-7fbe763a6047",
    displayName: "Haven",
    splash: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/displayicon.png",
    coordinates: "27°28'A' N 89°38'WZ' E",
  },
  {
    uuid: "d960549e-485c-e861-8d71-aa9d1aed12a2",
    displayName: "Split",
    splash: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/displayicon.png",
    coordinates: "35°41'CD' N 139°41'WX' E",
  },
  {
    uuid: "2fb9a4fd-47b8-4e7d-a969-74b4046ebd53",
    displayName: "Breeze",
    splash: "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/displayicon.png",
    coordinates: "26°11'AG' N 71°10'WY' W",
  },
  {
    uuid: "e2ad5c54-4114-a870-9641-8ea21279579a",
    displayName: "Icebox",
    splash: "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/displayicon.png",
    coordinates: "76°44'A' N 149°18'Z' E",
  },
  {
    uuid: "92584fbe-486a-b1b2-9faa-39b0f486b498",
    displayName: "Sunset",
    splash: "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/displayicon.png",
    coordinates: "34°2'A' N 118°12'Z' W",
  },
  {
    uuid: "2fe4ed3a-450a-948b-6d6b-e89a78e680a9",
    displayName: "Lotus",
    splash: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/displayicon.png",
    coordinates: "14°07'AD' N 74°53'XW' E",
  },
  {
    uuid: "224b0a95-48b9-f703-1bd8-67aca101a61f",
    displayName: "Abyss",
    splash: "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/displayicon.png",
    coordinates: "70°50'N 8°20'W",
  },
  {
    uuid: "fd267378-4d1d-484f-ff52-77821ed10dc2",
    displayName: "Pearl",
    splash: "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/displayicon.png",
    coordinates: "38°42'N 9°08'W",
  },
  {
    uuid: "b529448b-4d60-346e-e89e-00a4c527a405",
    displayName: "Fracture",
    splash: "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/displayicon.png",
    coordinates: "35°48'N 106°08'W",
  },
  {
    uuid: "1c18ab1f-420d-0d8b-71d0-77ad3c439115",
    displayName: "Corrode",
    splash: "https://media.valorant-api.com/maps/1c18ab1f-420d-0d8b-71d0-77ad3c439115/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/1c18ab1f-420d-0d8b-71d0-77ad3c439115/displayicon.png",
    coordinates: "48° 38' FH\" N8, 1° 33' YV\" W8",
  },
  {
    uuid: "756da597-416b-c0f2-f47b-afbdf28670bc",
    displayName: "Summit",
    splash: "https://media.valorant-api.com/maps/756da597-416b-c0f2-f47b-afbdf28670bc/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/756da597-416b-c0f2-f47b-afbdf28670bc/displayicon.png",
    coordinates: "29° 18' FC\" N, 110° 25' ZQ\" E",
  },
  // Duelo a muerte por equipos (no aparecen en los selectores de mapas estándar)
  {
    uuid: "12452a9d-48c3-0b02-e7eb-0381c3520404",
    displayName: "Kasbah",
    splash: "https://media.valorant-api.com/maps/12452a9d-48c3-0b02-e7eb-0381c3520404/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/12452a9d-48c3-0b02-e7eb-0381c3520404/displayicon.png",
    category: "teamDeathmatch",
  },
  {
    uuid: "de28aa9b-4cbe-1003-320e-6cb3ec309557",
    displayName: "Piazza",
    splash: "https://media.valorant-api.com/maps/de28aa9b-4cbe-1003-320e-6cb3ec309557/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/de28aa9b-4cbe-1003-320e-6cb3ec309557/displayicon.png",
    category: "teamDeathmatch",
  },
  {
    uuid: "690b3ed2-4dff-945b-8223-6da834e30d24",
    displayName: "District",
    splash: "https://media.valorant-api.com/maps/690b3ed2-4dff-945b-8223-6da834e30d24/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/690b3ed2-4dff-945b-8223-6da834e30d24/displayicon.png",
    category: "teamDeathmatch",
  },
  {
    uuid: "2c09d728-42d5-30d8-43dc-96a05cc7ee9d",
    displayName: "Drift",
    splash: "https://media.valorant-api.com/maps/2c09d728-42d5-30d8-43dc-96a05cc7ee9d/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/2c09d728-42d5-30d8-43dc-96a05cc7ee9d/displayicon.png",
    category: "teamDeathmatch",
  },
  {
    uuid: "d6336a5a-428f-c591-98db-c8a291159134",
    displayName: "Glitch",
    splash: "https://media.valorant-api.com/maps/d6336a5a-428f-c591-98db-c8a291159134/splash.png",
    displayIcon: "https://media.valorant-api.com/maps/d6336a5a-428f-c591-98db-c8a291159134/displayicon.png",
    category: "teamDeathmatch",
  },
  // Campo de tiro
  {
    uuid: "5914d1e0-40c4-cfdd-6b88-eba06347686c",
    displayName: "The Range",
    splash: "https://media.valorant-api.com/maps/5914d1e0-40c4-cfdd-6b88-eba06347686c/splash.png",
    category: "range",
  },
];

/** Mapas de las colas estándar (competitivo, no competitivo...), sin duelo a muerte ni campo de tiro */
export const STANDARD_MAPS = VALORANT_MAPS.filter((m) => (m.category ?? "standard") === "standard");

export const DEFAULT_MAP_NAMES = STANDARD_MAPS.map((m) => m.displayName);

export const DEFAULT_MAP_SPLASH =
  "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png";

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
