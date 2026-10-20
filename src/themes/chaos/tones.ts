// Built-in sounds of the Chaos theme: a quick rising synth zap with a glitchy echo when an alert appears and a short falling
// blip on fade-out. They apply when no own file is chosen in the settings; the volume comes from the sound field.
import { beep, playSound } from "../../core/sound.ts";
import type { SoundValue } from "../../core/theme.ts";

// fixed: notes of the zap (an A minor run upward), length and spacing, the echo an octave down and quieter
const ZAP = [440, 523, 659, 880, 1319];
const NOTE = { lengthMs: 70, stepMs: 45, echoMs: 120, echoDelayMs: 300, echoVolume: 0.4, echo: 0.5 };

export function playZap(sound: SoundValue) {
  playSound(sound, volume => {
    ZAP.forEach((frequency, index) => beep(frequency, NOTE.lengthMs, index * NOTE.stepMs, volume, "sawtooth"));
    ZAP.slice(-2).forEach((frequency, index) => beep(frequency * NOTE.echo, NOTE.echoMs, NOTE.echoDelayMs + index * NOTE.stepMs, volume * NOTE.echoVolume, "square"));
  });
}

export const playFade = (sound: SoundValue) => playSound(sound, volume => {
  beep(330, 90, 0, volume, "square");
  beep(220, 140, 70, volume, "square");
});
