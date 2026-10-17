// Built-in sounds of the matrix alerts: a small modem greeting on open, a low tone on fade-out.
// They apply when no own file is chosen in the settings; the volume comes from the sound field.
import { beep, playSound } from "../../core/sound.ts";
import type { SoundValue } from "../../core/theme.ts";

export function playOpen(sound: SoundValue) {
  playSound(sound, volume => {
    [880, 1320, 660, 1760].forEach((frequency, index) => beep(frequency, 90, index * 85, volume));
    beep(2640, 40, 900, volume);
  });
}

export const playLeave = (sound: SoundValue) => playSound(sound, volume => beep(440, 120, 0, volume));
