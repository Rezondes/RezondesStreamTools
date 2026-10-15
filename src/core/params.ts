// URL-Parameter einer Overlay-Seite, gelesen beim Laden: aus ?a=1 und aus #/szene?a=1,
// damit beide Schreibweisen in OBS funktionieren. Pro OBS-Quelle überschreiben sie Einstellungen (z.B. ?scale=0.6).
export const params = new URLSearchParams(
  [location.search.slice(1), location.hash.split("?")[1] ?? ""].filter(Boolean).join("&"),
);

// Zahl aus einem Parameter, sonst fallback
export function numberParam(key: string, fallback: number) {
  const value = Number(params.get(key));
  return params.has(key) && Number.isFinite(value) ? value : fallback;
}
