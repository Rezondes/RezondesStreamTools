// Was beim Speichern des Zugangs wegfällt (Admin-Bereich): Logins aus Allowlist oder Beta-Liste gestrichen,
// Anmeldung wieder auf Allowlist beschränkt, Funktionen auf "aus" gestellt. Leer = nichts geht verloren.
import type { Access, Feature } from "../../server/access.ts";

export type AccessLosses = { revoked: string[]; betaRemoved: string[]; closed: boolean; off: Feature[] };

const removed = (before: string[], after: string[]) => {
  const kept = new Set(after.map(login => login.trim().toLowerCase()));
  return before.filter(login => !kept.has(login.trim().toLowerCase()));
};

export function accessLosses(saved: Access, next: Access): AccessLosses {
  return {
    // Bei offener Anmeldung verliert niemand den Zugang, nur weil er aus der Allowlist fällt
    revoked: next.registration === "allowlist" ? removed(saved.allowlist, next.allowlist) : [],
    betaRemoved: removed(saved.beta, next.beta),
    closed: saved.registration === "open" && next.registration === "allowlist",
    off: (Object.keys(next.features) as Feature[]).filter(feature => next.features[feature] === "off" && saved.features[feature] !== "off"),
  };
}

export const hasLosses = (losses: AccessLosses) =>
  losses.revoked.length > 0 || losses.betaRemoved.length > 0 || losses.closed || losses.off.length > 0;
