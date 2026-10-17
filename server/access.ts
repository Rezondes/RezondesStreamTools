// Who may log in, and who gets which feature. Stored in data/access.json, editable by admins in the
// dashboard. Admins (ADMINS in server.env) may always do everything.
import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Features that can be released individually for beta testers or for everyone
export const FEATURES = ["alerts", "chat", "music", "fx", "triggers", "stinger", "banners", "themes", "minimes"] as const;
export type Feature = (typeof FEATURES)[number];
export type Level = "off" | "beta" | "all";

export type Access = {
  registration: "allowlist" | "open";
  allowlist: string[]; // may log in while registration = allowlist
  beta: string[]; // additionally get features with level "beta"
  features: Record<Feature, Level>;
};

const norm = (login: string) => login.trim().toLowerCase();
const list = (value: unknown) => (Array.isArray(value) ? [...new Set(value.map(String).map(norm).filter(Boolean))] : []);

// Pure checks, tested in access.check.ts
export function canUse(access: Access, admins: string[], login: string) {
  const name = norm(login);
  return admins.includes(name) || access.registration === "open" || access.allowlist.includes(name);
}

export function hasFeature(access: Access, admins: string[], login: string, feature: Feature) {
  const name = norm(login);
  const level = access.features[feature] ?? "all";
  return level === "all" || (level === "beta" && (admins.includes(name) || access.beta.includes(name)));
}

// Logins from running that lose access when switching from before to after (their runtime stops immediately)
export function revokedLogins(before: Access, after: Access, admins: string[], running: readonly string[]) {
  return running.filter(login => canUse(before, admins, login) && !canUse(after, admins, login));
}

// Brings incomplete or foreign input to valid values
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
  // Without a file (or a broken one): only the admins in the allowlist
  let access = sanitize(await readFile(file, "utf8").then(text => JSON.parse(text) as Partial<Access>).catch(() => ({ allowlist: admins })));

  return {
    get: () => access,
    canUse: (login: string) => canUse(access, admins, login),
    hasFeature: (login: string, feature: Feature) => hasFeature(access, admins, login, feature),
    isAdmin: (login: string) => admins.includes(norm(login)),
    // For a profile: which features are on
    features: (login: string) => Object.fromEntries(FEATURES.map(feature => [feature, hasFeature(access, admins, login, feature)])) as Record<Feature, boolean>,
    async save(next: Partial<Access>) {
      access = sanitize(next);
      await writeFile(`${file}.tmp`, JSON.stringify(access, null, 2));
      await rename(`${file}.tmp`, file);
      return access;
    },
  };
}
