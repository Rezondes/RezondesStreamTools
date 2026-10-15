// Wer darf rein, und wer bekommt welche Funktion. Gespeichert in data/access.json, im Dashboard
// von Admins änderbar. Admins (ADMINS in server.env) dürfen immer alles.
import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Funktionen, die einzeln für Beta-Tester oder alle freigegeben werden können
export const FEATURES = ["alerts", "chat", "music", "fx", "triggers", "stinger", "banners"] as const;
export type Feature = (typeof FEATURES)[number];
export type Level = "off" | "beta" | "all";

export type Access = {
  registration: "allowlist" | "open";
  allowlist: string[]; // dürfen sich anmelden, solange registration = allowlist
  beta: string[]; // bekommen zusätzlich Funktionen mit Stufe "beta"
  features: Record<Feature, Level>;
};

const norm = (l: string) => l.trim().toLowerCase();
const list = (v: unknown) => (Array.isArray(v) ? [...new Set(v.map(String).map(norm).filter(Boolean))] : []);

// Reine Prüfungen, getestet in access.check.ts
export function canUse(a: Access, admins: string[], login: string) {
  const l = norm(login);
  return admins.includes(l) || a.registration === "open" || a.allowlist.includes(l);
}

export function hasFeature(a: Access, admins: string[], login: string, f: Feature) {
  const l = norm(login);
  const level = a.features[f] ?? "all";
  return level === "all" || (level === "beta" && (admins.includes(l) || a.beta.includes(l)));
}

// Unvollständige oder fremde Eingaben auf gültige Werte bringen
export function sanitize(v: Partial<Access>): Access {
  const features = {} as Record<Feature, Level>;
  for (const f of FEATURES) {
    const level = v.features?.[f];
    features[f] = level === "off" || level === "beta" || level === "all" ? level : "all";
  }
  return { registration: v.registration === "open" ? "open" : "allowlist", allowlist: list(v.allowlist), beta: list(v.beta), features };
}

export async function loadAccess(dataDir: string, admins: string[]) {
  const file = join(dataDir, "access.json");
  let access = sanitize(await readFile(file, "utf8").then(JSON.parse).catch(() => ({ allowlist: admins })));

  return {
    get: () => access,
    canUse: (login: string) => canUse(access, admins, login),
    hasFeature: (login: string, f: Feature) => hasFeature(access, admins, login, f),
    isAdmin: (login: string) => admins.includes(norm(login)),
    // Für ein Profil: welche Funktionen sind an
    features: (login: string) => Object.fromEntries(FEATURES.map(f => [f, hasFeature(access, admins, login, f)])) as Record<Feature, boolean>,
    async save(next: Partial<Access>) {
      access = sanitize(next);
      await writeFile(`${file}.tmp`, JSON.stringify(access, null, 2));
      await rename(`${file}.tmp`, file);
      return access;
    },
  };
}
export type AccessStore = Awaited<ReturnType<typeof loadAccess>>;
