/**
 * Crosshair data models, defaults, presets, and serialization utilities
 */

export interface CrosshairConfig {
  // General Tab Settings
  advancedOptions?: boolean;
  showSpectatedPlayerCrosshair?: boolean;
  fadeWithFiringError?: boolean;
  hideCrosshair?: boolean;

  // ADS Tab Settings
  copyPrimaryCrosshairADS?: boolean;
  overrideFiringErrorOffsetADS?: boolean;

  color: string;
  outlines: boolean;
  outlineOpacity: number;
  outlineThickness: number;
  centerDot: boolean;
  centerDotOpacity: number;
  centerDotSize: number;
  overrideFiringError: boolean;
  overrideAllPrimary: boolean;

  // Inner Lines
  innerLines: boolean;
  innerLineOpacity: number;
  innerLineLength: number;
  innerLineLengthVertical: number;
  innerLineLinked: boolean;
  innerLineThickness: number;
  innerLineOffset: number;
  innerMovementError: boolean;
  innerMovementErrorMult: number;
  innerFiringError: boolean;
  innerFiringErrorMult: number;

  // Outer Lines
  outerLines: boolean;
  outerLineOpacity: number;
  outerLineLength: number;
  outerLineLengthVertical: number;
  outerLineLinked: boolean;
  outerLineThickness: number;
  outerLineOffset: number;
  outerMovementError: boolean;
  outerMovementErrorMult: number;
  outerFiringError: boolean;
  outerFiringErrorMult: number;
}

export interface CrosshairPreset {
  id: string;
  name: string;
  team?: string;
  code?: string;
  config: CrosshairConfig;
}

export interface ColorPreset {
  name: string;
  hex: string;
}

export interface BackgroundMap {
  id: string;
  label: string;
  url: string;
}

export const DEFAULT_CONFIG: CrosshairConfig = {
  advancedOptions: true,
  showSpectatedPlayerCrosshair: false,
  fadeWithFiringError: false,
  hideCrosshair: false,
  copyPrimaryCrosshairADS: true,
  overrideFiringErrorOffsetADS: false,

  color: "#00FFB3",
  outlines: false,
  outlineOpacity: 0.5,
  outlineThickness: 1,
  centerDot: false,
  centerDotOpacity: 1,
  centerDotSize: 2,
  overrideFiringError: false,
  overrideAllPrimary: false,

  innerLines: true,
  innerLineOpacity: 0.8,
  innerLineLength: 6,
  innerLineLengthVertical: 6,
  innerLineLinked: true,
  innerLineThickness: 2,
  innerLineOffset: 3,
  innerMovementError: false,
  innerMovementErrorMult: 1,
  innerFiringError: false,
  innerFiringErrorMult: 1,

  outerLines: false,
  outerLineOpacity: 0.35,
  outerLineLength: 2,
  outerLineLengthVertical: 2,
  outerLineLinked: true,
  outerLineThickness: 2,
  outerLineOffset: 10,
  outerMovementError: false,
  outerMovementErrorMult: 1,
  outerFiringError: false,
  outerFiringErrorMult: 1,
};

export const COLOR_PRESETS: ColorPreset[] = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Green", hex: "#00FF00" },
  { name: "Yellow Green", hex: "#7FFF00" },
  { name: "Green Yellow", hex: "#ADFF2F" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Cyan", hex: "#00FFFF" },
  { name: "Pink", hex: "#FF1493" },
  { name: "Red", hex: "#FF4655" },
];

export const BACKGROUNDS: BackgroundMap[] = [
  { id: "range", label: "Campo de Tiro (Bots)", url: "/backgrounds/range.webp" },
  { id: "ascent", label: "Ascent", url: "/backgrounds/ascent.webp" },
  { id: "bind", label: "Bind", url: "/backgrounds/bind.webp" },
  { id: "haven", label: "Haven", url: "/backgrounds/haven.webp" },
  { id: "split", label: "Split", url: "/backgrounds/split.webp" },
  { id: "sunset", label: "Sunset", url: "/backgrounds/sunset.webp" },
  { id: "lotus", label: "Lotus", url: "/backgrounds/lotus.webp" },
  { id: "breeze", label: "Breeze", url: "/backgrounds/breeze.webp" },
  { id: "icebox", label: "Icebox", url: "/backgrounds/icebox.webp" },
  { id: "abyss", label: "Abyss", url: "/backgrounds/abyss.webp" },
  { id: "pearl", label: "Pearl", url: "/backgrounds/pearl.webp" },
  { id: "fracture", label: "Fracture", url: "/backgrounds/fracture.webp" },
  { id: "chroma", label: "Verde Chroma", url: "chroma" },
];

