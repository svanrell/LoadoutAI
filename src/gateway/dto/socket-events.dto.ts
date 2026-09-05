const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ValidatedPregameAction {
  pregameMatchId: string;
  agentUuid: string;
}

export interface ValidatedCreditsAction {
  credits: number;
}

export interface ValidatedMlDraftAction {
  mapName?: string;
  modeName?: string;
  allies?: string[];
}

export interface ValidatedPlayerProfileAction {
  puuid?: string;
  forceRefresh?: boolean;
}

export const KNOWN_AGENT_NAMES = new Set<string>([
  "jett",
  "raze",
  "phoenix",
  "reyna",
  "yoru",
  "neon",
  "iso",
  "waylay",
  "sova",
  "breach",
  "skye",
  "kayo",
  "fade",
  "gekko",
  "tejo",
  "brimstone",
  "omen",
  "viper",
  "astra",
  "harbor",
  "clove",
  "miks",
  "killjoy",
  "cypher",
  "sage",
  "chamber",
  "deadlock",
  "vyse",
  "veto",
]);

export class SocketEventValidator {
  static isUuid(value: unknown): value is string {
    return typeof value === "string" && UUID_REGEX.test(value.trim());
  }

  static isValidAgentIdentifier(value: unknown): boolean {
    if (typeof value !== "string") return false;
    const trimmed = value.trim().toLowerCase();
    if (this.isUuid(trimmed)) return true;
    return KNOWN_AGENT_NAMES.has(trimmed);
  }

  static validatePregameAction(
    data: unknown,
    fallbackMatchId?: string,
  ): ValidatedPregameAction {
    if (!data || typeof data !== "object") {
      throw new Error(
        "Payload inválido para pregame action: debe ser un objeto",
      );
    }

    const payload = data as Record<string, unknown>;
    const rawAgentUuid = payload.agentUuid;
    if (!this.isUuid(rawAgentUuid)) {
      const displayVal =
        typeof rawAgentUuid === "string" ? rawAgentUuid : typeof rawAgentUuid;
      throw new Error(
        `agentUuid inválido: se esperaba formato UUID, recibido: ${displayVal}`,
      );
    }

    const rawMatchId = payload.pregameMatchId || fallbackMatchId;
    if (rawMatchId !== undefined && rawMatchId !== null && rawMatchId !== "") {
      if (!this.isUuid(rawMatchId)) {
        const displayVal =
          typeof rawMatchId === "string" ? rawMatchId : typeof rawMatchId;
        throw new Error(
          `pregameMatchId inválido: formato no coincide con UUID, recibido: ${displayVal}`,
        );
      }
    }

    return {
      pregameMatchId: typeof rawMatchId === "string" ? rawMatchId.trim() : "",
      agentUuid: rawAgentUuid.trim().toLowerCase(),
    };
  }

  static validateCredits(data: unknown): ValidatedCreditsAction {
    if (!data || typeof data !== "object") {
      throw new Error("Payload inválido para créditos: debe ser un objeto");
    }

    const payload = data as Record<string, unknown>;

    if (
      typeof payload.credits !== "number" ||
      !Number.isInteger(payload.credits) ||
      !Number.isFinite(payload.credits) ||
      payload.credits < 0 ||
      payload.credits > 99999
    ) {
      const displayVal =
        typeof payload.credits === "number" ||
        typeof payload.credits === "string"
          ? String(payload.credits)
          : typeof payload.credits;
      throw new Error(
        `Cantidad de créditos inválida: debe ser un número entero entre 0 y 99999. Recibido: ${displayVal}`,
      );
    }

    return {
      credits: payload.credits,
    };
  }

  static validateMlDraft(data: unknown): ValidatedMlDraftAction {
    if (!data || typeof data !== "object") {
      return {};
    }

    const payload = data as Record<string, unknown>;
    const result: ValidatedMlDraftAction = {};

    if (
      payload.mapName !== undefined &&
      payload.mapName !== null &&
      payload.mapName !== ""
    ) {
      if (
        typeof payload.mapName !== "string" ||
        !/^[a-zA-Z0-9_\-\s/]{1,50}$/.test(payload.mapName.trim())
      ) {
        throw new Error(
          "mapName inválido: debe contener caracteres alfanuméricos válidos.",
        );
      }
      result.mapName = payload.mapName.trim();
    }

    if (
      payload.modeName !== undefined &&
      payload.modeName !== null &&
      payload.modeName !== ""
    ) {
      if (
        typeof payload.modeName !== "string" ||
        !/^[a-zA-Z0-9_\-\s]{1,50}$/.test(payload.modeName.trim())
      ) {
        throw new Error(
          "modeName inválido: debe contener caracteres alfanuméricos válidos.",
        );
      }
      result.modeName = payload.modeName.trim();
    }

    if (payload.allies !== undefined && payload.allies !== null) {
      if (!Array.isArray(payload.allies)) {
        throw new Error(
          "allies debe ser un array de identificadores de agentes.",
        );
      }
      if (payload.allies.length > 5) {
        throw new Error(
          "Un equipo de Valorant no puede tener más de 5 aliados.",
        );
      }

      const validatedAllies: string[] = [];
      for (const item of payload.allies) {
        if (typeof item !== "string" || !item.trim()) {
          throw new Error("Cada aliado debe ser una cadena no vacía.");
        }
        const trimmed = item.trim();
        if (!this.isValidAgentIdentifier(trimmed)) {
          throw new Error(`Agente aliado inválido o desconocido: ${trimmed}`);
        }
        validatedAllies.push(trimmed);
      }

      // Validar que no haya agentes aliados duplicados
      const lowerAllies = validatedAllies.map((a) => a.toLowerCase());
      if (new Set(lowerAllies).size !== lowerAllies.length) {
        throw new Error(
          "No se permiten agentes aliados duplicados en la composición.",
        );
      }

      result.allies = validatedAllies;
    }

    return result;
  }

  static validatePlayerProfile(data: unknown): ValidatedPlayerProfileAction {
    if (!data || typeof data !== "object") {
      return { forceRefresh: false };
    }

    const payload = data as Record<string, unknown>;

    if (
      payload.forceRefresh !== undefined &&
      typeof payload.forceRefresh !== "boolean"
    ) {
      throw new Error("forceRefresh debe ser un valor booleano.");
    }

    const result: ValidatedPlayerProfileAction = {
      forceRefresh: Boolean(payload.forceRefresh),
    };

    if (
      payload.puuid !== undefined &&
      payload.puuid !== null &&
      payload.puuid !== ""
    ) {
      if (!this.isUuid(payload.puuid)) {
        throw new Error("PUUID inválido: se esperaba UUID válido.");
      }
      result.puuid = String(payload.puuid).trim();
    }

    return result;
  }
}
