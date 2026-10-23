// Messages of the dashboard after an action: toast(text) for success and neutral news, it goes away by itself;
// reportError(text, details) for every error, it opens a dialog that must be closed and offers the details (what
// failed, code, time) to copy for the admin. Errors never come as a toast. Notices.tsx shows both in the look of the
// active skin. A small store outside React, so plain api calls can report too. Check: notices.check.ts.

type Toast = { id: number; text: string };
type ErrorNotice = { id: number; text: string; details: string };

// How long a toast stays in ms
const TOAST_MS = 4000;

let toasts: readonly Toast[] = [];
let errors: readonly ErrorNotice[] = [];
let next = 0;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach(listener => listener());

export function dismissToast(id: number) {
  toasts = toasts.filter(item => item.id !== id);
  changed();
}

export function toast(text: string, stayMs = TOAST_MS) {
  const id = next++;
  toasts = [...toasts, { id, text }];
  changed();
  setTimeout(() => dismissToast(id), stayMs);
}

// details: what the admin needs to find the problem, one "name: value" line each; the time is added
export function reportError(text: string, details: Record<string, string>, now = new Date()) {
  const lines = [`Fehler: ${text}`, ...Object.entries(details).map(([name, value]) => `${name}: ${value}`), `Zeit: ${now.toISOString()}`];
  errors = [...errors, { id: next++, text, details: lines.join("\n") }];
  changed();
}

// The shown error was closed; the next one follows
export function closeError() {
  errors = errors.slice(1);
  changed();
}

// For useSyncExternalStore
export const subscribeNotices = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export const currentToasts = () => toasts;
export const currentError = () => errors[0] ?? null;
