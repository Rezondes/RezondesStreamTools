// The self-hosted glyph font of the Matrix theme: a subset of Noto Sans JP (fonts/matrix-katakana.woff2, SIL OFL, see
// fonts/OFL.txt) with katakana, half-width katakana and digits, declared in theme.css. It stands right behind the font
// of the settings, so the rain shows the same katakana on every machine instead of a system fallback. Canvas text
// (glyph atlas, stinger, banners) needs it loaded first: loadGlyphFont adds it to the page itself, so it also works where
// theme.css is not loaded (clips rendered from the dashboard). Check: glyphFont.check.ts.

export const GLYPH_FONT = "Matrix Katakana";
const FILE = new URL("./fonts/matrix-katakana.woff2", import.meta.url);
const RANGE = "U+0030-0039, U+30A0-30FF, U+FF65-FF9F"; // fixed: digits, katakana, half-width katakana
let loading: Promise<void> | null = null;

// The font stack for canvas text: the font of the settings, then the glyph font, then any monospace
export const fontStack = (font: string) => `"${font}", "${GLYPH_FONT}", monospace`;

// Loads the glyph font once and adds it to the page; resolves also without a browser or when loading fails (system
// fallback)
export function loadGlyphFont(): Promise<void> {
  if (typeof document === "undefined" || typeof FontFace === "undefined") return Promise.resolve();
  loading ??= new FontFace(GLYPH_FONT, `url(${FILE.href})`, { unicodeRange: RANGE }).load()
    .then(face => { document.fonts.add(face); }, () => undefined);
  return loading;
}
