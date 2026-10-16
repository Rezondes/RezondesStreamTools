// Skin des Dashboards: es sieht aus wie das aktive Theme (standard modern und schlicht, matrix Terminal, suedfrucht
// Strand). Der Skin steht als data-skin am <html>, die Farben und Formen dazu in skins.css. Der letzte Skin bleibt im
// Browser gemerkt, damit beim Laden nicht kurz der falsche aufblitzt. skinOf ist rein, Check: skin.check.ts.
import { DEFAULT_THEME } from "../themes/registry.ts";

const SKINS = ["standard", "matrix", "suedfrucht"] as const;
export type Skin = (typeof SKINS)[number];

const STORAGE_KEY = "rezondes-skin";

// Skin zu einem Theme; Themes ohne eigenen Skin bekommen den des Standard-Themes
export const skinOf = (theme: string | null): Skin => SKINS.find(skin => skin === theme) ?? (DEFAULT_THEME as Skin);

// Skin setzen und merken (Speicher kann fehlen oder gesperrt sein, dann nur setzen)
export function applySkin(theme: string | null) {
  const skin = skinOf(theme);
  document.documentElement.dataset.skin = skin;
  try {
    localStorage.setItem(STORAGE_KEY, skin);
  } catch {
    // Privates Fenster oder gesperrter Speicher: der Skin gilt trotzdem für diese Seite
  }
}

// Beim Start: der zuletzt gemerkte Skin, sonst der des Standard-Themes
export function rememberedSkin(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Kein Speicher: Standard
    return null;
  }
}
