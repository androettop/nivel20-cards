import type { Card, MetaItem } from "../types";
import { plain } from "./format";

// El JSON de Nivel20 es muy laxo, así que trabajamos con `any` controlado.
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface CharacterInfo {
  name: string;
  levelDesc?: string;
  raceName?: string;
  player?: string;
  campaign?: string;
  imageUrl?: string;
}

export interface ParsedCharacter {
  info: CharacterInfo;
  cards: Card[];
}

function meta(label: string, value: unknown): MetaItem | null {
  const v = plain(value);
  return v ? { label, value: v } : null;
}

function metas(...items: (MetaItem | null)[]): MetaItem[] {
  return items.filter((m): m is MetaItem => m !== null);
}

/** Añade las etiquetas (Alcance, Arrojadiza…) al final de la descripción. */
function withTags(description: unknown, tags: unknown): string {
  const base = String(description ?? "").trim();
  if (Array.isArray(tags) && tags.length) {
    const list = tags.map((t) => plain(t)).filter(Boolean).join(", ");
    if (list) return `${base}\n\n**Etiquetas:** ${list}`.trim();
  }
  return base;
}

/** El JSON puede venir envuelto en printable_hash. */
export function unwrap(raw: any): any {
  return raw?.printable_hash ?? raw;
}

export function parseCharacter(raw: any): ParsedCharacter {
  const data = unwrap(raw);
  const info = extractInfo(data);
  const cards: Card[] = ensureUniqueIds(
    dedupeCards([
      ...extractSpells(data),
      ...extractWeapons(data),
      ...extractArmor(data),
      ...extractEquipment(data),
      ...extractFeats(data),
    ]),
  );
  // Las cartas sin icono usan la foto del personaje como respaldo.
  if (info.imageUrl) {
    for (const card of cards) {
      if (!card.iconUrl) card.iconUrl = info.imageUrl;
    }
  }
  return { info, cards };
}

/**
 * Elimina cartas repetidas (misma categoría y nombre). Pasa, por ejemplo, con
 * las armaduras que aparecen a la vez en `items.armaduras` y en `protections`,
 * o con un conjuro listado en varios grupos del libro.
 */
