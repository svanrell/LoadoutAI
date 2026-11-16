/**
 * savedCrosshairs.ts
 * ==================
 * Miras guardadas por el usuario en localStorage.
 * Todo acceso a localStorage va en try/catch: si no está disponible (modo privado,
 * datos bloqueados, cuota llena) la app sigue funcionando sin miras guardadas.
 * La lectura se expone como "store" externo para useSyncExternalStore.
 */

export interface SavedCrosshair {
  id: string;
  /** Código de perfil de mira de Valorant */
  code: string;
  /** Momento del guardado (ms desde epoch) */
  savedAt: number;
}

export const SAVED_CROSSHAIRS_STORAGE_KEY = "loadout_saved_crosshairs";
export const MAX_SAVED_CROSSHAIRS = 20;
/** Evento propio para avisar a los suscriptores de la misma pestaña */
const CHANGE_EVENT = "loadout:saved-crosshairs-changed";
const EMPTY_LIST: SavedCrosshair[] = [];

// ----------------------------------------------------------------------------
// Operaciones puras sobre la lista
// ----------------------------------------------------------------------------

/** Lee y valida el JSON guardado; cualquier dato inválido se descarta */
export function parseSavedCrosshairs(raw: string | null): SavedCrosshair[] {
  if (!raw) return EMPTY_LIST;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return EMPTY_LIST;
    return data.filter(
      (item): item is SavedCrosshair =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.code === "string" &&
        item.code.trim() !== "" &&
        typeof item.savedAt === "number"
    );
  } catch {
    return EMPTY_LIST;
  }
}

/**
 * Añade una mira al principio. Si el código ya estaba guardado, se mueve arriba
 * en lugar de duplicarse. Se conservan como mucho `max` miras.
 */
export function addToSavedList(
  list: SavedCrosshair[],
  entry: SavedCrosshair,
  max: number = MAX_SAVED_CROSSHAIRS
): SavedCrosshair[] {
  const withoutSameCode = list.filter((item) => item.code !== entry.code);
  return [entry, ...withoutSameCode].slice(0, max);
}

export function removeFromSavedList(list: SavedCrosshair[], id: string): SavedCrosshair[] {
  return list.filter((item) => item.id !== id);
}

// ----------------------------------------------------------------------------
// Acceso a localStorage (siempre con try/catch)
// ----------------------------------------------------------------------------

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(SAVED_CROSSHAIRS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeList(list: SavedCrosshair[]): boolean {
  try {
    window.localStorage.setItem(SAVED_CROSSHAIRS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return true;
}

// Caché por texto guardado: useSyncExternalStore exige devolver la misma
// referencia mientras los datos no cambien
let cachedRaw: string | null = null;
let cachedList: SavedCrosshair[] = EMPTY_LIST;

export function getSavedCrosshairsSnapshot(): SavedCrosshair[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = parseSavedCrosshairs(raw);
  }
  return cachedList;
}

/** En el servidor y durante la hidratación no hay miras guardadas */
export function getSavedCrosshairsServerSnapshot(): SavedCrosshair[] {
  return EMPTY_LIST;
}

/** Avisa de cambios en esta pestaña (evento propio) y en otras (evento storage) */
export function subscribeSavedCrosshairs(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SAVED_CROSSHAIRS_STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Guarda una mira. Devuelve false si localStorage no está disponible o está lleno. */
export function saveCrosshairCode(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed) return false;
  const savedAt = Date.now();
  const entry: SavedCrosshair = {
    id: `${savedAt.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    code: trimmed,
    savedAt,
  };
  return writeList(addToSavedList(getSavedCrosshairsSnapshot(), entry));
}

/** Borra una mira guardada. Devuelve false si no se pudo escribir en localStorage. */
export function deleteSavedCrosshairById(id: string): boolean {
  return writeList(removeFromSavedList(getSavedCrosshairsSnapshot(), id));
}
