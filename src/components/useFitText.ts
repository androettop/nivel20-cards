import { useEffect, useRef } from "react";

/**
 * Reduce el tamaño de fuente del cuerpo de la carta hasta que el contenido
 * cabe, imitando el comportamiento del template original.
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

    text.style.fontSize = "";
    if (!enabled) return;

    let size = parseFloat(getComputedStyle(text).fontSize);
    const min = 6;
    let guard = 0;
    while (card.scrollHeight > card.clientHeight && size > min && guard < 80) {
      size -= 0.25;
      text.style.fontSize = `${size}px`;
      guard++;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { cardRef, textRef };
}
