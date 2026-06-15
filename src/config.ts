import type { CardCategory } from "./types";
import { CATEGORY_ORDER } from "./types";

export interface CardSizePreset {
  id: string;
  label: string;
  width: number; // mm
  height: number; // mm
}

export const SIZE_PRESETS: CardSizePreset[] = [
  { id: "poker", label: "Póker (63 × 88)", width: 63, height: 88 },
  { id: "bridge", label: "Bridge (56 × 88)", width: 56, height: 88 },
  { id: "mini", label: "Mini USA (41 × 63)", width: 41, height: 63 },
  { id: "tarot", label: "Tarot (70 × 120)", width: 70, height: 120 },
  { id: "custom", label: "Personalizado", width: 63, height: 88 },
];

export interface Config {
  sizePreset: string;
  cardWidth: number; // mm
  cardHeight: number; // mm
  gap: number; // mm (separación entre cartas)
  radius: number; // mm (redondeado)
  borderWidth: number; // mm
  pagePadding: number; // mm (margen de página)
  fontScale: number; // multiplicador del tamaño de fuente
  showIcons: boolean;
  autoFit: boolean;
  /** Esquinas rellenas: el borde negro exterior queda cuadrado. */
  fillCorners: boolean;
  categories: Record<CardCategory, boolean>;
}

export const DEFAULT_CONFIG: Config = {
  sizePreset: "poker",
  cardWidth: 63,
  cardHeight: 88,
  gap: 0,
  radius: 4,
  borderWidth: 3,
  pagePadding: 8,
  fontScale: 1,
  showIcons: true,
  autoFit: true,
  fillCorners: false,
  categories: Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, true]),
  ) as Record<CardCategory, boolean>,
};

const STORAGE_KEY = "nivel20-cards-config-v2";

export function loadConfig(): Config {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      categories: { ...DEFAULT_CONFIG.categories, ...(parsed.categories ?? {}) },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: Config): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}
