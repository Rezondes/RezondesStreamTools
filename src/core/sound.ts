// Töne der Overlays: eigene Datei aus dem Medienordner oder synthetische Pieptöne des Themes.
// ?sound=0 schaltet ab, ?volume=0..1 regelt zusätzlich.
// In OBS bei der Browserquelle "Audio über OBS steuern" aktivieren, dann erscheint ein eigener Mixer-Kanal.
import { mediaUrl } from "./connection.ts";
import { numberParam, params } from "./params.ts";
import type { SoundValue } from "./theme.ts";

let audio: AudioContext | undefined;

export function beep(frequency: number, durationMs: number, delayMs = 0, volume = 1) {
  if (params.get("sound") === "0") return;
  audio ??= new AudioContext();
  const start = audio.currentTime + delayMs / 1000;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.08 * volume * numberParam("volume", 1), start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + durationMs / 1000);
}

// Ton aus den Einstellungen: mit Datei diese abspielen, sonst builtIn (der eingebaute Ton des Themes) mit der Lautstärke
export function playSound(sound: SoundValue, builtIn: (volume: number) => void) {
  if (params.get("sound") === "0") return;
  if (!sound.file) return builtIn(sound.volume);
  const audio = new Audio(mediaUrl(sound.file));
  audio.volume = Math.min(1, sound.volume * numberParam("volume", 1));
  audio.play().catch((error: unknown) => console.warn("Sound blocked:", error));
}
