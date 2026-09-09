/**
 * Crosshair data models, defaults, presets, and serialization utilities
 */

export interface CrosshairConfig {
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
  const parts: string[] = ["0", "P"];

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
  if (c.overrideAllPrimary) parts.push("b;1");

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

  for (let i = 0; i < tokens.length; i++) {
    const key = tokens[i];
    const val = tokens[i + 1];

    if (key === "c" && val !== undefined) {
      const idx = parseInt(val, 10);
      if (idx >= 0 && idx < COLOR_PRESETS.length) {
        result.color = COLOR_PRESETS[idx].hex;
      }
      i++;
    } else if (key === "u" && val !== undefined) {
      result.color = `#${val.replace("#", "")}`;
      i++;
    } else if (key === "h" && val !== undefined) {
      result.outlines = val === "1";
      i++;
    } else if (key === "t" && val !== undefined) {
      result.outlineThickness = parseInt(val, 10);
      i++;
    } else if (key === "o" && val !== undefined) {
      result.outlineOpacity = parseFloat(val);
      i++;
    } else if (key === "d" && val !== undefined) {
      result.centerDot = val === "1";
      i++;
    } else if (key === "z" && val !== undefined) {
      result.centerDotSize = parseInt(val, 10);
      i++;
    } else if (key === "a" && val !== undefined) {
      result.centerDotOpacity = parseFloat(val);
      i++;
    } else if (key === "m" && val !== undefined) {
      result.overrideFiringError = val === "1";
      i++;
    } else if (key === "b" && val !== undefined) {
      result.overrideAllPrimary = val === "1";
      i++;
    }
    // Inner lines
    else if (key === "0b" && val !== undefined) {
      result.innerLines = val === "1";
      i++;
    } else if (key === "0t" && val !== undefined) {
      result.innerLines = val === "1";
      i++;
    } else if (key === "0l" && val !== undefined) {
      result.innerLineLength = parseInt(val, 10);
      result.innerLineLengthVertical = parseInt(val, 10);
      i++;
    } else if (key === "0v" && val !== undefined) {
      result.innerLineLengthVertical = parseInt(val, 10);
      result.innerLineLinked = false;
      i++;
    } else if (key === "0o" && val !== undefined) {
      result.innerLineOffset = parseInt(val, 10);
      i++;
    } else if (key === "0a" && val !== undefined) {
      result.innerLineOpacity = parseFloat(val);
      i++;
    } else if (key === "0w" && val !== undefined) {
      result.innerLineThickness = parseInt(val, 10);
      i++;
    } else if (key === "0m" && val !== undefined) {
      result.innerMovementError = val === "1";
      i++;
    } else if (key === "0s" && val !== undefined) {
      result.innerMovementErrorMult = parseFloat(val);
      i++;
    } else if (key === "0e" && val !== undefined) {
      result.innerFiringError = val === "1";
      i++;
    } else if (key === "0f" && val !== undefined) {
      result.innerFiringErrorMult = parseFloat(val);
      i++;
    }
    // Outer lines
    else if (key === "1b" && val !== undefined) {
      result.outerLines = val === "1";
      i++;
    } else if (key === "1t" && val !== undefined) {
      result.outerLines = val === "1";
      i++;
    } else if (key === "1l" && val !== undefined) {
      result.outerLineLength = parseInt(val, 10);
      result.outerLineLengthVertical = parseInt(val, 10);
      i++;
    } else if (key === "1v" && val !== undefined) {
      result.outerLineLengthVertical = parseInt(val, 10);
      result.outerLineLinked = false;
      i++;
    } else if (key === "1o" && val !== undefined) {
      result.outerLineOffset = parseInt(val, 10);
      i++;
    } else if (key === "1a" && val !== undefined) {
      result.outerLineOpacity = parseFloat(val);
      i++;
    } else if (key === "1w" && val !== undefined) {
      result.outerLineThickness = parseInt(val, 10);
      i++;
    } else if (key === "1m" && val !== undefined) {
      result.outerMovementError = val === "1";
      i++;
    } else if (key === "1s" && val !== undefined) {
      result.outerMovementErrorMult = parseFloat(val);
      i++;
    } else if (key === "1e" && val !== undefined) {
      result.outerFiringError = val === "1";
      i++;
    } else if (key === "1f" && val !== undefined) {
      result.outerFiringErrorMult = parseFloat(val);
      i++;
    }
  }

  return result;
}
