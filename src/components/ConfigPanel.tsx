import type { Config } from "../config";
import { SIZE_PRESETS } from "../config";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "../types";
import type { CardCategory } from "../types";

interface Props {
  config: Config;
  counts: Record<CardCategory, number>;
  onChange: (patch: Partial<Config>) => void;
  onReset: () => void;
}

export function ConfigPanel({ config, counts, onChange, onReset }: Props) {
  const setSize = (id: string) => {
    const preset = SIZE_PRESETS.find((p) => p.id === id)!;
    if (id === "custom") {
      onChange({ sizePreset: id });
    } else {
      onChange({ sizePreset: id, cardWidth: preset.width, cardHeight: preset.height });
    }
  };

  const toggleCategory = (cat: CardCategory) =>
    onChange({ categories: { ...config.categories, [cat]: !config.categories[cat] } });

  return (
    <aside className="config">
      <div className="config__head">
        <h2>Configuración</h2>
        <button className="btn btn--ghost" onClick={onReset}>
          Restablecer
        </button>
      </div>

      <section className="config__group">
        <h3>Tamaño de carta</h3>
        <label className="field">
          <span>Preajuste</span>
          <select value={config.sizePreset} onChange={(e) => setSize(e.target.value)}>
            {SIZE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <div className="field-row">
          <NumberField
            label="Ancho (mm)"
            value={config.cardWidth}
            min={20}
            max={150}
            step={0.5}
            onChange={(v) => onChange({ cardWidth: v, sizePreset: "custom" })}
          />
          <NumberField
            label="Alto (mm)"
            value={config.cardHeight}
            min={20}
            max={200}
            step={0.5}
            onChange={(v) => onChange({ cardHeight: v, sizePreset: "custom" })}
          />
        </div>
      </section>

      <section className="config__group">
        <h3>Diseño</h3>
        <RangeField
          label="Separación entre cartas"
          value={config.gap}
          min={0}
          max={15}
          step={0.5}
          unit="mm"
          onChange={(v) => onChange({ gap: v })}
        />
        <RangeField
          label="Redondeado"
          value={config.radius}
          min={0}
          max={12}
          step={0.2}
          unit="mm"
          onChange={(v) => onChange({ radius: v })}
        />
        <RangeField
          label="Grosor del borde"
          value={config.borderWidth}
          min={0}
          max={4}
          step={0.1}
          unit="mm"
          onChange={(v) => onChange({ borderWidth: v })}
        />
        <RangeField
          label="Margen de página"
          value={config.pagePadding}
          min={0}
          max={20}
          step={1}
          unit="mm"
          onChange={(v) => onChange({ pagePadding: v })}
        />
        <RangeField
          label="Tamaño de texto"
          value={config.fontScale}
          min={0.7}
          max={1.4}
          step={0.05}
          unit="×"
          onChange={(v) => onChange({ fontScale: v })}
        />
      </section>

      <section className="config__group">
        <h3>Opciones</h3>
        <label className="check">
          <input
            type="checkbox"
            checked={config.showIcons}
            onChange={(e) => onChange({ showIcons: e.target.checked })}
          />
          Mostrar iconos
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={config.autoFit}
            onChange={(e) => onChange({ autoFit: e.target.checked })}
          />
          Ajustar texto automáticamente
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={config.fillCorners}
            onChange={(e) => onChange({ fillCorners: e.target.checked })}
          />
          Rellenar esquinas
        </label>
      </section>

      <section className="config__group">
        <h3>Colores</h3>
        <ColorField
          label="Borde"
          value={config.colors.edge}
          onChange={(v) => onChange({ colors: { ...config.colors, edge: v } })}
        />
        <ColorField
          label="Papel"
          value={config.colors.paper}
          onChange={(v) => onChange({ colors: { ...config.colors, paper: v } })}
        />
        <ColorField
          label="Texto"
          value={config.colors.ink}
          onChange={(v) => onChange({ colors: { ...config.colors, ink: v } })}
        />
        <ColorField
          label="Acento"
          value={config.colors.accent}
          onChange={(v) => onChange({ colors: { ...config.colors, accent: v } })}
        />
        <ColorField
          label="Línea interior"
          value={config.colors.line}
          onChange={(v) => onChange({ colors: { ...config.colors, line: v } })}
        />
      </section>

      <section className="config__group">
        <h3>Fondo con el icono</h3>
        <label className="check">
          <input
            type="checkbox"
            checked={config.iconBg}
            onChange={(e) => onChange({ iconBg: e.target.checked })}
          />
          Usar el icono como fondo
        </label>
        {config.iconBg && (
          <>
            <RangeField
              label="Opacidad"
              value={config.iconBgOpacity}
              min={0.02}
              max={0.6}
              step={0.01}
              unit=""
              onChange={(v) => onChange({ iconBgOpacity: v })}
            />
            <RangeField
              label="Desenfoque"
              value={config.iconBgBlur}
              min={0}
              max={8}
              step={0.5}
              unit="px"
              onChange={(v) => onChange({ iconBgBlur: v })}
            />
            <RangeField
              label="Zoom"
              value={config.iconBgZoom}
              min={100}
              max={160}
              step={5}
              unit="%"
              onChange={(v) => onChange({ iconBgZoom: v })}
            />
          </>
        )}
      </section>

      <section className="config__group">
        <h3>Categorías</h3>
        {CATEGORY_ORDER.map((cat) => (
          <label className="check" key={cat}>
            <input
              type="checkbox"
              checked={config.categories[cat]}
              onChange={() => toggleCategory(cat)}
              disabled={counts[cat] === 0}
            />
            {CATEGORY_LABELS[cat]}
            <span className="count">{counts[cat]}</span>
          </label>
        ))}
      </section>
    </aside>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="field">
      <span>
        {label} <em>{value}{unit}</em>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
