// Skin of the dashboard: it looks like the active theme (standard modern and plain, matrix terminal, urlaub
// beach, plantage mango field, koth military, bears cartoon bears in a watercolor world). The skin is data-skin on <html>, its colors and shapes are in
// skins.css. The last skin is remembered in the browser so the wrong one does not flash briefly on load. skinOf is
// pure, check: skin.check.ts.
import { DEFAULT_THEME } from "../themes/registry.ts";

const SKINS = ["standard", "matrix", "urlaub", "plantage", "koth", "bears"] as const;
export type Skin = (typeof SKINS)[number];

const STORAGE_KEY = "rezondes-skin";

// Skin for a theme; themes without their own skin get the one of the standard theme
export const skinOf = (theme: string | null): Skin => SKINS.find(skin => skin === theme) ?? (DEFAULT_THEME as Skin);

// Set and remember the skin (storage may be missing or blocked, then only set)
export function applySkin(theme: string | null) {
  const skin = skinOf(theme);
  document.documentElement.dataset.skin = skin;
  try {
    localStorage.setItem(STORAGE_KEY, skin);
  } catch {
    // Private window or blocked storage: the skin applies to this page anyway
  }
}

// On start: the last remembered skin, otherwise the one of the standard theme
export function rememberedSkin(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // No storage: standard
    return null;
  }
}
