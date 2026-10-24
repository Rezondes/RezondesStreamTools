// Sounds of the overlays: own file from the media folder or synthetic beeps of the theme.
// ?sound=0 switches off (previews in the dashboard); the volume comes from the settings and the OBS mixer.
// In OBS enable "Control audio via OBS" on the browser source, then an own mixer channel appears.
import { admitVoice, type ClipVoice } from "./clipVoices.ts";
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

// Built-in sounds as files of the theme (Vite import, in the offline build a data URL): each URL is fetched and
// decoded once, then played through Web Audio under a limit of simultaneous voices (oldest give way, clipVoices.ts).
// fixed: browser audio voices, the most clips at once whatever a theme sets
const maxVoices = 32;
const clips = new Map<string, Promise<AudioBuffer | undefined>>();
const voices: (ClipVoice & { source: AudioBufferSourceNode })[] = [];
let nextVoice = 1;

function loadClip(url: string) {
  let clip = clips.get(url);
  if (!clip) {
    clip = fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then(data => (audio ??= new AudioContext()).decodeAudioData(data))
      .catch((error: unknown) => {
        console.warn("Sound clip failed:", url, error);
        return undefined;
      });
    clips.set(url, clip);
  }
  return clip;
}

// Loads the clips ahead (start of the scene), so the first sound does not come late
export function preloadClips(urls: readonly string[]) {
  if (params.get("sound") === "0") return;
  for (const url of urls) void loadClip(url);
}

// voices: the theme's limit of simultaneous voices (a setting), capped by maxVoices
export type ClipOptions = { voices?: number };

export function playClip(url: string, volume: number, options: ClipOptions = {}) {
  if (params.get("sound") === "0") return;
  void loadClip(url).then(buffer => {
    if (!buffer || !audio) return;
    const decision = admitVoice(voices, Math.min(maxVoices, options.voices ?? maxVoices));
    if (!decision.admit) return;
    for (const id of decision.stop) voices.find(voice => voice.id === id)?.source.stop();
    const source = audio.createBufferSource();
    const gain = audio.createGain();
    source.buffer = buffer;
    gain.gain.value = Math.min(1, Math.max(0, volume));
    source.connect(gain).connect(audio.destination);
    const voice = { id: nextVoice++, startedAt: audio.currentTime, source };
    voices.push(voice);
    source.onended = () => {
      const index = voices.indexOf(voice);
      if (index >= 0) voices.splice(index, 1);
    };
    source.start();
  });
}

// Sound from the settings: with a file play it, otherwise builtIn (the theme's built-in sound) at the volume
export function playSound(sound: SoundValue, builtIn: (volume: number) => void) {
  if (params.get("sound") === "0") return;
  if (!sound.file) return builtIn(sound.volume);
  const audio = new Audio(mediaUrl(sound.file));
  audio.volume = Math.min(1, sound.volume);
  audio.play().catch((error: unknown) => console.warn("Sound blocked:", error));
}
