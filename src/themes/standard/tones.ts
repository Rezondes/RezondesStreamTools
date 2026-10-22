// Built-in sounds of the standard theme: a clear two-tone notification chime (a bell rising a fifth, with a soft
// octave shimmer) when an alert appears and a short falling tone on fade-out. They apply when no own file is chosen in
// the settings; the volume comes from the sound field.
import { beep, playSound } from "../../core/sound.ts";
import type { SoundValue } from "../../core/theme.ts";

// fixed: the two bell tones (A5, E6), how long they ring, their spacing, the octave shimmer over each and its volume
const CHIME = [880, 1319];
const NOTE = { lengthMs: 420, stepMs: 140, shimmer: 2, shimmerMs: 180, shimmerVolume: 0.25 };

export function playChime(sound: SoundValue) {
  playSound(sound, volume => {
    CHIME.forEach((frequency, index) => {
      beep(frequency, NOTE.lengthMs, index * NOTE.stepMs, volume, "sine");
      beep(frequency * NOTE.shimmer, NOTE.shimmerMs, index * NOTE.stepMs, volume * NOTE.shimmerVolume, "sine");
    });
  });
}

// fixed: E5 falling to A4
export const playLeave = (sound: SoundValue) => playSound(sound, volume => {
  beep(659, 140, 0, volume, "sine");
  beep(440, 220, 110, volume, "sine");
});
