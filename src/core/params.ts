// URL parameters of an overlay page, read on load: from ?a=1 and from #/scene?a=1,
// so both notations work in OBS. Per OBS source they add to the settings (e.g. ?min=5, ?zone=main, ?demo).
export const params = new URLSearchParams(
  [location.search.slice(1), location.hash.split("?")[1] ?? ""].filter(Boolean).join("&"),
);

// Number from a parameter, otherwise fallback
export function numberParam(key: string, fallback: number) {
  const value = Number(params.get(key));
  return params.has(key) && Number.isFinite(value) ? value : fallback;
}
