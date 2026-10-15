// Zeichensatz für Matrix-Regen, Entschlüsseln und Glitches, und ein zufälliges Zeichen daraus.
export const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789{}<>=;#ABCDEF";

export const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
