// Einstellungs-Schema des eingebauten Themes "matrix". Package 5 macht hier jeden sichtbaren und hörbaren Wert einstellbar;
// die Standardwerte ergeben den bisherigen Look.
import type { ThemeSchema } from "../../core/theme.ts";

export const matrixSettings: ThemeSchema = {
  id: "matrix",
  name: "Matrix",
  fields: [
    { key: "accent", type: "color", label: "Hauptfarbe", group: "Allgemein", default: "#39ff14" },
    { key: "dim", type: "color", label: "Gedämpfte Farbe", group: "Allgemein", default: "#1e9e0f" },
    { key: "line", type: "color", label: "Linienfarbe", group: "Allgemein", default: "#0e4d07" },
    { key: "background", type: "color", label: "Hintergrund", group: "Allgemein", default: "#000000" },
    { key: "channelName", type: "text", label: "Kanal-Name", group: "Allgemein", default: "REZONDES", maxLength: 40 },
  ],
};
