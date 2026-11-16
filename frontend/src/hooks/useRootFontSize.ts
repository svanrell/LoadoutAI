"use client";

import { useSyncExternalStore } from "react";

/** Tamaño de letra raíz por defecto del navegador (px) */
export const DEFAULT_ROOT_FONT_SIZE = 16;

function subscribe(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function getSnapshot(): number {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || DEFAULT_ROOT_FONT_SIZE;
}

function getServerSnapshot(): number {
  return DEFAULT_ROOT_FONT_SIZE;
}

/**
 * Tamaño de letra raíz en px, para convertir rem en coordenadas de SVG.
 * En el servidor y durante la hidratación vale 16 (sin desajustes de hidratación);
 * después React pasa al valor real y lo actualiza si cambia el tamaño de la ventana.
 */
export function useRootFontSize(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
