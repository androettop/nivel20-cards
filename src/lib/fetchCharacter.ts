// Descarga el JSON del personaje a partir de la URL que pega el usuario.
// Como la app vive en GitHub Pages y Nivel20 puede no enviar cabeceras CORS,
// intentamos primero la petición directa y, si falla, usamos proxies CORS
// públicos como alternativa.

const CORS_PROXIES: ((url: string) => string)[] = [
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/**
 * Convierte la URL pegada por el usuario en la URL del JSON del personaje.
 * Acepta, por ejemplo:
 *   https://nivel20.com/games/dnd-2024/characters/1954502-kelsier
 *   https://nivel20.com/games/dnd-2024/campaigns/138786-luna-de-sangre/characters/1954502-kelsier
 *   https://nivel20.com/characters/1954502.json   (ya lista)
 *   1954502                                        (sólo el ID)
 * y devuelve: https://nivel20.com/characters/1954502.json
 */
export function toCharacterJsonUrl(input: string): string {
  const raw = input.trim();

  // Sólo el ID numérico.
  if (/^\d+$/.test(raw)) {
    return `https://nivel20.com/characters/${raw}.json`;
  }

  // El ID es el número que sigue a /characters/ (ignora el de /campaigns/).
  const match = raw.match(/\/characters\/(\d+)/);
  if (match) {
    return `https://nivel20.com/characters/${match[1]}.json`;
  }

  return raw;
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
  const url = toCharacterJsonUrl(rawUrl);

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`La URL no es válida: "${rawUrl.trim()}"`);
  }
  if (!/^https?:$/.test(parsedUrl.protocol)) {
    throw new Error("La URL debe empezar por http:// o https://");
  }

  const attempts: { label: string; url: string }[] = [
    { label: "directo", url },
    ...CORS_PROXIES.map((p, i) => ({ label: `proxy ${i + 1}`, url: p(url) })),
  ];
  const failures: string[] = [];

  console.groupCollapsed(`[nivel20-cards] Descargando personaje → ${url}`);
  if (url !== rawUrl.trim()) {
    console.info(`URL pegada: ${rawUrl.trim()}`);
  }

  try {
    for (const attempt of attempts) {
      const started = performance.now();
      try {
        console.info(`Intento (${attempt.label}): ${attempt.url}`);
        const res = await fetch(attempt.url, {
          headers: { Accept: "application/json, text/plain, */*" },
        });
        const ms = Math.round(performance.now() - started);

        if (!res.ok) {
          const msg = `HTTP ${res.status} ${res.statusText}`;
          console.warn(`  ✗ ${attempt.label}: ${msg} (${ms} ms)`);
          failures.push(`${attempt.label}: ${msg}`);
          continue;
        }

        const data = await tryParse(res);
        if (!isProbablyCharacter(data)) {
          const msg = "respondió, pero no parece un personaje de Nivel20";
          console.warn(`  ✗ ${attempt.label}: ${msg} (${ms} ms)`, data);
          failures.push(`${attempt.label}: ${msg}`);
          continue;
        }

        console.info(`  ✓ ${attempt.label}: OK (${ms} ms)`);
        return data;
      } catch (err) {
        const ms = Math.round(performance.now() - started);
        const msg = describeError(err);
        console.warn(`  ✗ ${attempt.label}: ${msg} (${ms} ms)`, err);
        failures.push(`${attempt.label}: ${msg}`);
      }
    }
  } finally {
    console.groupEnd();
  }

  console.error("[nivel20-cards] Todos los intentos fallaron:", failures);
  throw new Error(
    `No se pudo obtener el personaje desde ${url}.\n` +
      failures.map((f) => `• ${f}`).join("\n") +
      "\n\nRevisa que la URL sea correcta. Si el problema persiste, usa " +
      '"Pega el JSON manualmente". (Detalles en la consola del navegador).',
  );
}
