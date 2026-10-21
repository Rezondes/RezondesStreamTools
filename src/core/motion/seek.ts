// Time from the address for still images of the preview (plans/PLAN-GRAFIK.md, package 2): ?t=4.2 stops a timeline at
// 4.2 seconds. Anything that is not a finite number of zero or more gives null.
export function seekFromQuery(search: string): number | null {
  const raw = new URLSearchParams(search).get("t");
  if (raw === null || raw.trim() === "") return null;
  const time = Number(raw);
  return Number.isFinite(time) && time >= 0 ? time : null;
}
