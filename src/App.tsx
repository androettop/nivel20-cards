import { useEffect, useMemo, useState } from "react";
import type { Card, CardCategory } from "./types";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "./types";
import { DEFAULT_CONFIG, loadConfig, saveConfig } from "./config";
import type { Config } from "./config";
import { parseCharacter } from "./lib/extract";
import type { ParsedCharacter } from "./lib/extract";
import { fetchCharacter } from "./lib/fetchCharacter";
import { ConfigPanel } from "./components/ConfigPanel";
import { CardView } from "./components/CardView";

const BASE = import.meta.env.BASE_URL;

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [character, setCharacter] = useState<ParsedCharacter | null>(null);

  const [config, setConfig] = useState<Config>(loadConfig);
  useEffect(() => saveConfig(config), [config]);

  const patchConfig = (patch: Partial<Config>) =>
    setConfig((c) => ({ ...c, ...patch }));

  async function handleLoadUrl() {
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchCharacter(url);
      setCharacter(parseCharacter(raw));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCharacter(null);
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => {
    const c = Object.fromEntries(CATEGORY_ORDER.map((k) => [k, 0])) as Record<
      CardCategory,
      number
    >;
    for (const card of character?.cards ?? []) c[card.category]++;
    return c;
  }, [character]);

  const visibleCards: Card[] = useMemo(() => {
    const cards = (character?.cards ?? []).filter(
      (c) => config.categories[c.category],
    );
    return cards.sort((a, b) => {
      const ca = CATEGORY_ORDER.indexOf(a.category);
      const cb = CATEGORY_ORDER.indexOf(b.category);
      if (ca !== cb) return ca - cb;
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
      return a.name.localeCompare(b.name);
    });
  }, [character, config.categories]);

  const pageStyle = {
    "--card-w": `${config.cardWidth}mm`,
    "--card-h": `${config.cardHeight}mm`,
    "--gap": `${config.gap}mm`,
    "--radius": `${config.radius}mm`,
    "--border-w": `${config.borderWidth}mm`,
    "--page-pad": `${config.pagePadding}mm`,
    "--font-scale": String(config.fontScale),
    "--card-edge": config.colors.edge,
    "--paper": config.colors.paper,
    "--ink": config.colors.ink,
    "--card-accent": config.colors.accent,
    "--line": config.colors.line,
    "--box-bg": config.boxBg ? config.colors.box : "transparent",
  } as React.CSSProperties;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src={`${BASE}logo.png`} alt="Nivel20 Cards" className="brand__logo" />
          <div>
            <h1>Cards</h1>
            <p className="brand__tag">Cartas imprimibles para Nivel20</p>
          </div>
        </div>

        <div className="loader">
          <input
            type="url"
            placeholder="Pega la URL del personaje de Nivel20…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoadUrl()}
          />
          <button className="btn" onClick={handleLoadUrl} disabled={loading}>
            {loading ? "Cargando…" : "Generar cartas"}
          </button>
          <button className="btn btn--ghost" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="layout">
        <ConfigPanel
          config={config}
          counts={counts}
          onChange={patchConfig}
          onReset={() => setConfig(DEFAULT_CONFIG)}
        />

        <main className="content">
          {!character && !loading && <EmptyState />}

          {character && (
            <>
              <div className="char-bar">
                {character.info.imageUrl && (
                  <img src={character.info.imageUrl} alt="" className="char-bar__img" />
                )}
                <div>
                  <strong>{character.info.name}</strong>
                  <span>
                    {[character.info.levelDesc, character.info.raceName]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <div className="char-bar__count">
                  {visibleCards.length} cartas
                </div>
              </div>

              {visibleCards.length === 0 ? (
                <p className="muted">
                  No hay cartas para las categorías seleccionadas.
                </p>
              ) : (
                <div
                  className={`page${config.fillCorners ? " page--square" : ""}`}
                  style={pageStyle}
                >
                  {visibleCards.map((card) => (
                    <CardView key={card.id} card={card} config={config} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <footer className="site-footer">
        Proyecto no oficial de la comunidad. No está afiliado a Nivel20. ·{" "}
        Cartas pensadas para impresión a escala 100% (sin «ajustar a página»).
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty">
      <h2>Genera tus cartas</h2>
      <ol>
        <li>Abre tu personaje en Nivel20 y copia la URL.</li>
        <li>Pégala arriba y pulsa <b>Generar cartas</b>.</li>
        <li>Ajusta tamaño y separación en el panel y pulsa <b>Imprimir</b>.</li>
      </ol>
      <p className="muted">
        Se generan cartas de {CATEGORY_ORDER.map((c) => CATEGORY_LABELS[c].toLowerCase()).join(", ")}.
      </p>

      <section className="promo">
        <h3>¿Conoces Nivel21?</h3>
        <p>
          <strong>Nivel21</strong> es una extensión de navegador que mejora tu
          experiencia en Nivel20: añade atajos de teclado, tiradas con
          ventaja/desventaja, auras y capas de tokens, mediciones persistentes,
          utilidades para el DM, pantalla de referencia y mucho más.
        </p>
        <p className="muted">
          Es un proyecto independiente de la comunidad, no oficial ni afiliado a
          Nivel20 — igual que este generador de cartas.
        </p>
        <a
          className="btn promo__btn"
          href="https://github.com/androettop/nivel21"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver Nivel21 en GitHub →
        </a>
      </section>
    </div>
  );
}
