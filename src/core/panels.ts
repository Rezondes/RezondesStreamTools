// Twitch panels of the panel designer: a panel is a stack of layers (rectangles with an optional gradient, texts,
// pictures) on a background, 320 px wide and 60 to 600 px high. Every theme brings a template (ThemeModule.panel) that
// builds the layers of a new panel in its look; after that the streamer changes everything. The dashboard draws the
// panels with drawPanel and saves them as PNG or JPG (at most 1 MB, what Twitch takes). Pure; check: panels.check.ts.

// fixed: what Twitch takes for a panel: the width it shows, the height range, the largest file
export const PANEL_WIDTH = 320;
export const PANEL_HEIGHT = { min: 60, max: 600 };
export const PANEL_MAX_BYTES = 1024 * 1024;
export const PANEL_FORMATS = ["png", "jpg"] as const;
export type PanelFormat = (typeof PANEL_FORMATS)[number];

// hidden: not drawn (also not in the saved picture); locked: cannot be picked or dragged on the stage
type Placed = { id: string; x: number; y: number; opacity: number; rotate: number; hidden?: boolean; locked?: boolean };
// fill2: the color at the bottom of a vertical gradient, null for one color
export type RectLayer = Placed & { kind: "rect"; w: number; h: number; fill: string; fill2: string | null; radius: number; stroke: string; strokeWidth: number };
// One line per "\n"; x/w is the box the text is aligned in, y its top; glow: blur radius in px
export type TextLayer = Placed & {
  kind: "text"; w: number; text: string; font: string; size: number; weight: number; color: string; align: CanvasTextAlign; stroke: string; strokeWidth: number;
  glow: number; glowColor: string;
};
// src: the picture as a data URL (chosen in the browser, kept in the panel)
export type ImageLayer = Placed & { kind: "image"; w: number; h: number; src: string };
export type PanelLayer = RectLayer | TextLayer | ImageLayer;
export type Panel = { id: string; name: string; height: number; background: string; layers: PanelLayer[] };
// What a theme template gives for a title: everything of a panel but its id and name
export type PanelDesign = Omit<Panel, "id" | "name">;

// fixed: line height of texts over their size, the height of a new panel
const LINE = 1.2;
export const PANEL_START_HEIGHT = 100;

// Layers with the plain defaults, for the theme templates and the designer
export const rectLayer = (id: string, x: number, y: number, width: number, height: number, fill: string, more: Partial<RectLayer> = {}): RectLayer => ({
  id, kind: "rect", x, y, w: width, h: height, fill, fill2: null, radius: 0, stroke: "#000000", strokeWidth: 0, opacity: 1, rotate: 0, ...more,
});
export const textLayer = (id: string, x: number, y: number, width: number, text: string, font: string, size: number, color: string, more: Partial<TextLayer> = {}): TextLayer => ({
  id, kind: "text", x, y, w: width, text, font, size, weight: 700, color, align: "center", stroke: "#000000", strokeWidth: 0, glow: 0, glowColor: "#000000", opacity: 1, rotate: 0, ...more,
});
// The top of a one-line text of this size centered in a panel of this height
export const centeredTop = (size: number, height = PANEL_START_HEIGHT) => Math.round((height - size * LINE) / 2);
const DEGREE = Math.PI / 180;

// The box a layer takes (texts: their lines); the designer selects and moves layers by it
export function layerBox(layer: PanelLayer): { x: number; y: number; w: number; h: number } {
  const height = layer.kind === "text" ? layer.text.split("\n").length * layer.size * LINE : layer.h;
  return { x: layer.x, y: layer.y, w: layer.w, h: height };
}

// The topmost visible, unlocked layer at a point of the panel (rotation ignored), or -1
export function layerAt(panel: Panel, x: number, y: number): number {
  for (let index = panel.layers.length - 1; index >= 0; index--) {
    if (panel.layers[index].hidden || panel.layers[index].locked) continue;
    const box = layerBox(panel.layers[index]);
    if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) return index;
  }
  return -1;
}

// Draws the panel into a context of PANEL_WIDTH x panel.height; images holds the loaded pictures by src
export function drawPanel(context: CanvasRenderingContext2D, panel: Panel, images: ReadonlyMap<string, CanvasImageSource>) {
  context.save();
  context.fillStyle = panel.background;
  context.fillRect(0, 0, PANEL_WIDTH, panel.height);
  for (const layer of panel.layers) {
    if (layer.hidden) continue;
    const box = layerBox(layer);
    context.save();
    context.globalAlpha = layer.opacity;
    context.translate(box.x + box.w / 2, box.y + box.h / 2);
    context.rotate(layer.rotate * DEGREE);
    context.translate(-box.w / 2, -box.h / 2);
    if (layer.kind === "rect") drawRect(context, layer);
    else if (layer.kind === "text") drawText(context, layer);
    else {
      const image = images.get(layer.src);
      if (image) context.drawImage(image, 0, 0, layer.w, layer.h);
    }
    context.restore();
  }
  context.restore();
}

function drawRect(context: CanvasRenderingContext2D, layer: RectLayer) {
  context.beginPath();
  context.roundRect(0, 0, layer.w, layer.h, Math.min(layer.radius, layer.w / 2, layer.h / 2));
  if (layer.fill2) {
    const gradient = context.createLinearGradient(0, 0, 0, layer.h);
    gradient.addColorStop(0, layer.fill);
    gradient.addColorStop(1, layer.fill2);
    context.fillStyle = gradient;
  } else context.fillStyle = layer.fill;
  context.fill();
  if (layer.strokeWidth > 0) {
    context.lineWidth = layer.strokeWidth;
    context.strokeStyle = layer.stroke;
    context.stroke();
  }
}

function drawText(context: CanvasRenderingContext2D, layer: TextLayer) {
  context.font = `${layer.weight} ${layer.size}px "${layer.font}", sans-serif`;
  context.textAlign = layer.align;
  context.textBaseline = "top";
  context.lineJoin = "round";
  const x = layer.align === "left" ? 0 : layer.align === "right" ? layer.w : layer.w / 2;
  layer.text.split("\n").forEach((line, index) => {
    const y = index * layer.size * LINE;
    if (layer.strokeWidth > 0) {
      context.lineWidth = layer.strokeWidth;
      context.strokeStyle = layer.stroke;
      context.strokeText(line, x, y);
    }
    context.shadowBlur = layer.glow;
    context.shadowColor = layer.glowColor;
    context.fillStyle = layer.color;
    context.fillText(line, x, y);
    context.shadowBlur = 0;
  });
}

// fixed: German letters spelled out for the file name, the longest part of the title in it
const SPELLED: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
const NAME_MAX = 40;

// File name of a panel: panel-<number>-<name>.<format>, the name in lower case letters, digits and dashes
export function panelFileName(name: string, index: number, format: PanelFormat): string {
  const slug = name.toLowerCase().replace(/[äöüß]/g, letter => SPELLED[letter]).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, NAME_MAX).replace(/-+$/, "");
  return `panel-${index + 1}${slug ? `-${slug}` : ""}.${format}`;
}
