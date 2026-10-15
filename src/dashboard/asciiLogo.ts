// ASCII-Logo aus einem Namen (Generator am Feld "ASCII-Logo"): FIGlet-Schriften aus dem Paket figlet, nur die hier
// gelisteten werden geladen. Zeilen ohne Leerzeichen am Ende und gemeinsamen Einzug, leere Rand-Zeilen fallen weg.
import figlet from "figlet";
import ansiShadow from "figlet/fonts/ANSI Shadow";
import big from "figlet/fonts/Big";
import doom from "figlet/fonts/Doom";
import slant from "figlet/fonts/Slant";
import small from "figlet/fonts/Small";
import standard from "figlet/fonts/Standard";

const FONTS = { Standard: standard, Big: big, Slant: slant, Small: small, Doom: doom, "ANSI Shadow": ansiShadow };

export type AsciiFont = keyof typeof FONTS;
export const ASCII_FONTS = Object.keys(FONTS) as AsciiFont[];

export function asciiLogo(name: string, font: AsciiFont) {
  if (!figlet.loadedFonts().includes(font)) figlet.parseFont(font, FONTS[font]);
  const rows = figlet.textSync(name, { font }).split("\n").map(row => row.trimEnd());
  // Gemeinsamen Einzug links entfernen (manche Schriften beginnen mit einer leeren Spalte)
  const indent = Math.min(...rows.filter(Boolean).map(row => row.length - row.trimStart().length));
  return rows.map(row => row.slice(indent)).join("\n").replace(/^\n+|\n+$/g, "");
}
