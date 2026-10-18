// Built-in sounds of the Urlaub theme: a small steel drum melody when an alert appears, a soft tone on
// fade-out. They apply when no own file is chosen in the settings; the volume comes from the sound field.
import { beep, playSound } from "../../core/sound.ts";
import type { SoundValue } from "../../core/theme.ts";

// fixed: melody (C major triad upwards), length and spacing of the tones, overtones for the steel drum sound
const MELODY = [523, 659, 784, 1047];
const NOTE = { lengthMs: 320, stepMs: 120, overtone: 2, overtoneVolume: 0.35 };

export function playChime(sound: SoundValue) {
  playSound(sound, volume => {
    MELODY.forEach((frequency, index) => {
      beep(frequency, NOTE.lengthMs, index * NOTE.stepMs, volume, "sine");
      beep(frequency * NOTE.overtone, NOTE.lengthMs / 2, index * NOTE.stepMs, volume * NOTE.overtoneVolume, "triangle");
    });
  });
}

export const playLeave = (sound: SoundValue) => playSound(sound, volume => beep(392, 260, 0, volume, "sine"));
