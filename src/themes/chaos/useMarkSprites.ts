// Hook: draws every take of the boiling scribbles once with its filter into a bitmap (PERF-CHAOS.md proposal 1), so the
// boil only moves bitmaps on a canvas instead of running 340 SVG filters every frame. Each take is drawn alone at its
// place in the viewBox with the filter of its mark: the noise of the filters lies in the coordinates of the mark and
// moves with its drift anyway, so the bitmap looks like the live mark. The styles of the paths come from the page and
// are written onto the copy, a bitmap knows no CSS. Starts once start is true (after the scribbles drew themselves);
// null while drawing and when a filter is missing.
// ponytail: drawn once for the canvas size at that moment; a source resized in OBS later keeps the old sharpness.
import { type RefObject, useEffect, useState } from "react";
import { type Box, filterReach, sliceFit, spriteBox } from "./sprites.ts";

export type Sprite = { image: ImageBitmap; box: Box };

const SVG_NS = "http://www.w3.org/2000/svg";
// The styles of a path that decide its look in the bitmap
const STYLES = ["stroke", "stroke-width", "fill", "stroke-linecap", "stroke-linejoin", "opacity"] as const;

export function useMarkSprites(layer: RefObject<SVGSVGElement | null>, start: boolean, version: unknown): Sprite[][] | null {
  const [sprites, setSprites] = useState<Sprite[][] | null>(null);
  useEffect(() => {
    setSprites(null);
    const svg = layer.current;
    if (!start || !svg) return undefined;
    let alive = true;
    void drawSprites(svg, () => alive).then(drawn => { if (alive) setSprites(drawn); });
    return () => { alive = false; };
  }, [layer, start, version]);
  return sprites;
}

async function drawSprites(svg: SVGSVGElement, alive: () => boolean): Promise<Sprite[][] | null> {
  // Boxes are measured in an SVG of their own: the live one may be hidden (display none measures nothing)
  const measure = document.createElementNS(SVG_NS, "svg");
  measure.setAttribute("style", "position: absolute; width: 0; height: 0; visibility: hidden");
  document.body.append(measure);
  try {
    return await drawAll(svg, measure, alive);
  } finally {
    measure.remove();
  }
}

async function drawAll(svg: SVGSVGElement, measure: SVGSVGElement, alive: () => boolean): Promise<Sprite[][] | null> {
  const view = svg.viewBox.baseVal;
  // The layer fills its parent; a hidden SVG has no size of its own
  const host = svg.parentElement ?? svg;
  const scale = sliceFit(view, { width: host.clientWidth, height: host.clientHeight }).scale * devicePixelRatio;
  const sprites: Sprite[][] = [];
  for (const group of svg.querySelectorAll<SVGGElement>(":scope > g")) {
    const id = /url\(#([^)]+)\)/.exec(group.getAttribute("filter") ?? "")?.[1];
    const filter = id ? svg.querySelector<SVGFilterElement>(`#${CSS.escape(id)}`) : null;
    if (!filter || !alive()) return null;
    const marks: Sprite[] = [];
    for (const take of group.children) {
      // A copy in a group of the measuring SVG: the box of the group holds the transform of the take, so it is the box
      // in the coordinates of the filter; the live takes stay as the boil shows them
      const copy = styledCopy(take as SVGGElement);
      const holder = document.createElementNS(SVG_NS, "g");
      holder.append(copy);
      measure.append(holder);
      const box = spriteBox(holder.getBBox(), filterReach(filter.getAttribute("x")), scale);
      holder.remove();
      marks.push({ image: await rasterize(svgOf(copy, filter, box, scale)), box });
    }
    sprites.push(marks);
  }
  return sprites;
}

// A copy of the take that shows, with the styles of the page written onto its paths
function styledCopy(take: SVGGElement) {
  const copy = take.cloneNode(true) as SVGGElement;
  const live = take.querySelectorAll("path");
  copy.querySelectorAll("path").forEach((path, index) => {
    const style = getComputedStyle(live[index]);
    path.removeAttribute("style");
    STYLES.forEach(name => path.setAttribute(name, style.getPropertyValue(name)));
  });
  copy.setAttribute("display", "inline");
  return copy;
}

// The take alone in its box with the filter of its mark
function svgOf(copy: SVGGElement, filter: SVGFilterElement, box: Box, scale: number) {
  const size = `width="${Math.round(box.width * scale)}" height="${Math.round(box.height * scale)}"`;
  return `<svg xmlns="${SVG_NS}" viewBox="${box.x} ${box.y} ${box.width} ${box.height}" ${size}><defs>${filter.outerHTML}</defs><g filter="url(#${filter.id})">${copy.outerHTML}</g></svg>`;
}

async function rasterize(markup: string) {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  await image.decode();
  return createImageBitmap(image);
}
