import { useEffect, useRef } from "react";

/**
 * Reduce el tamaño de fuente del cuerpo de la carta hasta que la descripción
 * cabe en el espacio disponible (desde su inicio hasta donde empieza el pie,
 * o el fondo de la carta si no hay pie). Solo reduce, nunca agranda.
 */
export function useFitText<T extends HTMLElement>(
  enabled: boolean,
  deps: unknown[],
) {
  const cardRef = useRef<T>(null);
  const textRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const text = textRef.current;
    if (!card || !text) return;

    // Siempre partimos del tamaño base definido por CSS.
    text.style.fontSize = "";
    if (!enabled) return;

    const MIN = 6; // pt/px mínimo legible
    const SAFETY = 1; // margen para no rozar el pie

    // Altura disponible para la descripción dentro de la carta.
    const available = (): number => {
      const footer = card.querySelector<HTMLElement>(".card__footer");
      const textTop = text.getBoundingClientRect().top;
      let bottomLimit: number;
      if (footer) {
        bottomLimit = footer.getBoundingClientRect().top;
      } else {
        const pb = parseFloat(getComputedStyle(card).paddingBottom) || 0;
        bottomLimit = card.getBoundingClientRect().bottom - pb;
      }
      return bottomLimit - textTop - SAFETY;
    };

    const fit = () => {
      text.style.fontSize = "";
      let size = parseFloat(getComputedStyle(text).fontSize);
      let guard = 0;
      while (text.scrollHeight > available() && size > MIN && guard < 300) {
        size -= 0.25;
        text.style.fontSize = `${size}px`;
        guard++;
      }
    };

    fit();

    // Reajusta cuando las fuentes web terminan de cargar (cambian las métricas).
    let cancelled = false;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) fit();
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { cardRef, textRef };
}
