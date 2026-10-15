// Check für banners.ts des Starter-Themes: beide Banner zeichnen Titel und Text und sehen nach einer Schleife exakt
// gleich aus (nahtloses GIF). Ein Mock-Canvas zeichnet die Aufrufe auf. Läuft mit npm test.
import assert from "node:assert/strict";
import { drawStarterOfflineBanner, drawStarterProfileBanner, type StarterBannerOptions } from "./banners.ts";

function recorder() {
  const calls: unknown[][] = [];
  const gradient = { addColorStop: () => {} };
  const target: Record<string, unknown> = {
    measureText: () => ({ width: 300 }),
    createLinearGradient: () => gradient,
    createRadialGradient: (...args: unknown[]) => { calls.push(["radial", ...args]); return gradient; },
  };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (object, key: string, value) => { object[key] = value; return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

const options: StarterBannerOptions = {
  loop: 6, font: "Inter", background: "#0b0b12", accent: "#7c5cff", accent2: "#22d3ee", textColor: "#ffffff", mutedColor: "#a1a1b5",
  title: "REZONDES", profileText: "Programmieren", offlineTitle: "Gerade offline", offlineText: "Folge dem Kanal",
};

for (const draw of [drawStarterProfileBanner, drawStarterOfflineBanner]) {
  const start = recorder();
  const end = recorder();
  draw(start.context, 0, options);
  draw(end.context, options.loop, options);
  const round = (calls: unknown[][]) => JSON.stringify(calls, (_, value: unknown) => (typeof value === "number" ? Math.round(value * 1000) / 1000 : value));
  assert.equal(round(end.calls), round(start.calls), `${draw.name}: Schleife nicht nahtlos`);
  const texts = start.calls.filter(call => call[0] === "fillText").map(call => call[1]);
  assert.ok(texts.includes("REZONDES"), draw.name);
}

console.log("starter banners ok");
