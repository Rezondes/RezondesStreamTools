// What drops out when saving access (admin section): logins removed from the allowlist or beta list,
// registration limited to the allowlist again, features set to "off". Empty = nothing is lost.
import type { Access, Feature } from "../../server/access.ts";

type AccessLosses = { revoked: string[]; betaRemoved: string[]; closed: boolean; off: Feature[] };

const removed = (before: string[], after: string[]) => {
  const kept = new Set(after.map(login => login.trim().toLowerCase()));
  return before.filter(login => !kept.has(login.trim().toLowerCase()));
};

export function accessLosses(saved: Access, next: Access): AccessLosses {
  return {
    // With open registration nobody loses access just because they drop out of the allowlist
    revoked: next.registration === "allowlist" ? removed(saved.allowlist, next.allowlist) : [],
    betaRemoved: removed(saved.beta, next.beta),
    closed: saved.registration === "open" && next.registration === "allowlist",
    off: (Object.keys(next.features) as Feature[]).filter(feature => next.features[feature] === "off" && saved.features[feature] !== "off"),
  };
}

export const hasLosses = (losses: AccessLosses) =>
  losses.revoked.length > 0 || losses.betaRemoved.length > 0 || losses.closed || losses.off.length > 0;
