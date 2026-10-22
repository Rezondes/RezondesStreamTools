// Fields of the panel designer (Panels.tsx): the panel itself, the layer list and the inspector of the selected layer,
// plus the small controls they share (label above, like the settings of the dashboard).
import { type ReactNode, useId } from "react";
import { PANEL_HEIGHT, PANEL_WIDTH, type Panel, type PanelLayer } from "../core/panels.ts";
import { clampHeight, PANEL_FONT_GROUPS } from "./panelEditor.ts";
import { TEXTS } from "./texts.de.ts";

const TEXT = TEXTS.panels;

export const layerName = (layer: PanelLayer) => (layer.kind === "text" ? `${TEXT.kinds.text}: ${layer.text.split("\n")[0].slice(0, 24)}` : TEXT.kinds[layer.kind]);

export function PanelFields({ panel, update, onTemplate }: { panel: Panel; update: (panel: Panel) => void; onTemplate: () => void }) {
  return (
    <fieldset className="settings-group">
      <legend>{TEXT.panel}</legend>
      <Field label={TEXT.name}>{id => <input id={id} value={panel.name} maxLength={60} autoComplete="off" onChange={event => update({ ...panel, name: event.target.value })} />}</Field>
      <NumberField label={TEXT.height} value={panel.height} min={PANEL_HEIGHT.min} max={PANEL_HEIGHT.max} onChange={height => update({ ...panel, height: clampHeight(height) })} />
      <ColorField label={TEXT.background} value={panel.background} onChange={background => update({ ...panel, background })} />
      <button type="button" className="btn" onClick={onTemplate}>{TEXT.template}</button>
    </fieldset>
  );
}

// The layers, the front one on top; the order changes with the arrows
export function LayerList({ panel, selected, onSelect, onToggle, onReorder }: {
  panel: Panel; selected: readonly number[]; onSelect: (index: number, extend: boolean) => void; onToggle: (index: number, flag: "hidden" | "locked") => void;
  onReorder: (index: number, step: 1 | -1) => void;
}) {
  return (
    <fieldset className="settings-group">
      <legend>{TEXT.layers}</legend>
      {panel.layers.length === 0 && <p className="muted">{TEXT.noLayers}</p>}
      <ol className="panel-layers">
        {panel.layers.map((layer, index) => ({ layer, index })).reverse().map(({ layer, index }) => (
          <li key={layer.id} className={layer.hidden ? "off" : undefined}>
            <button type="button" className={`btn${selected.includes(index) ? " primary" : ""}`} aria-pressed={selected.includes(index)} onClick={event => onSelect(index, event.shiftKey)}>{layerName(layer)}</button>
            <button type="button" className="btn" aria-pressed={!layer.hidden} aria-label={TEXT.visible} title={TEXT.visible} onClick={() => onToggle(index, "hidden")}>{layer.hidden ? "○" : "◉"}</button>
            <button type="button" className="btn" aria-pressed={layer.locked === true} aria-label={TEXT.locked} title={TEXT.locked} onClick={() => onToggle(index, "locked")}>{layer.locked ? "🔒" : "🔓"}</button>
            <button type="button" className="btn" aria-label={TEXT.up} title={TEXT.up} disabled={index === panel.layers.length - 1} onClick={() => onReorder(index, 1)}>▲</button>
            <button type="button" className="btn" aria-label={TEXT.down} title={TEXT.down} disabled={index === 0} onClick={() => onReorder(index, -1)}>▼</button>
          </li>
        ))}
      </ol>
    </fieldset>
  );
}

// The fields of the selected layer: what it shows first (at most six), outline and glow and the placement folded away
export function Inspector({ layer, change }: { layer: PanelLayer; change: (change: Partial<PanelLayer>) => void }) {
  return (
    <fieldset className="settings-group">
      <legend>{layerName(layer)}</legend>
      {layer.kind === "text" && <TextFields layer={layer} change={change} />}
      {layer.kind === "rect" && <RectFields layer={layer} change={change} />}
      <details>
        <summary>{TEXT.placement}</summary>
        <NumberField label={TEXT.x} value={layer.x} min={-PANEL_WIDTH} max={PANEL_WIDTH * 2} onChange={x => change({ x })} />
        <NumberField label={TEXT.y} value={layer.y} min={-PANEL_HEIGHT.max} max={PANEL_HEIGHT.max * 2} onChange={y => change({ y })} />
        <NumberField label={TEXT.width} value={layer.w} min={1} max={PANEL_WIDTH * 2} onChange={width => change({ w: width })} />
        {layer.kind !== "text" && <NumberField label={TEXT.layerHeight} value={layer.h} min={1} max={PANEL_HEIGHT.max * 2} onChange={height => change({ h: height })} />}
        <NumberField label={TEXT.rotate} value={layer.rotate} min={-180} max={180} onChange={rotate => change({ rotate })} />
        <NumberField label={TEXT.opacity} value={layer.opacity} min={0} max={1} step={0.05} onChange={opacity => change({ opacity })} />
      </details>
    </fieldset>
  );
}