/**
 * Serializes CrosshairConfig into a standard Valorant profile code
 */
export function serializeValorantCode(c: CrosshairConfig): string {
  const parts: string[] = ["0"];

  // Global Header Settings (before P)
  if (c.overrideAllPrimary) {
    parts.push("c;1");
  }
  if (c.advancedOptions !== false) {
    parts.push("s;1");
  }

  parts.push("P");

  // Color
  const cleanHex = c.color.replace("#", "").toUpperCase();
  const presetIdx = COLOR_PRESETS.findIndex((cp) => cp.hex.toLowerCase() === c.color.toLowerCase());
  if (presetIdx >= 0) {
    parts.push(`c;${presetIdx}`);
  } else {
    parts.push(`c;8;u;${cleanHex}`);
  }

  // Outlines
  if (!c.outlines) {
    parts.push("h;0");
  } else {
    parts.push("h;1");
    parts.push(`t;${c.outlineThickness}`);
    parts.push(`o;${c.outlineOpacity}`);
  }

  // Center Dot
  if (c.centerDot) {
    parts.push("d;1");
    parts.push(`z;${c.centerDotSize}`);
    parts.push(`a;${c.centerDotOpacity}`);
  } else {
    parts.push("d;0");
  }

  // Overrides
  if (c.overrideFiringError) parts.push("m;1");

  // Inner lines
  if (!c.innerLines) {
    parts.push("0b;0");
  } else {
    parts.push("0t;1");
    parts.push(`0l;${c.innerLineLength}`);
    if (c.innerLineLengthVertical !== undefined && c.innerLineLengthVertical !== c.innerLineLength) {
      parts.push(`0v;${c.innerLineLengthVertical}`);
    }
    parts.push(`0o;${c.innerLineOffset}`);
    parts.push(`0a;${c.innerLineOpacity}`);
    parts.push(`0w;${c.innerLineThickness}`);
    if (c.innerMovementError) {
      parts.push("0m;1");
      parts.push(`0s;${c.innerMovementErrorMult}`);
    }
    if (c.innerFiringError) {
      parts.push("0e;1");
      parts.push(`0f;${c.innerFiringErrorMult}`);
    }
  }

  // Outer lines
  if (!c.outerLines) {
    parts.push("1b;0");
  } else {
    parts.push("1t;1");
    parts.push(`1l;${c.outerLineLength}`);
    if (c.outerLineLengthVertical !== undefined && c.outerLineLengthVertical !== c.outerLineLength) {
      parts.push(`1v;${c.outerLineLengthVertical}`);
    }
    parts.push(`1o;${c.outerLineOffset}`);
    parts.push(`1a;${c.outerLineOpacity}`);
    parts.push(`1w;${c.outerLineThickness}`);
    if (c.outerMovementError) {
      parts.push("1m;1");
      parts.push(`1s;${c.outerMovementErrorMult}`);
    }
    if (c.outerFiringError) {
      parts.push("1e;1");
      parts.push(`1f;${c.outerFiringErrorMult}`);
    }
  }

  return parts.join(";");
}

/**
 * Parses a standard Valorant crosshair string into a partial CrosshairConfig
 */
