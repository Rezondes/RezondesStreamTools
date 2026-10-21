// Built-in sounds of the Dachdecker theme: a dull thump when the stamp hits the protocol and a soft rain noise in the
// BRB scene (filtered white noise in a loop). ?sound=0 switches them off, ?volume=0..1 adjusts them like all sounds.
import { numberParam, params } from "../../core/params.ts";
import { beep } from "../../core/sound.ts";

// fixed: the thump is a deep sine with a short knock on top
const THUMP = { low: 70, lowMs: 260, knock: 140, knockMs: 90 };
// fixed: two seconds of noise in a loop, filtered to a soft rush, quiet at full volume
const RAIN = { seconds: 2, cutoff: 1200, level: 0.25 };

export function playStamp() {
  beep(THUMP.low, THUMP.lowMs, 0, 1, "sine");
  beep(THUMP.knock, THUMP.knockMs, 0, 1, "triangle");
}

// Starts the rain noise at volume (0..1); the return value stops it
export function startRain(volume: number): () => void {
  if (params.get("sound") === "0") return () => {};
  const audio = new AudioContext();
  const noise = audio.createBuffer(1, audio.sampleRate * RAIN.seconds, audio.sampleRate);
  const samples = noise.getChannelData(0);
  for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
  const source = audio.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = RAIN.cutoff;
  const gain = audio.createGain();
  gain.gain.value = RAIN.level * volume * numberParam("volume", 1);
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start();
  return () => { source.stop(); void audio.close(); };
}
