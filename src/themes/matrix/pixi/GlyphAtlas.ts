// Glyph atlas of the Matrix theme in PixiJS (PLAN-MATRIX.md package 1): every glyph of the set drawn once in white on
// one canvas texture (every third mirrored, like the film), one texture frame per glyph, so the rain tints sprites
// instead of drawing text every frame.
import { Rectangle, Texture } from "pixi.js";

// fixed: the cell of a glyph in the atlas (px), glyphs per atlas row, the type size in the cell
const CELL = 48;
const PER_ROW = 16;
const TYPE = 40;

export function glyphAtlas(glyphs: string, font: string): Texture[] {
  const list = Array.from(glyphs);
  const canvas = document.createElement("canvas");
  [canvas.width, canvas.height] = [CELL * PER_ROW, CELL * Math.max(1, Math.ceil(list.length / PER_ROW))];
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#ffffff"; // fixed: white, tinted per sprite
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `${TYPE}px "${font}", monospace`;
    list.forEach((glyph, index) => {
      context.save();
      context.translate((index % PER_ROW) * CELL + CELL / 2, Math.floor(index / PER_ROW) * CELL + CELL / 2);
      if (index % 3 === 0) context.scale(-1, 1);
      context.fillText(glyph, 0, 0);
      context.restore();
    });
  }
  const source = Texture.from(canvas).source;
  return list.map((_, index) => new Texture({ source, frame: new Rectangle((index % PER_ROW) * CELL, Math.floor(index / PER_ROW) * CELL, CELL, CELL) }));
}
