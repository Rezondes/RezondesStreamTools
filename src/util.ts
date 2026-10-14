import { useEffect, useState } from "react";

// Parameter aus ?a=1 und aus #/szene?a=1, damit beide Schreibweisen in OBS funktionieren
export const params = new URLSearchParams(
  [location.search.slice(1), location.hash.split("?")[1] ?? ""].filter(Boolean).join("&"),
);
export const num = (key: string, fallback: number) => {
  const v = Number(params.get(key));
  return params.has(key) && Number.isFinite(v) ? v : fallback;
};

export const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789{}<>=;#ABCDEF";
export const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// "Entschlüsseln": Text erscheint von links, davor läuft ein Streifen zufälliger Zeichen
export function useDecode(text: string, delay = 0, msPerChar = 28) {
  const [out, setOut] = useState("");
  useEffect(() => {
    const chars = Array.from(text);
    const start = performance.now() + delay;
    let raf = 0;
    const tick = (now: number) => {
      const t = now - start;
      const done = Math.max(0, Math.floor(t / msPerChar));
      setOut(t < 0 ? "" : chars.map((c, i) => (i < done ? c : i < done + 6 && c !== " " ? glyph() : i < done + 6 ? " " : "")).join(""));
      if (done < chars.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay, msPerChar]);
  return out;
}

// Sekunden-Takt für Uhren und Countdowns
export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");
export const clock = (secs: number) => `${pad(secs / 3600)}:${pad((secs % 3600) / 60)}:${pad(secs % 60)}`;

// Synthetische Pieptöne, keine Audiodateien nötig. ?sound=0 schaltet ab, ?volume=0..1 regelt.
// In OBS bei der Browserquelle "Audio über OBS steuern" aktivieren, dann erscheint ein eigener Mixer-Kanal.
let audio: AudioContext | undefined;
export function beep(freq: number, ms: number, delay = 0) {
  if (params.get("sound") === "0") return;
  audio ??= new AudioContext();
  const t = audio.currentTime + delay / 1000;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.08 * num("volume", 1), t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + ms / 1000);
}
