// Built-in sounds of the Bärenbande theme: a soft marimba hop with a little whistle when an alert appears and a low
// wooden plop on fade-out. They apply when no own file is chosen in the settings; the volume comes from the sound field.
import { beep, playSound } from "../../core/sound.ts";
import type { SoundValue } from "../../core/theme.ts";

// fixed: melody (C major hop), length and spacing of the tones, the whistle an octave above the last tone
const MELODY = [523, 659, 784, 659, 1047];
const NOTE = { lengthMs: 150, stepMs: 95, whistle: 2, whistleMs: 260, whistleVolume: 0.35 };

export function playChime(sound: SoundValue) {
  playSound(sound, volume => {
    MELODY.forEach((frequency, index) => beep(frequency, NOTE.lengthMs, index * NOTE.stepMs, volume, "triangle"));
    const last = MELODY.length * NOTE.stepMs;
    beep(MELODY[MELODY.length - 1] * NOTE.whistle, NOTE.whistleMs, last, volume * NOTE.whistleVolume, "sine");
  });
}

export const playLeave = (sound: SoundValue) => playSound(sound, volume => beep(262, 180, 0, volume, "triangle"));

// A minime climbs one level of a tower: two rising marimba tones (the core calls it with the volume of the sound field)
export const climbTone = (volume: number) => {
  beep(392, 120, 0, volume, "triangle");
  beep(587, 140, 90, volume, "triangle");
};
