// Zeichensatz für Matrix-Regen, Entschlüsseln und Glitches, und ein zufälliges Zeichen daraus.
export const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789{}<>=;#ABCDEF";

// chars: eigener Zeichensatz aus den Einstellungen; Array.from, damit auch Zeichen ausserhalb der BMP ganz bleiben
export function glyph(chars = GLYPHS) {
  const list = Array.from(chars);
  return list[(Math.random() * list.length) | 0] ?? "";
}
