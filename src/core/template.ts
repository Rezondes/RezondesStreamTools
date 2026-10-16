// Platzhalter {name} in Texten aus den Einstellungen füllen (Alerts, Szenen, Effekte). Unbekannte bleiben stehen,
// eingesetzte Werte werden nicht noch einmal ersetzt. Dazu Textbalken aus Zeichen der Einstellungen.
// Reine Funktionen, getestet in template.check.ts.
export function fillTemplate(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

// Balken aus width Zeichen: Anteil part (0..1) mit full, der Rest mit empty
export function textBar(part: number, width: number, full: string, empty: string) {
  const filled = Math.round(Math.min(1, Math.max(0, part)) * width);
  return full.repeat(filled) + empty.repeat(width - filled);
}

// Platzhalter {channel} (Kanal-Name aus den Einstellungen) und {login} (Twitch-Login des Streamers; ohne Streamer der
// Kanal-Name klein), gleich in jedem Theme
export const channelNames = (channelName: string, login: string | null) => ({ channel: channelName, login: login ?? channelName.toLowerCase() });
