// URLs of a streamer: their overlays and data are under /s/<login>/... (e.g. /s/rezondes/alerts.html).
// Shared by the server (routing, allowed names) and the overlays (which streamer). Check: streamerPath.check.ts.

// Twitch logins: lower case letters, digits, underscore, at most 25 characters
const LOGIN = /^[a-z0-9_]{1,25}$/;
// Media files: a simple name without path, at most 100 characters before the extension, known extension
const MEDIA_NAME = /^\w[\w .()-]{0,99}\.(gif|png|jpe?g|webp|svg|mp4|webm|mp3|wav|ogg)$/i;

// true if value is a valid Twitch login (already lower case)
export const isLogin = (value: string) => LOGIN.test(value);

// true if value is an allowed name for a media file (no path, known extension)
export const isMediaName = (value: string) => MEDIA_NAME.test(value);

// Path prefix of all URLs of a streamer
export const base = (login: string) => `/s/${login}`;

// Login and the individually decoded path parts after it (["media", "lizard.gif"])
export type StreamerPath = { login: string; segments: string[] };

// Splits /s/<login>/<rest>. null if the path does not look like that, the login is invalid
// or a path part cannot be decoded. Decoding happens only after splitting, so %2F never becomes a separator.
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
    // Broken percent encoding (e.g. "%E0"): the path counts as invalid
    return null;
  }
}
