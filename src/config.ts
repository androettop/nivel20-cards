import type { CardCategory } from "./types";
import { CATEGORY_ORDER } from "./types";

export interface CardSizePreset {
  id: string;
  label: string;
  width: number; // mm
  height: number; // mm
}

export const SIZE_PRESETS: CardSizePreset[] = [
  { id: "poker", label: "Estándar (63 × 88)", width: 63, height: 88 },
  { id: "japanese", label: "Japonesa (59 × 86)", width: 59, height: 86 },
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
  /** Colores de la carta. */
  colors: CardColors;
  /** Si las cajas de metadatos tienen fondo (si no, transparente). */
  boxBg: boolean;
  /** Usar el icono de la carta como fondo. */
  iconBg: boolean;
  iconBgOpacity: number; // 0..1
  iconBgBlur: number; // px
  iconBgZoom: number; // % (>= 100)
  categories: Record<CardCategory, boolean>;
}

export interface CardColors {
  edge: string; // borde exterior
  paper: string; // fondo (papel)
  ink: string; // texto
  accent: string; // acento (títulos de sección, negritas)
  line: string; // marco / líneas interiores
  box: string; // fondo de las cajas (cuando está activado)
}

export const DEFAULT_COLORS: CardColors = {
  edge: "#251911",
  paper: "#fbf3df",
  ink: "#22170f",
  accent: "#8a2f22",
  line: "#6a4b2d",
  box: "#fff8e8",
};

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
  fillCorners: true,
  colors: DEFAULT_COLORS,
  boxBg: false,
  iconBg: false,
  iconBgOpacity: 0.15,
  iconBgBlur: 2,
  iconBgZoom: 110,
  categories: Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, true]),
  ) as Record<CardCategory, boolean>,
};

/** Diseño predefinido: aplica un conjunto de ajustes visuales. */
export interface DesignPreset {
  id: string;
  name: string;
  patch: Partial<Config>;
}

export const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "parchment",
    name: "Pergamino",
    patch: {
      colors: DEFAULT_COLORS,
      boxBg: false,
      fillCorners: true,
      iconBg: false,
      radius: 4,
      borderWidth: 3,
    },
  },
  {
    id: "dark",
    name: "Modo oscuro",
    patch: {
      colors: {
        edge: "#0d0d0d",
        paper: "#201a17",
        ink: "#ece5d8",
        accent: "#e0564f",
        line: "#5a4a39",
        box: "#2a221d",
      },
      boxBg: false,
      fillCorners: true,
      iconBg: true,
      iconBgOpacity: 0.18,
      iconBgBlur: 2,
      iconBgZoom: 115,
      radius: 4,
      borderWidth: 3,
    },
  },
];

const STORAGE_KEY = "nivel20-cards-config-v3";

export function loadConfig(): Config {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      colors: { ...DEFAULT_COLORS, ...(parsed.colors ?? {}) },
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