function TextFields({ layer, change }: { layer: Extract<PanelLayer, { kind: "text" }>; change: (change: Partial<PanelLayer>) => void }) {
  return (
    <>
      <Field label={TEXT.text}>{id => <textarea id={id} value={layer.text} rows={2} maxLength={200} onChange={event => change({ text: event.target.value })} />}</Field>
      <Field label={TEXT.font}>{id => (
        <select id={id} value={layer.font} onChange={event => change({ font: event.target.value })}>
          {!PANEL_FONT_GROUPS.some(group => (group.fonts as readonly string[]).includes(layer.font)) && <option value={layer.font}>{layer.font}</option>}
          {PANEL_FONT_GROUPS.map(group => <optgroup key={group.kind} label={TEXT.fontGroups[group.kind]}>{group.fonts.map(name => <option key={name} value={name}>{name}</option>)}</optgroup>)}
        </select>
      )}</Field>
      <NumberField label={TEXT.size} value={layer.size} min={6} max={200} onChange={size => change({ size })} />
      <Segmented label={TEXT.weight} value={layer.weight} options={[400, 600, 700, 800].map(weight => ({ value: weight, label: TEXT.weights[weight] }))} onChange={weight => change({ weight })} />
      <ColorField label={TEXT.color} value={layer.color} onChange={color => change({ color })} />
      <Segmented label={TEXT.align} value={layer.align} options={(["left", "center", "right"] as const).map(align => ({ value: align, label: TEXT.aligns[align] }))} onChange={align => change({ align })} />
      <details>
        <summary>{TEXT.outlineAndGlow}</summary>
        <ColorField label={TEXT.stroke} value={layer.stroke} onChange={stroke => change({ stroke })} />
        <NumberField label={TEXT.strokeWidth} value={layer.strokeWidth} min={0} max={20} onChange={strokeWidth => change({ strokeWidth })} />
        <ColorField label={TEXT.glowColor} value={layer.glowColor} onChange={glowColor => change({ glowColor })} />
        <NumberField label={TEXT.glow} value={layer.glow} min={0} max={40} onChange={glow => change({ glow })} />
      </details>
    </>
  );
}

function RectFields({ layer, change }: { layer: Extract<PanelLayer, { kind: "rect" }>; change: (change: Partial<PanelLayer>) => void }) {
  return (
    <>
      <label className="setting-row"><input type="checkbox" checked={layer.fill !== "transparent"} onChange={event => change({ fill: event.target.checked ? "#ffffff" : "transparent" })} /> {TEXT.filled}</label>
      {layer.fill !== "transparent" && <ColorField label={TEXT.fill} value={layer.fill} onChange={fill => change({ fill })} />}
      <label className="setting-row"><input type="checkbox" checked={layer.fill2 !== null} onChange={event => change({ fill2: event.target.checked ? layer.fill : null })} /> {TEXT.gradient}</label>
      {layer.fill2 !== null && <ColorField label={TEXT.fill2} value={layer.fill2} onChange={fill2 => change({ fill2 })} />}
      <NumberField label={TEXT.radius} value={layer.radius} min={0} max={300} onChange={radius => change({ radius })} />
      <details>
        <summary>{TEXT.outline}</summary>
        <ColorField label={TEXT.stroke} value={layer.stroke} onChange={stroke => change({ stroke })} />
        <NumberField label={TEXT.strokeWidth} value={layer.strokeWidth} min={0} max={20} onChange={strokeWidth => change({ strokeWidth })} />
      </details>
    </>
  );
}

// A field like the settings of the dashboard: the label above, tied to the control by its id
function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return <div className="setting"><label htmlFor={id}>{label}</label>{children(id)}</div>;
}

function NumberField({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return (
    <Field label={`${label} (${TEXTS.theme.range(min, max)})`}>
      {id => <input id={id} type="number" inputMode="decimal" value={value} min={min} max={max} step={step} onChange={event => { const next = Number(event.target.value); if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next))); }} />}
    </Field>
  );
}

// Color inputs only take #rrggbb; anything else (e.g. transparent) shows black until a color is picked
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Field label={label}>{id => <input id={id} type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={event => onChange(event.target.value)} />}</Field>;
}

// Two to four choices as buttons side by side, the chosen one pressed
export function Segmented<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div className="setting">
      <span>{label}</span>
      <div className="actions" role="group" aria-label={label}>
        {options.map(option => (
          <button key={option.value} type="button" className={`btn${option.value === value ? " primary" : ""}`} aria-pressed={option.value === value} onClick={() => onChange(option.value)}>{option.label}</button>
        ))}
      </div>
    </div>
  );
}
