// Descarga el JSON del personaje a partir de la URL que pega el usuario.
// Como la app vive en GitHub Pages y Nivel20 puede no enviar cabeceras CORS,
// intentamos primero la petición directa y, si falla, usamos proxies CORS
// públicos como alternativa.

const CORS_PROXIES: ((url: string) => string)[] = [
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/**
 * Genera las URLs candidatas del JSON del personaje, en orden de preferencia,
 * a partir de la URL (o el ID) que pega el usuario. Acepta, por ejemplo:
 *   https://nivel20.com/games/dnd-2024/characters/1954502-kelsier
 *   https://nivel20.com/games/dnd-2024/campaigns/138786-luna-de-sangre/characters/1954502-kelsier
 *   https://nivel20.com/games/dnd-2024/characters/1954502-kelsier.json  (ya lista)
 *   1954502                                                             (sólo el ID)
 *
 * La forma más fiable es añadir ".json" a la RUTA COMPLETA (conservando el
 * segmento del juego y el slug); como alternativa probamos la ruta corta
 * /characters/<id>.json.
 */
export function characterJsonCandidates(input: string): string[] {
  const raw = input.trim();
  const out: string[] = [];
  const add = (u: string) => {
    if (u && !out.includes(u)) out.push(u);
  };

  // Sólo el ID numérico → única opción posible.
  if (/^\d+$/.test(raw)) {
    add(`https://nivel20.com/characters/${raw}.json`);
    return out;
  }

  let parsed: URL | null = null;
  try {
    parsed = new URL(raw);
  } catch {
    /* no es una URL */
  }

  if (parsed) {
    // 1) Ruta completa + ".json" (la que mejor funciona).
    if (parsed.pathname.endsWith(".json")) {
      add(parsed.toString());
    } else {
      const full = new URL(parsed.toString());
      full.pathname = full.pathname.replace(/\/+$/, "") + ".json";
      add(full.toString());
    }
    // 2) Alternativa corta /characters/<id>.json (ignora el id de campaña).
    const match = parsed.pathname.match(/\/characters\/(\d+)/);
    if (match) add(`https://nivel20.com/characters/${match[1]}.json`);
  } else {
    add(raw);
  }

  return out;
}

/** URL principal (la primera candidata); útil para mostrarla al usuario. */
export function toCharacterJsonUrl(input: string): string {
  return characterJsonCandidates(input)[0] ?? input.trim();
}

function isProbablyCharacter(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return "printable_hash" in v || "info" in v || "spell_books" in v;
}

async function tryParse(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const preview = text.slice(0, 120).replace(/\s+/g, " ").trim();
    throw new Error(
      `La respuesta no es JSON${preview ? ` (empieza con: "${preview}…")` : ""}.`,
    );
  }
}

/** Convierte un error de fetch en un mensaje legible. */
function describeError(err: unknown): string {
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    // El navegador oculta el detalle por seguridad: casi siempre es CORS,
    // un dominio inaccesible o falta de conexión.
    return "no se pudo conectar (posible bloqueo CORS o sin conexión)";
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function fetchCharacter(rawUrl: string): Promise<unknown> {
  if (!rawUrl.trim()) throw new Error("Pega la URL del personaje.");

  const candidates = characterJsonCandidates(rawUrl).filter((c) => {
    try {
      return /^https?:$/.test(new URL(c).protocol);
    } catch {
      return false;
    }
  });

  if (!candidates.length) {
    throw new Error(
      `No reconozco la URL del personaje: "${rawUrl.trim()}". ` +
        "Pega la dirección de la página del personaje en Nivel20.",
    );
  }

  // Transportes: directo y, si falla (típicamente por CORS), proxies públicos.
  const transports: { name: string; make: (u: string) => string }[] = [
    { name: "directo", make: (u) => u },
    ...CORS_PROXIES.map((p, i) => ({ name: `proxy ${i + 1}`, make: p })),
  ];

  const failures: string[] = [];
  const short = (u: string) => u.replace(/^https?:\/\//, "");

  console.groupCollapsed("[nivel20-cards] Descargando personaje");
  console.info(`URL pegada: ${rawUrl.trim()}`);
  console.info(`URLs candidatas:`, candidates);

  try {
    for (const candidate of candidates) {
      for (const t of transports) {
        const target = t.make(candidate);
        const tag = `${t.name} · ${short(candidate)}`;
        const started = performance.now();
        try {
          console.info(`Intento [${tag}]: ${target}`);
          const res = await fetch(target, {
            headers: { Accept: "application/json" },
          });
          const ms = Math.round(performance.now() - started);

          if (!res.ok) {
            const msg = `HTTP ${res.status} ${res.statusText}`;
            console.warn(`  ✗ ${tag}: ${msg} (${ms} ms)`);
            failures.push(`${tag} → ${msg}`);
            continue;
          }

          const data = await tryParse(res);
          if (!isProbablyCharacter(data)) {
            const msg = "respondió, pero no parece un personaje de Nivel20";
            console.warn(`  ✗ ${tag}: ${msg} (${ms} ms)`, data);
            failures.push(`${tag} → ${msg}`);
            continue;
          }

          console.info(`  ✓ ${tag}: OK (${ms} ms)`);
          return data;
        } catch (err) {
          const ms = Math.round(performance.now() - started);
          const msg = describeError(err);
          console.warn(`  ✗ ${tag}: ${msg} (${ms} ms)`, err);
          failures.push(`${tag} → ${msg}`);
        }
      }
    }
  } finally {
    console.groupEnd();
  }

  console.error("[nivel20-cards] Todos los intentos fallaron:", failures);
  throw new Error(
    "No se pudo obtener el personaje.\n" +
      failures.map((f) => `• ${f}`).join("\n") +
      '\n\nRevisa la URL. Si persiste, usa "Pega el JSON manualmente" ' +
      "(detalles en la consola del navegador, F12).",
  );
}
