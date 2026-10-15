// Adressen eines Streamers: seine Overlays und ihre Daten liegen unter /s/<login>/... (z.B. /s/rezondes/alerts.html).
// Gemeinsam für den Server (Routing, erlaubte Namen) und die Overlays (welcher Streamer). Check: streamerPath.check.ts.

// Twitch-Logins: Kleinbuchstaben, Ziffern, Unterstrich, höchstens 25 Zeichen
const LOGIN = /^[a-z0-9_]{1,25}$/;
// Mediendateien: einfacher Name ohne Pfad, höchstens 100 Zeichen vor der Endung, bekannte Endung
const MEDIA_NAME = /^\w[\w .()-]{0,99}\.(gif|png|jpe?g|webp|svg|mp4|webm|mp3|wav|ogg)$/i;

// true, wenn value ein gültiger Twitch-Login ist (schon kleingeschrieben)
export const isLogin = (value: string) => LOGIN.test(value);

// true, wenn value ein erlaubter Name für eine Mediendatei ist (kein Pfad, bekannte Endung)
export const isMediaName = (value: string) => MEDIA_NAME.test(value);

// Pfad-Anfang aller Adressen eines Streamers
export const base = (login: string) => `/s/${login}`;

// Login und die einzeln dekodierten Pfadteile danach (["media", "lizard.gif"])
export type StreamerPath = { login: string; segments: string[] };

// Zerlegt /s/<login>/<rest>. null, wenn der Pfad nicht so aussieht, der Login ungültig ist
// oder ein Pfadteil nicht dekodierbar ist. Dekodiert wird erst nach dem Zerlegen, so wird %2F nie zum Trenner.
export function parse(pathname: string): StreamerPath | null {
  const [empty, prefix, login, ...rest] = pathname.split("/");
  if (empty !== "" || prefix !== "s" || login === undefined) return null;
  const lower = login.toLowerCase();
  const segments = decodeAll(rest);
  if (!isLogin(lower) || !segments) return null;
  return { login: lower, segments };
}

function decodeAll(segments: string[]): string[] | null {
  try {
    return segments.map(segment => decodeURIComponent(segment));
  } catch {
    // Kaputte Prozent-Kodierung (z.B. "%E0"): Pfad gilt als ungültig
    return null;
  }
}
