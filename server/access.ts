// Wer darf rein, und wer bekommt welche Funktion. Gespeichert in data/access.json, im Dashboard
// von Admins änderbar. Admins (ADMINS in server.env) dürfen immer alles.
import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Funktionen, die einzeln für Beta-Tester oder alle freigegeben werden können
export const FEATURES = ["alerts", "chat", "music", "fx", "triggers", "stinger", "banners", "themes", "minimes"] as const;
export type Feature = (typeof FEATURES)[number];
export type Level = "off" | "beta" | "all";

export type Access = {
  registration: "allowlist" | "open";
  allowlist: string[]; // dürfen sich anmelden, solange registration = allowlist
  beta: string[]; // bekommen zusätzlich Funktionen mit Stufe "beta"
  features: Record<Feature, Level>;
};

const norm = (login: string) => login.trim().toLowerCase();
const list = (value: unknown) => (Array.isArray(value) ? [...new Set(value.map(String).map(norm).filter(Boolean))] : []);

// Reine Prüfungen, getestet in access.check.ts
export function canUse(access: Access, admins: string[], login: string) {
  const name = norm(login);
  return admins.includes(name) || access.registration === "open" || access.allowlist.includes(name);
}

export function hasFeature(access: Access, admins: string[], login: string, feature: Feature) {
  const name = norm(login);
  const level = access.features[feature] ?? "all";
  return level === "all" || (level === "beta" && (admins.includes(name) || access.beta.includes(name)));
}

// Logins aus running, die nach dem Wechsel von before auf after keinen Zugang mehr haben (ihre Laufzeit stoppt sofort)
export function revokedLogins(before: Access, after: Access, admins: string[], running: readonly string[]) {
  return running.filter(login => canUse(before, admins, login) && !canUse(after, admins, login));
}

// Unvollständige oder fremde Eingaben auf gültige Werte bringen
export function sanitize(input: Partial<Access>): Access {
  const features = {} as Record<Feature, Level>;
  for (const feature of FEATURES) {
    const level = input.features?.[feature];
    features[feature] = level === "off" || level === "beta" || level === "all" ? level : "all";
  }
  return { registration: input.registration === "open" ? "open" : "allowlist", allowlist: list(input.allowlist), beta: list(input.beta), features };
}

export async function loadAccess(dataDir: string, admins: string[]) {
  const file = join(dataDir, "access.json");
  // Ohne Datei (oder kaputt): nur die Admins in der Allowlist
  let access = sanitize(await readFile(file, "utf8").then(text => JSON.parse(text) as Partial<Access>).catch(() => ({ allowlist: admins })));

  return {
    get: () => access,
    canUse: (login: string) => canUse(access, admins, login),
    hasFeature: (login: string, feature: Feature) => hasFeature(access, admins, login, feature),
    isAdmin: (login: string) => admins.includes(norm(login)),
    // Für ein Profil: welche Funktionen sind an
    features: (login: string) => Object.fromEntries(FEATURES.map(feature => [feature, hasFeature(access, admins, login, feature)])) as Record<Feature, boolean>,
    async save(next: Partial<Access>) {
      access = sanitize(next);
      await writeFile(`${file}.tmp`, JSON.stringify(access, null, 2));
      await rename(`${file}.tmp`, file);
      return access;
    },
  };
}
export type AccessStore = Awaited<ReturnType<typeof loadAccess>>;
