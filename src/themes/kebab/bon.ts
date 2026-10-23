// Lines of a bon (DESIGN-KEBAB.md "Bon"): a setting line "Posten|Zusatz" becomes an item with its note on the right;
// placeholders are filled. Empty lines are left out. Check: bon.check.ts.
import { fillTemplate } from "../../core/template.ts";

export type BonItem = { label: string; note: string };

export function bonItems(lines: readonly string[], names: Record<string, string | number> = {}): BonItem[] {
  return lines
    .map(line => line.split("|"))
    .filter(([label]) => label.trim() !== "")
    .map(([label, ...note]) => ({ label: fillTemplate(label.trim(), names), note: fillTemplate(note.join("|").trim(), names) }));
}
