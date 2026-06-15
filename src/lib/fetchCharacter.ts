// Descarga el JSON del personaje a partir de la URL que pega el usuario.
// Como la app vive en GitHub Pages y Nivel20 puede no enviar cabeceras CORS,
// intentamos primero la petición directa y, si falla, usamos proxies CORS
// públicos como alternativa.

const CORS_PROXIES: ((url: string) => string)[] = [
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

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
    throw new Error("La respuesta no es un JSON válido.");
  }
}

export async function fetchCharacter(rawUrl: string): Promise<unknown> {
  const url = rawUrl.trim();
  if (!url) throw new Error("Pega la URL del personaje.");

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("La URL no es válida.");
  }
  if (!/^https?:$/.test(parsedUrl.protocol)) {
    throw new Error("La URL debe empezar por http(s)://");
  }

  const attempts: string[] = [url, ...CORS_PROXIES.map((p) => p(url))];
  let lastError: unknown;

  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt, {
        headers: { Accept: "application/json, text/plain, */*" },
      });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} ${res.statusText}`);
        continue;
      }
      const data = await tryParse(res);
      if (isProbablyCharacter(data)) return data;
      lastError = new Error(
        "El contenido no parece un personaje de Nivel20. ¿Es la URL del JSON?",
      );
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    lastError instanceof Error
      ? `No se pudo obtener el personaje: ${lastError.message}`
      : "No se pudo obtener el personaje.",
  );
}
