// Hook: draws every take of the boiling scribbles once with its filter into a bitmap (PERF-CHAOS.md proposal 1), so the
// boil only moves bitmaps on a canvas instead of running 340 SVG filters every frame. Each take is drawn alone with the
// filter of its mark into its cell of an atlas, in the coordinates of its place in the viewBox: the noise of the filters
// lies in the coordinates of the mark and moves with its drift, so the bitmap looks like the live mark. The styles of the paths come from the page and
// are written onto the copy, a bitmap knows no CSS. Starts once start is true, also while the scribbles draw themselves (the dash is not copied);
// null while drawing and when a filter is missing. The bitmaps fit the size of the layer at that moment: a new size
// draws them again and keeps the old ones until the new ones are ready, a new version (other marks) drops them at once.
import { type RefObject, useEffect, useRef, useState } from "react";
import { type Box, type Cell, filterReach, packAtlases, sliceFit, spriteBox } from "./sprites.ts";

// The bitmap of a take: its cell in an atlas, drawn into its box in the viewBox
export type Sprite = { image: ImageBitmap; box: Box; cell: Cell };
type Take = { copy: SVGGElement; filter: SVGFilterElement; box: Box };

const SVG_NS = "http://www.w3.org/2000/svg";
// fixed: the side of an atlas and the gap between its cells (px), how many marks are copied and measured per frame
const ATLAS = { side: 1024, gap: 2, marksPerFrame: 8 };
// The styles of a path that decide its look in the bitmap
const STYLES = ["stroke", "stroke-width", "fill", "stroke-linecap", "stroke-linejoin", "opacity"] as const;

export function useMarkSprites(layer: RefObject<SVGSVGElement | null>, start: boolean, version: unknown, size: unknown): Sprite[][] | null {
  const [sprites, setSprites] = useState<Sprite[][] | null>(null);
  // The version the shown bitmaps were drawn for
  const drawnFor = useRef<unknown>(null);
  useEffect(() => {
    const svg = layer.current;
    if (!start || !svg || drawnFor.current !== version) setSprites(null);
    if (!start || !svg) return undefined;
    let alive = true;
    void drawSprites(svg, () => alive).then(drawn => {
      if (!alive) return;
      drawnFor.current = version;
      setSprites(drawn);
    });
    return () => { alive = false; };
  }, [layer, start, version, size]);
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
  const takes: Take[][] = [];
  // The marks sit in one group per filter (line type); the bitmaps follow the order of the marks
  const groups = [...svg.querySelectorAll<SVGGElement>("[data-mark]")].sort((one, other) => Number(one.dataset.mark) - Number(other.dataset.mark));
  for (const [index, group] of groups.entries()) {
    // Copying and measuring all marks in one go held up a frame noticeably; a few marks per frame keep the screen moving
    if (index > 0 && index % ATLAS.marksPerFrame === 0) await new Promise(requestAnimationFrame);
    const id = /url\(#([^)]+)\)/.exec(group.parentElement?.getAttribute("filter") ?? "")?.[1];
    const filter = id ? svg.querySelector<SVGFilterElement>(`#${CSS.escape(id)}`) : null;
    if (!filter || !alive()) return null;
    takes.push([...group.children].map(take => {
      // A copy in a group of the measuring SVG: the box of the group holds the transform of the take, so it is the box
      // in the coordinates of the filter; the live takes stay as the boil shows them
      const copy = styledCopy(take as SVGGElement);
      const holder = document.createElementNS(SVG_NS, "g");
      holder.append(copy);
      measure.append(holder);
      const box = spriteBox(holder.getBBox(), filterReach(filter.getAttribute("x")), scale);
      holder.remove();
      return { copy, filter, box };
    }));
  }
  // A few atlases instead of one image per take: every SVG image is a document of its own, 1000 of them kept the main
  // thread busy for seconds (one after the other over a minute, at once a stall of several seconds)
  const flat = takes.flat();
  const { cells, atlases } = packAtlases(flat.map(({ box }) => ({ width: Math.round(box.width * scale), height: Math.round(box.height * scale) })), ATLAS.side, ATLAS.gap);
  const images: ImageBitmap[] = [];
  for (const [atlas, size] of atlases.entries()) {
    images.push(await rasterize(atlasOf(size, flat.flatMap((take, index) => (cells[index].atlas === atlas ? [{ take, cell: cells[index] }] : [])))));
    await new Promise(requestAnimationFrame);
  }
  let next = 0;
  return takes.map(marks => marks.map(({ box }) => {
    const cell = cells[next++];
    return { image: images[cell.atlas], box, cell };
  }));
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

// An atlas: each take in its cell, a nested SVG whose viewBox is the box of the take, so the filter of its mark runs in
// the coordinates of the take as on the live layer
function atlasOf(size: { width: number; height: number }, placed: { take: Take; cell: Cell }[]) {
  const filters = new Map(placed.map(({ take }) => [take.filter.id, take.filter.outerHTML]));
  const cells = placed.map(({ take: { copy, filter, box }, cell }) =>
    `<svg x="${cell.x}" y="${cell.y}" width="${cell.width}" height="${cell.height}" viewBox="${box.x} ${box.y} ${box.width} ${box.height}"><g filter="url(#${filter.id})">${copy.outerHTML}</g></svg>`);
  return `<svg xmlns="${SVG_NS}" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}"><defs>${[...filters.values()].join("")}</defs>${cells.join("")}</svg>`;
}

async function rasterize(markup: string) {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  await image.decode();
  return createImageBitmap(image);
}