function dedupeCards(cards: Card[]): Card[] {
  const seen = new Set<string>();
  const out: Card[] = [];
  for (const card of cards) {
    const key = `${card.category}|${card.name.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(card);
  }
  return out;
}

/**
 * Garantiza ids únicos para usarlos como `key` en React. Dos objetos con el
 * mismo nombre (p. ej. dos "Daga") generarían la misma key, lo que provoca
 * cartas duplicadas o intercambiadas al filtrar/ordenar.
 */
function ensureUniqueIds(cards: Card[]): Card[] {
  const seen = new Map<string, number>();
  for (const card of cards) {
    const n = (seen.get(card.id) ?? 0) + 1;
    seen.set(card.id, n);
    if (n > 1) card.id = `${card.id}__${n}`;
  }
  return cards;
}

function extractInfo(data: any): CharacterInfo {
  const i = data?.info ?? {};
  return {
    name: i.name || "Personaje",
    levelDesc: i.level_desc,
    raceName: i.race_name || i.race,
    player: i.player,
    campaign: i.campaign,
    imageUrl: i.image_url,
  };
}

// ---------------------------------------------------------------- Conjuros

function extractSpells(data: any): Card[] {
  const books: any[] = data?.spell_books ?? data?.spells_book ?? [];
  const cards: Card[] = [];

  for (const book of books) {
    const bookName = book?.profession_name || "";
    const groups: any[] = [
      ...(book?.spells ?? []),
      ...(book?.focus_spells ?? []),
    ];
    for (const group of groups) {
      const groupLevel = Array.isArray(group) ? group[0] : group?.level;
      const list = Array.isArray(group) ? group[1] : group?.spells;
      for (const spell of list ?? []) {
        if (spell?.included === false) continue;
        cards.push(toSpellCard(spell, bookName, groupLevel));
      }
    }
  }
  return cards;
}

function toSpellCard(spell: any, bookName: string, groupLevel: any): Card {
  const level = Number(spell.level ?? groupLevel ?? 0);
  const isCantrip = level === 0;
  const typeText = isCantrip ? "Truco" : `Nivel ${level}`;
  const school = plain(spell.spell_school_name);
  const ritual = spell.ritual ? " · Ritual" : "";

  return {
    id: `spell-${spell.id ?? spell.character_spell_id ?? spell.name}`,
    category: "spell",
    name: spell.name || "Conjuro",
    iconUrl: spell.icon_url || undefined,
    badge: isCantrip ? "T" : String(level),
    subtitle: [typeText, school].filter(Boolean).join(" · ") + ritual,
    meta: metas(
      meta("Tiempo", spell.short_casting_time || spell.casting_time),
      meta("Alcance", spell.range),
      meta("Duración", spell.duration),
      meta("Componentes", spell.short_components || spell.components),
    ),
    description: spell.summary || spell.description || "",
    footerLeft: plain(spell.attack || spell.saving_throw) || undefined,
    footerRight: bookName || undefined,
    sortKey: level * 1000,
  };
}

// ------------------------------------------------------------------- Armas

function extractWeapons(data: any): Card[] {
  const list = collectItems(data, "armas").filter((it) => it.grants_attack || it.attack?.damage?.value);
  return list.map(toWeaponCard);
}

function toWeaponCard(item: any): Card {
  const atk = item.attack ?? {};
  const dmg = atk.damage ?? {};
  const toHit = atk.to_hit?.value;
  const toHitText =
    toHit !== undefined && toHit !== null && toHit !== ""
      ? (Number(toHit) >= 0 ? `+${toHit}` : String(toHit))
      : "";
  const damageText = [plain(dmg.value), plain(dmg.type)].filter(Boolean).join(" ");
  const versatile = item.fields?.versatil;

  return {
    id: `weapon-${item.name}`,
    category: "weapon",
    name: item.name || "Arma",
    iconUrl: item.icon_url || undefined,
    subtitle: plain(item.group) || "Arma",
    meta: metas(
      toHitText ? { label: "Al golpe", value: toHitText } : null,
      damageText ? { label: "Daño", value: damageText } : null,
      versatile ? { label: "Versátil", value: plain(versatile) } : null,
      meta("Alcance", atk.range),
    ),
    description: withTags(item.description, item.tags),
    sortKey: 0,
  };
}

// --------------------------------------------------------------- Armaduras

function extractArmor(data: any): Card[] {
  const list = collectItems(data, "armaduras");
  // Las protecciones también pueden venir en `protections`.
  const protections: any[] = data?.protections ?? [];
  return [...list, ...protections].map(toArmorCard);
}

function toArmorCard(item: any): Card {
  const armor = item.armor ?? {};
  const ca = plain(armor.value);
  return {
    id: `armor-${item.name}`,
    category: "armor",
    name: item.name || "Armadura",
    iconUrl: item.icon_url || undefined,
    badge: ca || undefined,
    subtitle: plain(item.group) || "Armadura",
    meta: metas(
      ca ? { label: "CA", value: ca } : null,
      meta("Máx. habilidad", armor.max_ability),
      meta("Penalización", armor.penalty),
      meta("Ranura", item.slot),
    ),
    description: withTags(item.description, item.tags),
    sortKey: 0,
  };
}

// ------------------------------------------------------------------ Equipo

function extractEquipment(data: any): Card[] {
  // Todo lo de items que no sea arma ni armadura.
  const buckets = data?.items ?? {};
  const result: Card[] = [];
  for (const [key, value] of Object.entries(buckets)) {
    if (key === "armas" || key === "armaduras") continue;
    if (Array.isArray(value)) {
      for (const item of value as any[]) result.push(toEquipmentCard(item));
    }
  }
  return result;
}

function toEquipmentCard(item: any): Card {
  const qty = item.fields?.cantidad ?? item.quantity;
  return {
    id: `equip-${item.name}`,
    category: "equipment",
    name: item.name || "Objeto",
    iconUrl: item.icon_url || undefined,
    subtitle: plain(item.group) || "Equipo",
    meta: metas(
      qty ? { label: "Cantidad", value: plain(qty) } : null,
      meta("Ranura", item.slot),
    ),
    description: withTags(item.description, item.tags),
    sortKey: 0,
  };
}

// -------------------------------------------------------------- Dotes/rasgos

function extractFeats(data: any): Card[] {
  const sources: any[] = [
    ...(data?.feats ?? []),
    ...(data?.race_feats ?? []),
    ...(data?.other_feats ?? []),
    ...(data?.custom_feats ?? []),
  ];
  const seen = new Set<string>();
  const cards: Card[] = [];
  for (const feat of sources) {
    if (feat?.visible === false) continue;
    const name = feat?.name;
    if (!name || seen.has(name)) continue;
    seen.add(name);
    cards.push(toFeatCard(feat));
  }
  return cards;
}

function toFeatCard(feat: any): Card {
  return {
    id: `feat-${feat.id ?? feat.name}`,
    category: "feat",
    name: feat.name || "Rasgo",
    subtitle: plain(feat.category) || "Dote / Rasgo",
    meta: metas(meta("Requisitos", feat.prerequisites)),
    description: feat.summary || feat.description || "",
    footerRight: plain(feat.source_name) || undefined,
    sortKey: 0,
  };
}

// ------------------------------------------------------------------- helpers

/** items.<key> puede ser array; devuelve [] si no existe. */
function collectItems(data: any, key: string): any[] {
  const v = data?.items?.[key];
  return Array.isArray(v) ? v : [];
}
