// Verhalten der Minimes in der Szene: welche Aktion jedes Minime gerade macht, wohin es wandert, wann es erscheint
// und verschwindet. Eingebaut sind enter, exit, idle und walk; alles andere bringt das Theme als Katalog mit
// (Name, Dauer, Gewicht) und zeigt es über den Namen an. Rein (Regel 12): Zeit und Zufall kommen herein.
// Genutzt von hooks/useMinimes.ts. Check: minimeBehavior.check.ts.
import type { MinimeMotion } from "./minimeFields.ts";
import type { Minime } from "./types.ts";

// Themeeigene Aktion: weight 0 = kommt nie von selbst (z.B. die Reaktion auf Chat)
export type MinimeAction = { name: string; durationMs: number; weight: number };

// Ein Minime mit seiner laufenden Aktion. Position in px: fromX zu Beginn, toX am Ende (nur walk ändert sie).
// facing: 1 = schaut nach rechts, -1 = nach links. leaving: verschwindet gerade (exit) und fällt danach weg.
export type MinimeActor = Minime & {
  action: string;
  startedAt: number;
  durationMs: number;
  fromX: number;
  toX: number;
  facing: 1 | -1;
  leaving: boolean;
};

// Alles, was die Wahl braucht: Bewegung aus den Einstellungen, Katalog des Themes, Breite der Szene in px
export type MinimeStage = { motion: MinimeMotion; catalog: readonly MinimeAction[]; widthPx: number };

// fixed: Mindestdauer jeder Aktion, damit eine Dauer von 0 keine Schleife ohne Pause ergibt
const MIN_DURATION_MS = 50;

// Position zum Zeitpunkt now: während walk anteilig zwischen fromX und toX, sonst toX
export function positionAt(actor: MinimeActor, now: number): number {
  if (actor.action !== "walk" || actor.durationMs <= 0) return actor.toX;
  const progress = Math.min(1, Math.max(0, (now - actor.startedAt) / actor.durationMs));
  return actor.fromX + (actor.toX - actor.fromX) * progress;
}

const at = (actor: MinimeActor, action: string, now: number, durationMs: number, x: number): MinimeActor =>
  ({ ...actor, action, startedAt: now, durationMs: Math.max(MIN_DURATION_MS, durationMs), fromX: x, toX: x });

// Ziel einer Wanderung: Richtung zufällig; passt sie nicht ins Bild, die andere; passt keine, bis an den Rand
function walk(actor: MinimeActor, stage: MinimeStage, now: number, random: () => number): MinimeActor {
  const { marginPx, walkMinPx, walkMaxPx, speedPxPerS } = stage.motion;
  const low = marginPx, high = Math.max(marginPx, stage.widthPx - marginPx);
  const distance = walkMinPx + random() * (walkMaxPx - walkMinPx);
  const preferred: 1 | -1 = random() < 0.5 ? -1 : 1;
  const fits = (direction: number) => { const target = actor.toX + direction * distance; return target >= low && target <= high; };
  const facing: 1 | -1 = fits(preferred) || !fits(-preferred) ? preferred : preferred === 1 ? -1 : 1;
  const toX = Math.min(high, Math.max(low, actor.toX + facing * distance));
  const durationMs = (Math.abs(toX - actor.toX) / speedPxPerS) * 1000;
  return { ...actor, action: "walk", startedAt: now, durationMs: Math.max(MIN_DURATION_MS, durationMs), fromX: actor.toX, toX, facing };
}

// Nächste Aktion nach Gewicht: idle, walk oder eine aus dem Katalog; alle Gewichte 0 ergeben idle
export function nextAction(actor: MinimeActor, stage: MinimeStage, now: number, random: () => number): MinimeActor {
  const choices = [{ name: "idle", weight: stage.motion.idleWeight }, { name: "walk", weight: stage.motion.walkWeight }, ...stage.catalog];
  const total = choices.reduce((sum, choice) => sum + Math.max(0, choice.weight), 0);
  let rest = random() * total;
  const chosen = choices.find(choice => (rest -= Math.max(0, choice.weight)) < 0)?.name ?? "idle";
  if (chosen === "walk") return walk(actor, stage, now, random);
  const own = stage.catalog.find(action => action.name === chosen);
  if (own) return at(actor, own.name, now, own.durationMs, actor.toX);
  const { idleMinMs, idleMaxMs } = stage.motion;
  return at(actor, "idle", now, idleMinMs + random() * (idleMaxMs - idleMinMs), actor.toX);
}

// Gezeigte Minimes an die Liste vom Server anpassen: Neue erscheinen (enter) an zufälliger Stelle, Fehlende
// verschwinden (exit), Bekannte übernehmen Name und Farbe, wer während exit zurückkommt, erscheint dort neu
export function syncRoster(actors: readonly MinimeActor[], minimes: readonly Minime[], stage: MinimeStage, now: number, random: () => number): MinimeActor[] {
  const wanted = new Map(minimes.map(minime => [minime.login, minime]));
  const shown = actors.map(actor => {
    const minime = wanted.get(actor.login);
    if (!minime) return actor.leaving ? actor : { ...at(actor, "exit", now, stage.motion.exitMs, positionAt(actor, now)), leaving: true };
    if (actor.leaving) return { ...at(actor, "enter", now, stage.motion.enterMs, actor.toX), ...minime, leaving: false };
    return { ...actor, ...minime };
  });
  const known = new Set(actors.map(actor => actor.login));
  const span = Math.max(0, stage.widthPx - 2 * stage.motion.marginPx);
  const joined = minimes.filter(minime => !known.has(minime.login)).map(minime => {
    const x = stage.motion.marginPx + random() * span;
    return { ...minime, action: "enter", startedAt: now, durationMs: Math.max(MIN_DURATION_MS, stage.motion.enterMs), fromX: x, toX: x, facing: 1 as const, leaving: false };
  });
  return [...shown, ...joined];
}

// Abgelaufene Aktionen weiterschalten, Verschwundene entfernen. Ohne Änderung bleibt actors dasselbe Array.
export function advance(actors: readonly MinimeActor[], stage: MinimeStage, now: number, random: () => number): readonly MinimeActor[] {
  const ended = (actor: MinimeActor) => actor.startedAt + actor.durationMs <= now;
  if (!actors.some(ended)) return actors;
  return actors.filter(actor => !(actor.leaving && ended(actor))).map(actor => (ended(actor) ? nextAction(actor, stage, now, random) : actor));
}

// Wann die nächste Aktion endet; null = keine Minimes
export function nextEnd(actors: readonly MinimeActor[]): number | null {
  return actors.length ? Math.min(...actors.map(actor => actor.startedAt + actor.durationMs)) : null;
}

// Reaktion auf Chat: unterbricht alles ausser Erscheinen und Verschwinden, an der aktuellen Stelle
export function react(actor: MinimeActor, reaction: MinimeAction, now: number): MinimeActor {
  if (actor.leaving || actor.action === "enter" || actor.action === "exit") return actor;
  return at(actor, reaction.name, now, reaction.durationMs, positionAt(actor, now));
}
