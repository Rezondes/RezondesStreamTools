// Synthetische Pieptöne ohne Audiodateien. ?sound=0 schaltet ab, ?volume=0..1 regelt.
// In OBS bei der Browserquelle "Audio über OBS steuern" aktivieren, dann erscheint ein eigener Mixer-Kanal.
import { numberParam, params } from "./params.ts";

let audio: AudioContext | undefined;

export function beep(frequency: number, durationMs: number, delayMs = 0) {
  if (params.get("sound") === "0") return;
  audio ??= new AudioContext();
  const start = audio.currentTime + delayMs / 1000;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.08 * numberParam("volume", 1), start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + durationMs / 1000);
}
