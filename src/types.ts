// Tipos del JSON de Nivel20 (parcial: sólo lo que usamos) y de las cartas.

export type CardCategory =
  | "spell"
  | "weapon"
  | "armor"
  | "equipment"
  | "feat";

export interface MetaItem {
  label: string;
  value: string;
}

/** Modelo unificado que renderiza cada carta. */
export interface Card {
  id: string;
  category: CardCategory;
  name: string;
  iconUrl?: string;
  /** Insignia circular (nivel del conjuro, CA, etc.) */
  badge?: string;
  /** Subtítulo (escuela, grupo de arma, categoría de dote…) */
  subtitle?: string;
  /** Cajas de metadatos (tiempo, alcance, daño…) */
  meta: MetaItem[];
  /** Cuerpo en texto (admite markdown sencillo / HTML de Nivel20). */
  description: string;
  /** Pie izquierdo y derecho. */
  footerLeft?: string;
  footerRight?: string;
  /** Para ordenar dentro de su categoría. */
  sortKey: number;
}

export const CATEGORY_LABELS: Record<CardCategory, string> = {
  spell: "Conjuros",
  weapon: "Armas",
  armor: "Armaduras",
  equipment: "Equipo",
  feat: "Dotes y rasgos",
};

export const CATEGORY_ORDER: CardCategory[] = [
  "spell",
  "weapon",
  "armor",
  "equipment",
  "feat",
];
