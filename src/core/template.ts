// Fills placeholders {name} in texts from the settings (alerts, scenes, effects). Unknown ones stay,
// inserted values are not replaced again. Plus text bars from characters of the settings.
// Reine Funktionen, getestet in template.check.ts.
export function fillTemplate(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

// Bar of width characters: fraction part (0..1) with full, the rest with empty
export function textBar(part: number, width: number, full: string, empty: string) {
  const filled = Math.round(Math.min(1, Math.max(0, part)) * width);
  return full.repeat(filled) + empty.repeat(width - filled);
}

// Placeholders {channel} (channel name from the settings) and {login} (Twitch login of the streamer; without a streamer the
// channel name in lower case), the same in every theme
export const channelNames = (channelName: string, login: string | null) => ({ channel: channelName, login: login ?? channelName.toLowerCase() });
