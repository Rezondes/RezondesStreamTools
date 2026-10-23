// Sounds of the overlays: own file from the media folder or synthetic beeps of the theme.
// ?sound=0 switches off (previews in the dashboard); the volume comes from the settings and the OBS mixer.
// In OBS enable "Control audio via OBS" on the browser source, then an own mixer channel appears.
import { mediaUrl } from "./connection.ts";
import { params } from "./params.ts";
import type { SoundValue } from "./theme.ts";

let audio: AudioContext | undefined;

// wave: timbre (square = beeping of the matrix, sine/triangle = softer, e.g. steel drum)
export function beep(frequency: number, durationMs: number, delayMs = 0, volume = 1, wave: OscillatorType = "square") {
  if (params.get("sound") === "0") return;
  audio ??= new AudioContext();
  const start = audio.currentTime + delayMs / 1000;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = wave;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.08 * volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + durationMs / 1000);
}

// Sound from the settings: with a file play it, otherwise builtIn (the theme's built-in sound) at the volume
export function playSound(sound: SoundValue, builtIn: (volume: number) => void) {
  if (params.get("sound") === "0") return;
  if (!sound.file) return builtIn(sound.volume);
  const audio = new Audio(mediaUrl(sound.file));
  audio.volume = Math.min(1, sound.volume);
  audio.play().catch((error: unknown) => console.warn("Sound blocked:", error));
}
