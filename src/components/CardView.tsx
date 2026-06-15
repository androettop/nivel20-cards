import type { Card } from "../types";
import type { Config } from "../config";
import { formatRich } from "../lib/format";
import { useFitText } from "./useFitText";

interface Props {
  card: Card;
  config: Config;
}

export function CardView({ card, config }: Props) {
  const { cardRef, textRef } = useFitText<HTMLElement>(config.autoFit, [
    card.description,
    config.cardWidth,
    config.cardHeight,
    config.fontScale,
    config.borderWidth,
    config.showIcons,
    config.boxBg,
  ]);

  const showIconBg = config.iconBg && !!card.iconUrl;

  return (
    <div className="card-wrap">
      <article ref={cardRef} className={`card card--${card.category}`}>
        {showIconBg && (
          <div
            className="card__bg"
            style={{
              backgroundImage: `url("${card.iconUrl}")`,
              opacity: config.iconBgOpacity,
              filter: `blur(${config.iconBgBlur}px)`,
              transform: `scale(${config.iconBgZoom / 100})`,
            }}
          />
        )}
        <header className="card__header">
        {config.showIcons && (
          <img
            className="card__icon"
            src={card.iconUrl || ""}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        )}
        <div className="card__title">{card.name}</div>
        {card.badge && <div className="card__badge">{card.badge}</div>}
      </header>

      {card.subtitle && <div className="card__subtitle">{card.subtitle}</div>}

      {card.meta.length > 0 && (
        <section className="card__meta">
          {card.meta.map((m) => (
            <div className="card__box" key={m.label}>
              <b>{m.label}</b>
              {m.value}
            </div>
          ))}
        </section>
      )}

      <section
        ref={textRef as React.RefObject<HTMLDivElement>}
        className="card__text"
        dangerouslySetInnerHTML={{ __html: formatRich(card.description) }}
      />

      {(card.footerLeft || card.footerRight) && (
        <footer className="card__footer">
          <span>{card.footerLeft || ""}</span>
          <span>{card.footerRight || ""}</span>
        </footer>
      )}
      </article>
    </div>
  );
}