export function parseValorantCode(code: string): Partial<CrosshairConfig> | null {
  if (!code || typeof code !== "string") return null;
  const tokens = code.trim().split(";");
  if (tokens.length < 2) return null;

  const result: Partial<CrosshairConfig> = {};
  const hasPSection = tokens.includes("P");
  let currentSection = hasPSection ? "" : "P"; // Si tiene 'P', empieza en cabecera global; si no, directamente en Primaria
  let colorPresetIdx = -1;
  let customHex = "";

  let i = 0;
  // Omitir versión si el primer token es "0"
  if (tokens[0] === "0") {
    i = 1;
  }

  while (i < tokens.length) {
    const token = tokens[i];

    // Detectar marcadores de sección oficiales de Valorant
    if (token === "P" || token === "A" || token === "S") {
      currentSection = token;
      i++;
      continue;
    }

    const key = token;
    const val = tokens[i + 1];
    if (val === undefined) break;

    // Ajustes globales (en la cabecera antes de la sección P)
    if (currentSection === "") {
      if (key === "c") {
        // En la cabecera antes de P, c;1 es "Sustituir todas las miras principales por mi mira principal"
        result.overrideAllPrimary = val === "1";
      } else if (key === "s") {
        result.advancedOptions = val === "1";
      } else if (key === "f") {
        result.fadeWithFiringError = val === "1";
      }
    }

    // RETÍCULA PRINCIPAL (Sección 'P')
    if (currentSection === "P") {
      if (key === "c") {
        colorPresetIdx = parseInt(val, 10);
      } else if (key === "u") {
        customHex = val.replace("#", "");
      } else if (key === "h") {
        result.outlines = val === "1";
      } else if (key === "t") {
        result.outlineThickness = parseInt(val, 10);
      } else if (key === "o") {
        result.outlineOpacity = parseFloat(val);
        if (result.outlines === undefined) result.outlines = true;
      } else if (key === "d") {
        result.centerDot = val === "1";
      } else if (key === "z") {
        result.centerDotSize = parseInt(val, 10);
      } else if (key === "a") {
        result.centerDotOpacity = parseFloat(val);
      } else if (key === "m") {
        result.overrideFiringError = val === "1";
      } else if (key === "b") {
        result.overrideAllPrimary = val === "1";
      } else if (key === "f") {
        result.fadeWithFiringError = val === "1";
      } else if (key === "s") {
        result.advancedOptions = val === "1";
      }
      // Líneas internas
      else if (key === "0b") {
        result.innerLines = val === "1";
      } else if (key === "0t" || key === "0g") {
        result.innerLines = val === "1";
      } else if (key === "0l") {
        result.innerLineLength = parseInt(val, 10);
        if (result.innerLineLengthVertical === undefined) {
          result.innerLineLengthVertical = parseInt(val, 10);
        }
      } else if (key === "0v") {
        result.innerLineLengthVertical = parseInt(val, 10);
        result.innerLineLinked = false;
      } else if (key === "0o") {
        result.innerLineOffset = parseInt(val, 10);
      } else if (key === "0a") {
        result.innerLineOpacity = parseFloat(val);
      } else if (key === "0w") {
        result.innerLineThickness = parseInt(val, 10);
      } else if (key === "0m") {
        result.innerMovementError = val === "1";
      } else if (key === "0s") {
        result.innerMovementErrorMult = parseFloat(val);
      } else if (key === "0e") {
        result.innerFiringError = val === "1";
      } else if (key === "0f") {
        result.innerFiringErrorMult = parseFloat(val);
      }
      // Líneas externas
      else if (key === "1b") {
        result.outerLines = val === "1";
      } else if (key === "1t" || key === "1g") {
        result.outerLines = val === "1";
      } else if (key === "1l") {
        result.outerLineLength = parseInt(val, 10);
        if (result.outerLineLengthVertical === undefined) {
          result.outerLineLengthVertical = parseInt(val, 10);
        }
      } else if (key === "1v") {
        result.outerLineLengthVertical = parseInt(val, 10);
        result.outerLineLinked = false;
      } else if (key === "1o") {
        result.outerLineOffset = parseInt(val, 10);
      } else if (key === "1a") {
        result.outerLineOpacity = parseFloat(val);
      } else if (key === "1w") {
        result.outerLineThickness = parseInt(val, 10);
      } else if (key === "1m") {
        result.outerMovementError = val === "1";
      } else if (key === "1s") {
        result.outerMovementErrorMult = parseFloat(val);
      } else if (key === "1e") {
        result.outerFiringError = val === "1";
      } else if (key === "1f") {
        result.outerFiringErrorMult = parseFloat(val);
      }
    }

    // Avanzar clave y valor
    i += 2;
  }

  // Resolver color prioritario de Valorant:
  // Si c es 8 (Custom), se usa el hex personalizado de 'u'.
  // Si c es 0-7, se usa obligatoriamente el preset de Valorant (ignorando 'u' residual).
  // Si no hay 'c' pero sí 'u', se usa 'u'.
  if (colorPresetIdx === 8 && customHex) {
    result.color = "#" + (customHex.length > 6 ? customHex.substring(0, 6) : customHex);
  } else if (colorPresetIdx >= 0 && colorPresetIdx < COLOR_PRESETS.length) {
    result.color = COLOR_PRESETS[colorPresetIdx].hex;
  } else if (customHex) {
    result.color = "#" + (customHex.length > 6 ? customHex.substring(0, 6) : customHex);
  }

  return result;
}
