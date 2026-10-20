// Mode of the theme settings (einfach: the basic fields, erweitert: all), remembered in the browser like the skin
// (skin.ts). Storage may be missing or blocked, then the mode is "einfach" and is not remembered.
// Check: settingsMode.check.ts.
import type { FormMode } from "./settingsForm.ts";

const STORAGE_KEY = "rezondes-settings-mode";
type Store = Pick<Storage, "getItem" | "setItem">;

const browserStore = (): Store | null => (typeof localStorage === "undefined" ? null : localStorage);

export function readMode(store: Store | null = browserStore()): FormMode {
  try {
    return store?.getItem(STORAGE_KEY) === "erweitert" ? "erweitert" : "einfach";
  } catch {
    // Blocked storage: the simple view
    return "einfach";
  }
}

export function storeMode(mode: FormMode, store: Store | null = browserStore()) {
  try {
    store?.setItem(STORAGE_KEY, mode);
  } catch {
    // Private window or blocked storage: the mode applies to this page only
  }
}
