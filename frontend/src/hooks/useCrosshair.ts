"use client";

import { useState, useMemo, useCallback } from "react";
import {
  CrosshairConfig,
  DEFAULT_CONFIG,
  COLOR_PRESETS,
  serializeValorantCode,
  parseValorantCode,
} from "@/data/crosshairData";

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

  /**
   * Punto de conexión para backend/guardado:
   * Si en el futuro quieres enviar la mira al backend o a la API local de Valorant,
   * puedes llamarlo aquí sin tocar los botones de la interfaz.
   */
  const saveCrosshair = useCallback(
    (onSaveExternal?: (config: CrosshairConfig, code: string) => void) => {
      if (onSaveExternal) {
        onSaveExternal(config, currentCode);
      }
      // Aquí se puede añadir comunicación con el backend (ej: socket o fetch)
    },
    [config, currentCode]
  );

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
    saveCrosshair,
  };
}
