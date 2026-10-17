// Character set for matrix rain, decoding and glitches, and a random character from it.
export const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789{}<>=;#ABCDEF";

// chars: own character set from the settings; Array.from so characters outside the BMP stay whole
export function glyph(chars = GLYPHS) {
  const list = Array.from(chars);
  return list[(Math.random() * list.length) | 0] ?? "";
}
