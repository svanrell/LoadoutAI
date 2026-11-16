"use client";

import { useState, useMemo, useCallback, useSyncExternalStore } from "react";
import {
  CrosshairConfig,
  DEFAULT_CONFIG,
  COLOR_PRESETS,
  serializeValorantCode,
  parseValorantCode,
} from "@/data/crosshairData";
import {
  deleteSavedCrosshairById,
  getSavedCrosshairsServerSnapshot,
  getSavedCrosshairsSnapshot,
  saveCrosshairCode,
  subscribeSavedCrosshairs,
} from "@/lib/savedCrosshairs";

/** Resultado del último guardado, para el aviso del botón Guardar */
export type CrosshairSaveStatus = "idle" | "saved" | "error";

/**
 * Hook personalizado para aislar TODA la lógica de la mira.
 * Separa el estado, las modificaciones y la interacción (lógica/backend)
 * de los componentes visuales (interfaz/frontend).
 */
export function useCrosshair(initialConfig: CrosshairConfig = DEFAULT_CONFIG) {
  // Estado actual de la mira
  const [config, setConfig] = useState<CrosshairConfig>(initialConfig);

  // Fondo seleccionado para la vista previa
  const [selectedBg, setSelectedBg] = useState<string>("range");

  // Estado del botón copiar código (temporalmente activo al pulsar)
  const [copied, setCopied] = useState<boolean>(false);

  // Visibilidad del modal para importar código
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Código oficial de Valorant generado en tiempo real
  const currentCode = useMemo(() => {
    return serializeValorantCode(config);
  }, [config]);

  /**
   * Actualiza una propiedad concreta de la mira cuando se cambia un botón, toggle o slider.
   * Modifica una copia limpia sin usar el operador '...'.
   */
  const updateSetting = useCallback((propiedad: keyof CrosshairConfig, valor: any) => {
    setConfig((prevConfig) => {
      const nuevaConfig = Object.assign({}, prevConfig);
      (nuevaConfig as any)[propiedad] = valor;
      return nuevaConfig;
    });
  }, []);

  /**
   * Restablece la mira a la configuración por defecto de Valorant.
   */
  const resetCrosshair = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  /**
   * Genera una mira aleatoria con colores y proporciones jugables.
   */
  const randomizeCrosshair = useCallback(() => {
    const randomHex = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)].hex;
    const randomLength = Math.floor(Math.random() * 6) + 2;
    const randomThickness = Math.floor(Math.random() * 2) + 1;
    const randomOffset = Math.floor(Math.random() * 4) + 1;

    setConfig((prevConfig) => {
      const nuevaConfig = Object.assign({}, prevConfig);
      nuevaConfig.color = randomHex;
      nuevaConfig.innerLines = true;
      nuevaConfig.innerLineLength = randomLength;
      nuevaConfig.innerLineLengthVertical = randomLength;
      nuevaConfig.innerLineThickness = randomThickness;
      nuevaConfig.innerLineOffset = randomOffset;
      nuevaConfig.outlines = Math.random() > 0.4;
      nuevaConfig.centerDot = Math.random() > 0.7;
      return nuevaConfig;
    });
  }, []);

  /**
   * Importa y parsea un código de retícula oficial de Valorant.
   */
  const applyImportCode = useCallback((rawCode: string) => {
    const parsed = parseValorantCode(rawCode);
    if (parsed) {
      setConfig((prevConfig) => Object.assign({}, prevConfig, parsed));
      setShowImportModal(false);
      return true;
    }
    return false;
  }, []);

  /**
   * Copia el código de perfil al portapapeles del sistema.
   */
  const copyCode = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [currentCode]);

  // Miras guardadas en localStorage (vacío en el servidor y en la hidratación)
  const savedCrosshairs = useSyncExternalStore(
    subscribeSavedCrosshairs,
    getSavedCrosshairsSnapshot,
    getSavedCrosshairsServerSnapshot
  );

  // Aviso temporal tras pulsar Guardar ("saved" o "error")
  const [saveStatus, setSaveStatus] = useState<CrosshairSaveStatus>("idle");

  /**
   * Guarda la mira actual en localStorage. Si no se puede (localStorage no
   * disponible o lleno) lo indica con saveStatus "error".
   */
  const saveCrosshair = useCallback(() => {
    const ok = saveCrosshairCode(currentCode);
    setSaveStatus(ok ? "saved" : "error");
    setTimeout(() => setSaveStatus("idle"), 2000);
    return ok;
  }, [currentCode]);

  /** Carga una mira guardada (por su código) en el editor */
  const loadSavedCrosshair = useCallback(
    (code: string) => applyImportCode(code),
    [applyImportCode]
  );

  /** Borra una mira guardada */
  const deleteSavedCrosshair = useCallback((id: string) => deleteSavedCrosshairById(id), []);

  return {
    // Estado y datos
    config,
    setConfig,
    currentCode,
    selectedBg,
    setSelectedBg,
    copied,
    showImportModal,
    setShowImportModal,

    // Acciones y lógica de la mira
    updateSetting,
    resetCrosshair,
    randomizeCrosshair,
    applyImportCode,
    copyCode,

    // Miras guardadas (localStorage)
    savedCrosshairs,
    saveStatus,
    saveCrosshair,
    loadSavedCrosshair,
    deleteSavedCrosshair,
  };
}
