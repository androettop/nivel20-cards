// Utilidades de texto: escape y formateo del contenido de Nivel20.
// Nivel20 mezcla markdown ligero (**negrita**, ***negrita***, tablas, saltos)
// con, a veces, HTML embebido (<p>, <strong>…). Lo normalizamos a HTML simple.

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const ALLOWED_TAGS = /<\/?(p|br|strong|b|em|i|ul|ol|li|table|thead|tbody|tr|th|td)\b[^>]*>/gi;

/** Si el texto ya viene con HTML de Nivel20, lo dejamos pero saneado. */
function looksLikeHtml(text: string): boolean {
  return /<\/?(p|strong|em|br|ul|ol|li|table)\b/i.test(text);
}

function sanitizeHtml(html: string): string {
  // Quita cualquier etiqueta que no esté en la lista blanca.
  return html.replace(/<\/?[a-z][^>]*>/gi, (tag) =>
    ALLOWED_TAGS.test(tag) ? tag : "",
  );
}

/** Convierte una tabla markdown a <table>. */
function renderMarkdownTables(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const isRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
    const isSep = (l: string) => /^\s*\|?[\s:|-]+\|?\s*$/.test(l) && l.includes("-");
    if (isRow(lines[i]) && i + 1 < lines.length && isSep(lines[i + 1])) {
      const cells = (l: string) =>
        l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(lines[i]);
      i += 2;
      const body: string[][] = [];
      while (i < lines.length && isRow(lines[i])) {
        body.push(cells(lines[i]));
        i++;
      }
      const thead = `<tr>${head.map((c) => `<th>${c}</th>`).join("")}</tr>`;
      const tbody = body
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
        .join("");
      out.push(`<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`);
    } else {
      out.push(lines[i]);
      i++;
    }
  }
  return out.join("\n");
}

/** Devuelve HTML listo para inyectar en una carta. */
export function formatRich(input: unknown): string {
  let text = String(input ?? "").trim();
  if (!text) return "";

  if (looksLikeHtml(text)) {
    return sanitizeHtml(text);
  }

  // Normaliza saltos de línea de Windows.
  text = text.replace(/\r\n/g, "\n");

  // Tablas primero (trabajan línea a línea, sin escapar todavía).
  text = renderMarkdownTables(text);

  // Si se generaron tablas, escapamos sólo los fragmentos fuera de <table>.
  const parts = text.split(/(<table>[\s\S]*?<\/table>)/);
  text = parts
    .map((part) =>
      part.startsWith("<table>") ? part : inlineFormat(escapeHtml(part)),
    )
    .join("");

  return text;
}

/** Negritas, cursivas y párrafos sobre texto ya escapado. */
function inlineFormat(escaped: string): string {
  return escaped
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong>$1</strong>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    .replace(/<p><\/p>/g, "");
}

/** Texto plano (para subtítulos / metadatos), sin markdown. */
export function plain(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n/g, " ")
    .replace(/\*\*?\*?/g, "")
    .trim();
}
